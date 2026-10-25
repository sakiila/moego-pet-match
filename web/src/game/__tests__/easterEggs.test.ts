import { describe, expect, it } from 'vitest';
import { translate } from '../../i18n';
import { HOTPOT_PETS, servedHotpot } from '../achievementRules';
import { ACHIEVEMENT_RARITY } from '../achievementRarity';
import { isDeveloperPet, managerLineKey, reunionKey } from '../easterEggs';
import { developerStampUrl } from '../titleStamps';

const [maodu, boluo] = HOTPOT_PETS;

describe('开发者彩蛋', () => {
  it('只认毛肚与菠萝两只的名录 id', () => {
    expect(isDeveloperPet(maodu)).toBe(true);
    expect(isDeveloperPet(boluo)).toBe(true);
    expect(isDeveloperPet('pet_b05057985e11')).toBe(false);
  });

  it('店长梗：两只各一句，其他宠物用通用宣言；中英文都有', () => {
    expect(managerLineKey(maodu)).toBe('home.manager_line_maodu');
    expect(managerLineKey(boluo)).toBe('home.manager_line_boluo');
    expect(managerLineKey('pet_mgr')).toBe('home.manager_line');
    expect(translate('zh', 'home.manager_line_boluo')).toContain('不是水果');
    expect(translate('en', 'home.manager_line_maodu')).toMatch(/keyboard/i);
  });

  it('团聚贴纸：两只同框换火锅台词，其他家庭不变', () => {
    expect(reunionKey([boluo, maodu])).toBe('board.reunion_hotpot');
    expect(reunionKey([maodu, 'pet_other'])).toBe('board.reunion');
    expect(translate('zh', 'board.reunion_hotpot')).toBe('毛肚菠萝到齐，开锅！');
  });

  it('火锅搭子：同一局两只都服务到才算；是最高一档「镇店」', () => {
    expect(servedHotpot([maodu, boluo, 'x'])).toBe(true);
    expect(servedHotpot([maodu])).toBe(false);
    expect(servedHotpot([])).toBe(false);
    expect(ACHIEVEMENT_RARITY.hotpot).toBe('mythic');
    expect(translate('zh', 'achievement.rarity_mythic')).toBe('镇店');
    expect(translate('en', 'achievement.hotpot')).toBe('Hotpot Buddies');
  });

  it('开发者认证章中英文图片都存在', () => {
    expect(developerStampUrl('zh')).toMatch(/developer-zh/);
    expect(developerStampUrl('en')).toMatch(/developer-en/);
  });
});
