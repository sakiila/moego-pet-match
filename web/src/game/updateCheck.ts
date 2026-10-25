import type { VersionInfo } from '../api/types';

/**
 * 旧页面是否该刷新：服务端的构建版本和本地包不同，或引擎规则版本不同。
 * 规则版本不同时旧页面打完的对局会被结算拒绝，所以无论构建版本是否可知都提示；
 * 服务端没有构建版本（本地开发）且规则一致、或根本没读到，都不提示。
 */
export function needsRefresh(local: VersionInfo, remote: VersionInfo | null): boolean {
  if (!remote) return false;
  if (remote.rulesVersion !== local.rulesVersion) return true;
  return remote.version !== null && remote.version !== local.version;
}
