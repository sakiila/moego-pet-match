import { useState } from 'react';
import type { PawBookView, PetPaw } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import type { PawBookState } from '../../game/pawBook';
import { PawBook } from './PawBook';

const noop=()=>{};
const rows: PetPaw[] = ['Mia','Alex','Lily'].map((name,i)=>({id:String(i+1),sender:{userId:name,name},message:(['pets','love','play'] as const)[i],
  version:1,createdAt:'2026-10-26T10:00:00Z',reply:i===2?{owner:{userId:'Bob',name:'Bob'},at:'2026-10-26T11:00:00Z'}:null,unreadMessage:false,unreadReply:false}));
const ownerRows=rows.map((p,i)=>({...p,unreadMessage:i<2}));
const base: PawBookView={petId:'pet_644053d683e0',petName:'Maodu 毛肚',own:false,count:3,unreadCount:0,mine:null,mineVersion:0,entries:rows,nextCursor:null};
const initial: PawBookState={view:base,loading:false,loadingMore:false,sending:false,error:null,unavailable:false,celebration:0};
function Preview({value=initial,inline=true}:{value?:PawBookState;inline?:boolean}) {
  const [state,set]=useState(value);
  return <PawBook inline={inline} petName={state.view?.petName??base.petName} stickerSrc="/img/pets/pet_644053d683e0/128" avatarSrc={()=>null} state={state}
    onChange={message=>set(s=>({...s,view:s.view?{...s.view,mine:message?{...rows[2],message,sender:{userId:'me',name:'Me'}}:null,count:message?4:3}:null,celebration:s.celebration+1}))}
    onReply={paw=>set(s=>({...s,view:s.view?{...s.view,entries:s.view.entries.map(p=>p.id===paw.id?{...p,reply:{owner:{userId:'Bob',name:'Bob'},at:'2026-10-26T11:00:00Z'}}:p)}:null}))}
    onRetry={noop} onMore={noop} onRead={noop} onClose={noop} />;
}
const entry:GalleryEntry={name:'PawBook',group:'components',states:{
  default:()=> <Preview />,
  'selected and replied':()=> <Preview value={{...initial,view:{...base,mine:rows[2],entries:rows.slice(0,2)}}} />,
  owner:()=> <Preview value={{...initial,view:{...base,own:true,unreadCount:2,entries:ownerRows}}} />,
  'empty visitor':()=> <Preview value={{...initial,view:{...base,count:0,entries:[]}}} />,
  'empty owner':()=> <Preview value={{...initial,view:{...base,own:true,count:0,entries:[]}}} />,
  'only mine':()=> <Preview value={{...initial,view:{...base,count:1,mine:rows[2],entries:[]}}} />,
  loading:()=> <Preview value={{...initial,view:null,loading:true}} />,
  sending:()=> <Preview value={{...initial,sending:true}} />,
  'load error':()=> <Preview value={{...initial,view:null,error:'load'}} />,
  'send error':()=> <Preview value={{...initial,error:'send'}} />,
  unavailable:()=> <Preview value={{...initial,view:null,unavailable:true}} />,
  'long English names':()=> <Preview value={{...initial,view:{...base,own:true,petName:'Sir Fluffington the Third of Shanghai',entries:rows.map(p=>({...p,sender:{...p.sender,name:'Alexandria Montgomery-Smith Featherstonehaugh'}}))}}} />,
  'fish paper':()=> <FishFrame><Preview /></FishFrame>,
  'mobile visitor':()=> <Preview inline={false} value={{...initial,view:{...base,mine:rows[2],entries:rows.slice(0,2)}}} />,
  'mobile owner':()=> <Preview inline={false} value={{...initial,view:{...base,own:true,unreadCount:2,entries:ownerRows}}} />,
}};
export default entry;
