import type pg from 'pg';

/**
 * 仅本地开发／测试：为历史迁移准备 public."user" 模拟表，并放入测试同事，
 * 含应被过滤掉的停用账号、机器人和外部访客。正式库绝不运行。
 */
export const TEST_COLLEAGUES = [
  { user_id: 'U_TEST_BOB', email: 'bob@moego.pet', name: 'Bob', team_id: 'T011CF3CMJN' },
  { user_id: 'U_TEST_ALICE', email: 'alice@moego.pet', name: 'Alice Chen', team_id: 'T011CF3CMJN' },
  { user_id: 'U_TEST_ZHANG', email: 'zhangwei@moego.pet', name: 'Zhang Wei(张伟)', team_id: 'T011CF3CMJN' },
  { user_id: 'U_TEST_SAM', email: 'sam@moego.pet', name: 'Samantha Sullivan', team_id: 'T_OTHER' },
  { user_id: 'U_TEST_LONG', email: 'long@moego.pet', name: 'Maximilian Alexander Featherstonehaugh', team_id: 'T011CF3CMJN' },
] as const;

const EXCLUDED = [
  { user_id: 'U_TEST_GONE', email: 'gone@moego.pet', name: 'Departed Person', team_id: 'T011CF3CMJN', deleted: true, is_bot: false },
  { user_id: 'U_TEST_BOT', email: 'bot@moego.pet', name: 'Deploy Bot', team_id: 'T011CF3CMJN', deleted: false, is_bot: true },
  { user_id: 'U_TEST_GUEST', email: 'guest@partner.com', name: 'External Guest', team_id: 'T_PARTNER', deleted: false, is_bot: false },
];

export const PLACEHOLDER_PET_IDS = ['mochi', 'tofu', 'kiwi', 'peanut', 'luna', 'pepper'] as const;

export async function seedLocal(client: pg.Client | pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public."user" (
      id bigserial PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted boolean NOT NULL DEFAULT false,
      user_id varchar NOT NULL,
      email varchar,
      real_name_normalized varchar,
      entry_date date, confirm_date date, birthday_date date,
      tz varchar,
      is_bot boolean NOT NULL DEFAULT false,
      team_id varchar,
      country varchar
    )`);
  await client.query('TRUNCATE public."user"');
  for (const u of [...TEST_COLLEAGUES.map((c) => ({ ...c, deleted: false, is_bot: false })), ...EXCLUDED]) {
    await client.query(
      'INSERT INTO public."user" (user_id, email, real_name_normalized, team_id, deleted, is_bot) VALUES ($1, $2, $3, $4, $5, $6)',
      [u.user_id, u.email, u.name, u.team_id, u.deleted, u.is_bot],
    );
  }
}

export async function seedPlaceholderPets(client: pg.Client | pg.PoolClient) {
  for (const id of PLACEHOLDER_PET_IDS) {
    await client.query(
      `INSERT INTO pet_match.pets (pet_id, name, status) VALUES ($1, $2, 'published') ON CONFLICT (pet_id) DO NOTHING`,
      [id, id[0].toUpperCase() + id.slice(1)],
    );
  }
}

/** 独立名册的本地样例；不从外部人员表导入。 */
export async function seedLocalMembers(client: pg.Client | pg.PoolClient) {
  for (const c of [...TEST_COLLEAGUES.map(c => ({ ...c, active: true })), ...EXCLUDED.map(c => ({ ...c, active: false }))]) {
    await client.query(
      `INSERT INTO pet_match.slack_members (user_id, name, email, active) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, active=EXCLUDED.active`,
      [c.user_id, c.name, c.email, c.active],
    );
  }
}

/** 仅测试：六种占位鱼色（开发库用 catalog publish 导入真实鱼色）。 */
export async function seedTestFishColors(client: pg.Client | pg.PoolClient) {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  for (const c of colors) {
    await client.query(
      `INSERT INTO pet_match.fish_colors (color_id, name_zh, name_en, palette_hex) VALUES ($1, $1, $1, '#000000') ON CONFLICT DO NOTHING`,
      [`fish_color_${c}`],
    );
  }
}
