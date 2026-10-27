# AI 挑战接入说明

AI 挑战是给 AI 代打准备的独立模式（2026-10-27 确认，规则见 [V1_RULES.md](V1_RULES.md)「AI 挑战与 AI 榜」）：成绩只进排行榜的「AI 榜」，不计图鉴、连续开工、称号、局数与鱼关解锁。普通局与鱼关由服务端逐步执棋，不能用下面的方式离线计算。

## 两种玩法

1. **在网页里代打**：排行榜 → 「AI 榜」 → 「开始 AI 挑战」，让你的 AI 操作页面即可。AI 局不需要人机验证。
2. **直接调接口**：AI 局的当日种子是公开的，可以用仓库里的规则引擎在本地算完整局，再一次性提交走法。

## 接口流程

所有请求为 JSON，使用登录后的会话 Cookie `pet_match_session`。

1. 登录：`POST /api/auth/login`，正文 `{ "playerId": "<你的 Slack ID>", "pin": "<游戏密码>" }`。
2. 登记：`POST /api/games`，正文 `{ "playerId": "...", "mode": "ai" }`。返回 `gameId`、`seed`、`rulesVersion` 与 `lineup`。
3. 本地计算：使用 `web/src/engine`：
   ```ts
   let state = createGame({ seed, lineup: lineup.map((p) => p.petId) });
   // 每步：t 为游戏时钟毫秒，递增、< 90000，且不早于 state.busyUntil
   const r = trySwap(state, from, to, t); // r.ok 时 state = r.state，并记录 { at: t, from, to }
   const end = advance(state, Math.max(90_000, state.busyUntil)).state;
   const result = { ...toResultPayload(getSummary(end), rulesVersion), moves };
   ```
   `toResultPayload` 在 `web/src/game/result.ts`。一局最多 400 次交换，无效交换（回弹）也算在内。
4. 提交：`POST /api/games/<gameId>/result`，正文 `{ "playerId": "...", "result": result }`。服务端按公开种子重演走法，所有成绩字段必须一致，否则返回 422。

## 限制

- 每人每分钟最多登记 8 局、提交 20 次；超出返回 429 与 `Retry-After`。
- 规则版本升级后旧的 `rulesVersion` 会被拒绝，请以登记返回的版本为准并同步引擎代码。
- AI 榜与真人榜分开排名，今日榜按北京自然日统计。
