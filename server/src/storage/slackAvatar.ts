/** 按 Slack 用户 ID 取头像：users.info → image_192 → 下载。只接受 Slack 自有图片域名。 */
export type AvatarFetcher = (userId: string) => Promise<{ body: Buffer; contentType: string } | null>;

export function slackAvatarFetcher(token: string | undefined): AvatarFetcher {
  return async (userId) => {
    if (!token) return null;
    const info = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = (await info.json()) as { ok?: boolean; user?: { profile?: { image_192?: string } } };
    const url = json.ok ? json.user?.profile?.image_192 : undefined;
    if (!url) return null;
    const host = new URL(url).hostname;
    if (!host.endsWith('slack-edge.com') && !host.endsWith('slack.com')) return null;
    const img = await fetch(url);
    if (!img.ok) return null;
    return { body: Buffer.from(await img.arrayBuffer()), contentType: img.headers.get('content-type') ?? 'image/jpeg' };
  };
}
