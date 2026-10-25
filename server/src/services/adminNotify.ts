import { beijingDate } from './pets.ts';

/**
 * 新上传与资料删除申请的 Slack 通知：用 chat.postMessage 发给 SLACK_NOTIFY_CHANNEL（Bob 的 Slack 用户 ID 即私信）。
 * 只在保存成功后发送；发送失败只记日志，不影响玩家的请求。照片不随通知发出（原文件可能带 EXIF），仍用 submissions.ts 取走。
 */
export type AdminEvent =
  | { kind: 'submission'; submissionId: string; playerId: string; playerName: string; petName: string; ownerQuote: string | null; contentType: string; sizeBytes: number; at: Date }
  | { kind: 'deletion'; requestId: string; playerId: string; playerName: string; petId: string | null; petName: string | null; note: string | null; at: Date };

export type AdminNotifier = (event: AdminEvent) => Promise<void>;

/** 玩家填写的文字原样转义，避免拼出 <!channel> 之类的提及或链接。 */
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const beijingTime = (at: Date) =>
  `${beijingDate(at)} ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(at)}`;

export function formatAdminEvent(event: AdminEvent): string {
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
      '取走照片：`OBJECT_STORE=r2 npx tsx scripts/submissions.ts pull --yes --prod`',
    ].join('\n');
  }
  return [
    ':wastebasket: *新的资料删除申请*',
    `申请人：${who}`,
    `宠物：${event.petId ? `${escape(event.petName ?? event.petId)}（\`${event.petId}\`）` : '一般申请（未指定宠物）'}`,
    ...(event.note ? [`补充说明：${escape(event.note)}`] : []),
    `时间：${beijingTime(event.at)}（北京）`,
    `编号：\`${event.requestId}\``,
    '查看与处理：`npx tsx scripts/deletions.ts list --prod`',
  ].join('\n');
}

export function slackAdminNotifier(
  token: string | undefined,
  channel: string | undefined,
  options: { fetchImpl?: typeof fetch } = {},
): AdminNotifier | null {
  if (!token || !channel) return null;
  const doFetch = options.fetchImpl ?? fetch;
  return async (event) => {
    const res = await doFetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel, text: formatAdminEvent(event), unfurl_links: false, unfurl_media: false }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!json.ok) throw new Error(`slack chat.postMessage: ${json.error ?? res.status}`);
  };
}
