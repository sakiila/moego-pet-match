/** 人工核实身份后重置四位密码。默认预览；--yes 执行，--prod 使用生产管理员连接。 */
import { connect, describeTarget } from './cli.ts';
import { resetPin } from '../src/services/auth.ts';

const args = process.argv.slice(2);
const [command, playerId] = args;
if (command !== 'reset' || !playerId || playerId.startsWith('--')) throw new Error('usage: password.ts reset <Slack user_id> [--yes] [--prod]');
const yes = args.includes('--yes');
const prod = args.includes('--prod');
const client = await connect(prod);
try {
  console.log(describeTarget(prod, yes));
  const { rows } = await client.query('SELECT user_id,name FROM pet_match.slack_members WHERE user_id=$1', [playerId]);
  if (!rows.length) throw new Error('unknown player');
  console.log(`reset password and revoke all sessions: ${rows[0].name} (${playerId}); scores and collection preserved`);
  if (yes) {
    await client.query('BEGIN');
    try {
      await resetPin(client, playerId);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    console.log('applied; the player must set a new PIN on next login');
  }
} finally {
  await client.end();
}
