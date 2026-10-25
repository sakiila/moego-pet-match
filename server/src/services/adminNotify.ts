import sharp from 'sharp';
import { beijingDate } from './pets.ts';

/**
 * 新上传与资料删除申请的 Slack 通知：用 chat.postMessage 发给 SLACK_NOTIFY_CHANNEL（Bob 的 Slack 用户 ID 即私信）。
 * 只在保存成功后发送；发送失败只记日志，不影响玩家的请求。
 * 上传通知附一张预览照片：摆正、缩到长边 1600 并重新编码为 JPEG，拍摄位置等 EXIF 不随之发出；
 * 服务器解不了的格式（HEIC）或上传照片失败时只发文字并注明原因，原文件仍用 submissions.ts 取走。
 */
export type AdminEvent =
  | { kind: 'submission'; submissionId: string; playerId: string; playerName: string; petName: string; ownerQuote: string | null; contentType: string; sizeBytes: number; at: Date; file?: Buffer }
  | { kind: 'deletion'; requestId: string; playerId: string; playerName: string; petId: string | null; petName: string | null; note: string | null; at: Date };

export type AdminNotifier = (event: AdminEvent) => Promise<void>;

/** 玩家填写的文字原样转义，避免拼出 <!channel> 之类的提及或链接。 */
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const beijingTime = (at: Date) =>
  `${beijingDate(at)} ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(at)}`;

/** 预览照片：去掉全部元数据的 JPEG；解不了的格式返回 null。 */
export async function photoPreview(file: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(file).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  } catch {
    return null;
  }
}

export function formatAdminEvent(event: AdminEvent, photoNote?: string): string {
  const who = `${escape(event.playerName)}（<@${event.playerId}>）`;
  if (event.kind === 'submission') {
    return [
      ':camera_with_flash: *新的宠物照片上传*',
      `主人：${who}`,
      `宠物名：${escape(event.petName)}`,
      ...(event.ownerQuote ? [`主人说：${escape(event.ownerQuote)}`] : []),
      `文件：${event.contentType} · ${Math.max(1, Math.round(event.sizeBytes / 1024))} KB`,
      `时间：${beijingTime(event.at)}（北京）`,
      `编号：\`${event.submissionId}\``,
      ...(photoNote ? [`_${photoNote}_`] : []),
      '取走原文件：`OBJECT_STORE=r2 npx tsx --env-file-if-exists=../.env scripts/submissions.ts pull --yes --prod`',
    ].join('\n');
  }
  return [
    ':wastebasket: *新的资料删除申请*',
    `申请人：${who}`,
    `宠物：${event.petId ? `${escape(event.petName ?? event.petId)}（\`${event.petId}\`）` : '一般申请（未指定宠物）'}`,
    ...(event.note ? [`补充说明：${escape(event.note)}`] : []),
    `时间：${beijingTime(event.at)}（北京）`,
    `编号：\`${event.requestId}\``,
    '查看与处理：`npx tsx --env-file-if-exists=../.env scripts/deletions.ts list --prod`',
  ].join('\n');
}

type SlackResponse = { ok?: boolean; error?: string } & Record<string, unknown>;

/**
 * 发送需要的 Bot 权限：chat:write；附照片另需 files:write，接收人是用户 ID 时还需 im:write（打开私信频道）。
 * 接收人可填用户 ID（U / W 开头，发私信）或频道 ID。
 */
export function slackAdminNotifier(
  token: string | undefined,
  channel: string | undefined,
  options: { fetchImpl?: typeof fetch } = {},
): AdminNotifier | null {
  if (!token || !channel) return null;
  const doFetch = options.fetchImpl ?? fetch;
  const auth = { authorization: `Bearer ${token}` };
  const call = async (method: string, init: RequestInit): Promise<SlackResponse> => {
    const res = await doFetch(`https://slack.com/api/${method}`, { method: 'POST', ...init, headers: { ...auth, ...init.headers } });
    const json = (await res.json()) as SlackResponse;
    if (!json.ok) throw new Error(`slack ${method}: ${json.error ?? res.status}`);
    return json;
  };
  const postJson = (method: string, body: object) =>
    call(method, { headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });

  // 上传文件要频道 ID；发给用户时先打开私信频道，结果缓存
  let dmChannel: string | null = /^[UW]/.test(channel) ? null : channel;
  const channelId = async () => {
    if (!dmChannel) dmChannel = ((await postJson('conversations.open', { users: channel })).channel as { id: string }).id;
    return dmChannel;
  };

  const postText = (text: string) => postJson('chat.postMessage', { channel, text, unfurl_links: false, unfurl_media: false });

  const postWithPhoto = async (text: string, photo: Buffer, filename: string) => {
    const target = await channelId();
    const ticket = await call('files.getUploadURLExternal', { body: new URLSearchParams({ filename, length: String(photo.length) }) });
    const upload = await doFetch(ticket.upload_url as string, { method: 'POST', body: new Uint8Array(photo) });
    if (!upload.ok) throw new Error(`slack upload: ${upload.status}`);
    await postJson('files.completeUploadExternal', { files: [{ id: ticket.file_id, title: filename }], channel_id: target, initial_comment: text });
  };

  return async (event) => {
    if (event.kind !== 'submission' || !event.file) return void (await postText(formatAdminEvent(event)));
    const photo = await photoPreview(event.file);
    if (!photo) return void (await postText(formatAdminEvent(event, '这种格式服务器无法生成预览，照片请用下面的命令取走')));
    try {
      await postWithPhoto(formatAdminEvent(event), photo, `${event.submissionId}.jpg`);
    } catch (error) {
      // 照片没发出去也要让 Bob 知道有新上传
      await postText(formatAdminEvent(event, `照片没能附上（${error instanceof Error ? error.message : 'unknown'}），请用下面的命令取走`));
    }
  };
}
