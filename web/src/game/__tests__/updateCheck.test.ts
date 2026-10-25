import { describe, expect, it } from 'vitest';
import { needsRefresh } from '../updateCheck';

const local = { version: '20261025.15', rulesVersion: 5 };

describe('版本比对：是否提示刷新', () => {
  it('构建版本与规则版本都一致：不提示', () => {
    expect(needsRefresh(local, { version: '20261025.15', rulesVersion: 5 })).toBe(false);
  });

  it('服务端换了构建版本：提示', () => {
    expect(needsRefresh(local, { version: '20261025.16', rulesVersion: 5 })).toBe(true);
  });

  it('规则版本不同：无论构建版本是否可知都提示', () => {
    expect(needsRefresh(local, { version: '20261025.15', rulesVersion: 6 })).toBe(true);
    expect(needsRefresh(local, { version: null, rulesVersion: 6 })).toBe(true);
  });

  it('服务端不知道自己的构建版本（本地开发）且规则一致：不提示', () => {
    expect(needsRefresh(local, { version: null, rulesVersion: 5 })).toBe(false);
  });

  it('没读到服务端版本：不提示', () => {
    expect(needsRefresh(local, null)).toBe(false);
  });
});
