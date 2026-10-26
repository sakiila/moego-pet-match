/** 生产应用角色的最小权限：名册与宠物只读，游戏数据可读写。Supabase 建库与只读角色回归测试共用。 */
export const RW_TABLES = ['games', 'game_results', 'best_scores', 'collections', 'player_progress', 'submissions', 'quizzes', 'daily_managers', 'deletion_requests', 'slack_members', 'achievement_awards', 'player_titles', 'game_request_limits', 'player_credentials', 'player_sessions'];
export const RO_OBJECTS = ['colleagues', 'pets', 'fish_colors'];

export function appRoleGrants(role: string): string[] {
  return [
    `GRANT USAGE ON SCHEMA pet_match TO ${role}`,
    `GRANT SELECT ON ${RO_OBJECTS.map((t) => `pet_match.${t}`).join(', ')} TO ${role}`,
    `GRANT SELECT, INSERT, UPDATE ON ${RW_TABLES.map((t) => `pet_match.${t}`).join(', ')} TO ${role}`,
    `GRANT SELECT, INSERT ON pet_match.player_likes TO ${role}`,
    `REVOKE UPDATE, DELETE, TRUNCATE ON pet_match.player_likes FROM ${role}`,
  ];
}
