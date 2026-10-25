import type { GalleryEntry } from '../../dev/gallery/types';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Button } from '../../ui/primitives/Button';
import { BrandHeader } from './BrandHeader';

function CollectionHeader() {
  const { t } = useI18n();
  return <BrandHeader title="collection" onBack={() => {}} headingAction={<Button variant="secondary" iconName="open-shop">{t('my_pets.add')}</Button>} />;
}

const entry: GalleryEntry = {
  name: 'BrandHeader',
  group: 'components',
  states: {
    'scheduling + tagline (board)': () => <BrandHeader boardArt tagline="board.tagline" />,
    'scheduling (prep)': () => <BrandHeader />,
    'scheduling artwork (prep)': () => <BrandHeader schedulingArt onBack={() => {}} />,
    'game + subtitle (identity)': () => <BrandHeader title="game" tagline="access.subtitle" />,
    'page heading + back (leaderboard)': () => <BrandHeader heading="排行榜" onBack={() => {}} />,
    'page heading + action (petdex)': () => <BrandHeader heading="宠物图鉴" onBack={() => {}} headingAction={<Button variant="secondary" iconName="open-shop">添加我家毛孩子</Button>} />,
    'page heading + action, long English': () => <BrandHeader heading="Pet Collection" onBack={() => {}} headingAction={<Button variant="secondary" iconName="open-shop">Add My Pet</Button>} />,
    'collection artwork + action': () => <CollectionHeader />,
    'collection artwork': () => <BrandHeader title="collection" onBack={() => {}} />,
    'report artwork + subtitle': () => <BrandHeader title="report" tagline="report.subtitle" onBack={() => {}} />,
    'report artwork + zero service': () => <BrandHeader title="report" tagline="report.generic_caption" onBack={() => {}} />,
    'fish report artwork': () => <BrandHeader title="fish-report" tagline="fish.report_subtitle" onBack={() => {}} />,
    'game + avatar (home)': () => <BrandHeader title="game" trailing={<Avatar name="Bob" size={36} />} />,
  },
};

export default entry;
