import { useEffect, useRef, useState } from 'react';
import type { GameMode } from '../../api/types';
import { playCheer, preloadCheers, stopCheer, unlockAudio } from '../../audio/sound';
import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { createGame } from '../../engine';
import type { CheerKind } from '../../game/cheers';
import { PLACEHOLDER_PETS, SAMPLE_FISH } from '../../game/pets';
import { frameAt } from '../../game/playback';
import { useI18n } from '../../i18n';
import { BoardScreen } from '../../screens/BoardScreen';
import { Button } from '../../ui/primitives/Button';
import { Board } from '../Board/Board';
import { CheerCallout } from './CheerCallout';
import styles from './CheerCallout.module.css';

const KINDS: CheerKind[] = ['nice', 'great', 'amazing', 'wow'];
const game = createGame({ seed: 9, lineup: PLACEHOLDER_PETS.map((pet) => pet.id) });
const frame = frameAt({ board: game.board, score: 0, rushProgress: 0 }, null, 0);
const noop = () => {};
// 确定性操作：三连 Great (4,4) → (4,3)；工具 Amazing 与 Wow (3,2) → (3,3)。
const NICE_BOARD = ['EFEFDFD', 'DEDEFEF', 'FDFCEDE', 'EFEBDFD', 'DEDFAEF', 'EDFACDE', 'DEBABCC'];
const NICE_REFILL = [0, 1, 0, 0, 2, 0, 1, 2, 0];
const WOW_BOARD = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABdDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'];
const LARGE_CLEAR_BOARD = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABhxEFA', 'CDEFABC', 'EFABCvE', 'ABCDEFA'];

function GamePreview({ seed, board, refill, mode = 'normal', startAt = 0 }: {
  seed: number;
  board?: string[];
  refill?: number[];
  mode?: GameMode;
  startAt?: number;
}) {
  const pets = mode === 'fish' ? SAMPLE_FISH : PLACEHOLDER_PETS;
  const [initial] = useState(() => createGame({ seed, lineup: pets.map((pet) => pet.id), board, refill }));
  return <BoardScreen game={initial} pets={pets} mode={mode} startAt={startAt} speed={1} onFinished={noop} onExit={noop} />;
}

function Preview({ kind, mode = 'normal', animate = false, replay = 0 }: {
  kind: CheerKind | null;
  mode?: GameMode;
  animate?: boolean;
  replay?: number;
}) {
  return (
    <div className={styles.preview}>
      <Board frame={frame} pets={mode === 'fish' ? SAMPLE_FISH : PLACEHOLDER_PETS} interactive={false} mode={mode} />
      <CheerCallout key={replay} kind={kind} mode={mode} animate={animate} />
    </div>
  );
}

function Replay({ reduced = false, mode = 'normal' }: { reduced?: boolean; mode?: GameMode }) {
  const [replay, setReplay] = useState(0);
  return (
    <div className={`${styles.replay} ${reduced ? styles.reducedPreview : ''}`}>
      <Preview kind={KINDS[replay % KINDS.length]} mode={mode} animate replay={replay} />
      <Button variant="secondary" onClick={() => setReplay((value) => value + 1)}>
        Replay · Nice / Great / Amazing / Wow
      </Button>
    </div>
  );
}

function Audition() {
  const { t } = useI18n();
  const [event, setEvent] = useState<{ kind: CheerKind | null; key: number }>({ kind: null, key: 0 });
  const [audioFailed, setAudioFailed] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    void preloadCheers();
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      generation.current += 1;
      stopCheer();
      setEvent((previous) => ({ ...previous, kind: null }));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted.current = false;
      generation.current += 1;
      document.removeEventListener('visibilitychange', onVisibility);
      stopCheer();
    };
  }, []);

  const audition = async (kind: CheerKind) => {
    if (!mounted.current || document.visibilityState !== 'visible') return;
    const request = ++generation.current;
    stopCheer();
    let ready = true;
    try {
      await unlockAudio();
      await preloadCheers();
    } catch {
      ready = false;
    }
    if (!mounted.current || request !== generation.current || document.visibilityState !== 'visible') return;
    const played = ready && playCheer(kind);
    setAudioFailed(!played);
    setEvent((previous) => ({ kind, key: previous.key + 1 }));
  };

  return (
    <div className={`${styles.replay} ${styles.audition}`} data-testid="cheer-audition">
      <Preview kind={event.kind} animate replay={event.key} />
      <div className={styles.auditionButtons}>
        {KINDS.map((kind) => (
          <Button key={kind} onClick={() => void audition(kind)}>{t(`board.cheer_${kind}`)}</Button>
        ))}
      </div>
      <p className={styles.auditionNote}>点击按钮试听声音和字效；游戏内仍由「消除音效」开关控制。</p>
      {audioFailed ? <p className={styles.auditionNote} role="status">声音暂时没加载成功，请再点一次。</p> : null}
    </div>
  );
}

const entry: GalleryEntry = {
  name: 'CheerCallout',
  group: 'components',
  states: {
    'Nice · static · 中文 / English': () => <Preview kind="nice" />,
    'Great · static · 中文 / English': () => <Preview kind="great" />,
    'Amazing · static · 中文 / English': () => <Preview kind="amazing" />,
    'Wow · static · 中文 / English': () => <Preview kind="wow" />,
    empty: () => <Preview kind={null} />,
    'live · cycle all four': () => <Replay />,
    'reduced motion · fade only': () => <Replay reduced />,
    'fish · static': () => <FishFrame><Preview kind="amazing" mode="fish" /></FishFrame>,
    'fish · live': () => <FishFrame><Replay mode="fish" /></FishFrame>,
    'try · four voices': () => <Audition />,
    // 随机盘首次提示：六连 Amazing (1,1) → (2,1)；四连 Amazing (0,3) → (1,3)。
    'game · Amazing': () => <GamePreview seed={195} />,
    'game · Great': () => <GamePreview seed={3} board={NICE_BOARD} refill={NICE_REFILL} />,
    'game · Nice': () => <GamePreview seed={4} />,
    'game · Amazing four cascades': () => <GamePreview seed={20} />,
    'game · Amazing large clear': () => <GamePreview seed={1} board={LARGE_CLEAR_BOARD} />,
    // 二连消：首次提示 (0,1) → (0,2)，用于验证 Nice 的新门槛。
    'game · Nice two cascades': () => <GamePreview seed={4} />,
    'game · Wow': () => <GamePreview seed={1} board={WOW_BOARD} />,
    'game · fish Amazing': () => <GamePreview seed={195} mode="fish" />,
    'game · near time up': () => <GamePreview seed={195} startAt={88_000} />,
  },
};

export default entry;
