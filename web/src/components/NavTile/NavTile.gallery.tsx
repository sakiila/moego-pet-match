import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { NavTile } from './NavTile';

const noop = () => {};
const row = { display: 'flex', justifyContent: 'center' } as const;

const entry: GalleryEntry = {
  name: 'NavTile',
  group: 'components',
  states: {
    'home row (zh)': () => (
      <nav style={row}>
        <NavTile icon="pet-collection" label="宠物图鉴" onClick={noop} />
        <NavTile icon="leaderboard" label="排行榜" onClick={noop} />
        <NavTile icon="my-pets" label="我的宠物" onClick={noop} />
      </nav>
    ),
    'home row (en)': () => (
      <nav style={row}>
        <NavTile icon="pet-collection" label="Pet Collection" onClick={noop} />
        <NavTile icon="leaderboard" label="Leaderboard" onClick={noop} />
        <NavTile icon="my-pets" label="My Pets" onClick={noop} />
      </nav>
    ),
    'report row (zh)': () => (
      <nav style={row}>
        <NavTile icon="pet-collection" label="宠物图鉴" onClick={noop} />
        <NavTile icon="leaderboard" label="排行榜" onClick={noop} />
        <NavTile icon="back-to-shop" label="回门店" onClick={noop} />
      </nav>
    ),
    'report row (en, long labels)': () => (
      <nav style={row}>
        <NavTile icon="pet-collection" label="Pet Collection" onClick={noop} />
        <NavTile icon="leaderboard" label="Leaderboard" onClick={noop} />
        <NavTile icon="back-to-shop" label="Back to the Shop" onClick={noop} />
      </nav>
    ),
    single: () => <NavTile icon="leaderboard" label="排行榜" onClick={noop} />,
    'fish theme': () => (
      <FishFrame>
        <nav style={row}>
          <NavTile icon="leaderboard" label="鱼关排行榜" onClick={noop} />
          <NavTile icon="back-to-shop" label="回门店" onClick={noop} />
        </nav>
      </FishFrame>
    ),
  },
};
export default entry;
