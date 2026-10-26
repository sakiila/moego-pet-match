import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { PawBookView, PetPaw } from '../api/types';
import { createPawBookController, type PawBookApi } from './pawBook';

const paw: PetPaw = { id: '1', sender: {userId:'viewer',name:'Mia'}, message:'play', version:1,
  createdAt:'2026-10-26T10:00:00Z', reply:null, unreadMessage:false, unreadReply:false };
const view: PawBookView = { petId:'pet',petName:'Maodu',own:false,count:0,unreadCount:0,mine:null,mineVersion:0,entries:[],nextCursor:null };
function deferred<T>() { let resolve!: (v:T) => void; const promise=new Promise<T>(r => {resolve=r;}); return {promise,resolve}; }
function setup(over: Partial<PawBookApi> = {}) {
  const api: PawBookApi = { getPawBook:vi.fn(async()=>view), changePaw:vi.fn(async()=>({...view,count:1,mine:paw,mineVersion:1})),
    replyPaw:vi.fn(async()=>view),readPaws:vi.fn(async()=>({ok:true as const})),...over };
  const changed=vi.fn();
  return { api,changed,controller:createPawBookController('pet','viewer',api,changed) };
}

describe('爪印簿请求竞争', () => {
  it('连续点击只发送一次，提交前保持最后确认状态', async () => {
    const pending=deferred<PawBookView>();
    const {api,controller}=setup({changePaw:vi.fn(()=>pending.promise)});
    await controller.refresh();
    const first=controller.change('play');
    await controller.change('love');
    expect(api.changePaw).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({sending:true,view:{count:0,mine:null}});
    pending.resolve({...view,count:1,mine:paw,mineVersion:1}); await first;
    expect(controller.getSnapshot()).toMatchObject({sending:false,view:{count:1,mineVersion:1}});
  });
  it('先发出的读取晚返回时不能覆盖刚保存的留言', async () => {
    const stale=deferred<PawBookView>();
    const load=vi.fn().mockResolvedValueOnce(view).mockImplementationOnce(()=>stale.promise);
    const {controller}=setup({getPawBook:load});
    await controller.refresh(); const old=controller.refresh();
    await controller.change('play'); stale.resolve(view); await old;
    expect(controller.getSnapshot().view?.mine?.message).toBe('play');
  });
  it('切换身份/宠物后不接收旧提交结果，也不发送更新通知', async () => {
    const pending=deferred<PawBookView>();
    const {controller,changed}=setup({changePaw:()=>pending.promise});
    await controller.refresh(); const task=controller.change('play'); controller.dispose();
    pending.resolve({...view,mine:paw}); await task;
    expect(controller.getSnapshot().view?.mine).toBeNull(); expect(changed).not.toHaveBeenCalled();
  });
  it('超时后重新读取权威状态，不自动重发；已有保存可被确认', async () => {
    const load=vi.fn().mockResolvedValueOnce(view).mockResolvedValueOnce({...view,mine:paw,mineVersion:1,count:1});
    const {controller,api}=setup({getPawBook:load,changePaw:vi.fn(async()=>{throw new Error('timeout');})});
    await controller.refresh(); await controller.change('play');
    expect(api.changePaw).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({sending:false,error:null,view:{mine:{message:'play'}}});
  });
  it('下架或资格失效后清除旧数据，避免仍然展示可操作簿', async () => {
    const load=vi.fn().mockResolvedValueOnce({...view,mine:paw}).mockRejectedValueOnce(new ApiError('not_found'));
    const {controller}=setup({getPawBook:load});
    await controller.refresh(); await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({view:null,unavailable:true});
  });
  it('已读仅发送实际看见的 ID 与种类，其他未读记录保留', async () => {
    const {controller,api}=setup({getPawBook:async()=>({...view,own:true,count:2,unreadCount:2,
      entries:[{...paw,unreadMessage:true},{...paw,id:'2',unreadMessage:true}]})});
    await controller.refresh(); await controller.read('1','message');
    expect(api.readPaws).toHaveBeenCalledWith('pet','viewer',['1'],'message');
    expect(controller.getSnapshot().view).toMatchObject({unreadCount:1,entries:[{unreadMessage:false},{unreadMessage:true}]});
  });
  it('主人不能留言，访客不能回爪', async () => {
    const own=setup({getPawBook:async()=>({...view,own:true})});
    await own.controller.refresh(); await own.controller.change('cute');
    expect(own.api.changePaw).not.toHaveBeenCalled();
    const visitor=setup(); await visitor.controller.refresh(); await visitor.controller.reply(paw);
    expect(visitor.api.replyPaw).not.toHaveBeenCalled();
  });
});
