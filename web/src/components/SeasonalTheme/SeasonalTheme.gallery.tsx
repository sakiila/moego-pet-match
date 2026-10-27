import { useMemo, useState, type ReactNode } from 'react';
import type { GameMode, PetDetail } from '../../api/types';
import { COPYRIGHT, GITHUB_REPOSITORY_URL } from '../../app/project';
import { GAME_VERSION } from '../../app/version';
import type { GalleryEntry } from '../../dev/gallery/types';
import {
  HALLOWEEN_MANAGER, HALLOWEEN_PETS, HALLOWEEN_PLAYER, HALLOWEEN_ROWS, HALLOWEEN_SUMMARY,
  loadHalloweenAchievements, loadHalloweenFaction, loadHalloweenLeaderboard, loadHalloweenLikes, loadHalloweenPetDetail,
  loadHalloweenPets, loadHalloweenProfile, loadHalloweenStanding, loadHalloweenTitles,
  previewSettlement, sendHalloweenLike,
} from '../../dev/halloweenFixtures';
import { createGame, parseBoard, type GameSummary } from '../../engine';
import { frameAt } from '../../game/playback';
import { SAMPLE_FISH, silhouetteUrl, stickerUrl, type PetInfo } from '../../game/pets';
import { BoardScreen } from '../../screens/BoardScreen';
import { HomeScreen } from '../../screens/HomeScreen';
import { LeaderboardScreen } from '../../screens/LeaderboardScreen';
import { PrepScreen } from '../../screens/PrepScreen';
import { ReportScreen } from '../../screens/ReportScreen';
import { ShareCardOverlay } from '../../screens/ShareCardOverlay';
import { Board } from '../Board/Board';
import { BoardControls } from '../BoardControls/BoardControls';
import { BoardLayout } from '../BoardLayout/BoardLayout';
import { BrandHeader } from '../BrandHeader/BrandHeader';
import { PetDetailCard } from '../PetDetailCard/PetDetailCard';
import { QuitDialog } from '../QuitDialog/QuitDialog';
import { RushBar, type RushView } from '../RushBar/RushBar';
import { SettingsDialog } from '../SettingsDialog/SettingsDialog';
import { StatusPanel } from '../StatusPanel/StatusPanel';
import { TipBar } from '../TipBar/TipBar';
import { SeasonalThemeProvider } from './SeasonalTheme';

const noop = () => {};
const theme = (children: ReactNode, active = true) => <SeasonalThemeProvider active={active}>{children}</SeasonalThemeProvider>;
const frame = frameAt({ board: parseBoard(HALLOWEEN_ROWS).board, score: 12400, rushProgress: 7 }, null, 0);

function HomePreview({ onStart = noop, onLeaderboard = noop }: { onStart?: () => void; onLeaderboard?: () => void }) {
  return <HomeScreen player={HALLOWEEN_PLAYER} manager={HALLOWEEN_MANAGER} copyright={COPYRIGHT}
    version={GAME_VERSION} repositoryUrl={GITHUB_REPOSITORY_URL} soundTipPreview={false}
    loadFaction={loadHalloweenFaction}
    joinFaction={loadHalloweenFaction}
    loadLikes={loadHalloweenLikes} loadProfile={loadHalloweenProfile} loadPets={loadHalloweenPets} loadPetDetail={loadHalloweenPetDetail}
    onOpenShop={onStart} onLeaderboard={onLeaderboard} onCollection={noop} onMyPets={noop}
    onSocial={noop} onInfo={noop} onClockOut={noop} />;
}

function BoardPreview({ rush = { state: 'active', served: 7, secondsLeft: 8 }, mode = 'normal' }: { rush?: RushView; mode?: GameMode }) {
  const [settings, setSettings] = useState(false);
  const [quit, setQuit] = useState(false);
  const pets = mode === 'fish' ? SAMPLE_FISH : HALLOWEEN_PETS;
  return <BoardLayout mode={mode}
    header={<BrandHeader title="scheduling" boardArt tagline="board.tagline" />}
    status={<StatusPanel timeLeftMs={48000} score={12400} />}
    rush={<RushBar mode={mode} view={rush} />}
    board={<Board frame={frame} pets={pets} mode={mode} interactive={false} staticSelected={{ r: 3, c: 2 }} staticPreview={Array.from({ length: 7 }, (_, c) => ({ r: 3, c }))} />}
    tip={<TipBar tip={{ key: 'tutorial.comb' }} pets={pets} />}
    controls={<BoardControls timeUp={false} onSettings={() => setSettings(true)} onExit={() => setQuit(true)} />}>
    <SettingsDialog variant="board" open={settings} onClose={() => setSettings(false)} />
    <QuitDialog open={quit} onCancel={() => setQuit(false)} onConfirm={() => setQuit(false)} />
  </BoardLayout>;
}

function ReportPreview({ summary = HALLOWEEN_SUMMARY, pets = HALLOWEEN_PETS, onHome = noop, onPlayAgain = noop }: {
  summary?: GameSummary; pets?: PetInfo[]; onHome?: () => void; onPlayAgain?: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const [detail, setDetail] = useState<{ pet: PetInfo; value: PetDetail; origin: HTMLElement } | null>(null);
  const save = useMemo(() => ({
    kind: 'saved' as const, response: previewSettlement(summary),
    newPets: [HALLOWEEN_PETS[2], HALLOWEEN_PETS[5]].filter(pet => summary.pets.some(served => served.id === pet.id && served.served > 0)),
  }), [summary]);
  return <>
    <ReportScreen mode="normal" summary={summary} pets={pets} save={save} manager={HALLOWEEN_MANAGER}
      loadStanding={loadHalloweenStanding} loadAchievements={loadHalloweenAchievements}
      onHome={onHome} onPlayAgain={onPlayAgain} onRetry={noop} onFishInvite={noop}
      onOpenPet={(pet, origin) => { void loadHalloweenPetDetail(pet.id).then(value => setDetail({ pet, value, origin })); }}
      onShare={() => setSharing(true)}
      onAnswerQuiz={async () => ({ correct: null, skipped: true, owner: { userId: 'U_TEST_BOB', name: 'Bob' }, bonus: 0, score: summary.score, personalBest: save.response.personalBest })} />
    {sharing && <ShareCardOverlay mode="normal" summary={summary} pets={pets} playerName="Bob" manager={HALLOWEEN_MANAGER} onClose={() => setSharing(false)} />}
    {detail && <PetDetailCard name={detail.pet.name} state={{ kind: 'ready', detail: detail.value }}
      stickerSrc={stickerUrl(detail.pet.id, 512)} silhouetteSrc={silhouetteUrl(detail.pet.id, 512)} photoSrc={null}
      ownerAvatarSrc={null} colleagueAvatarSrc={() => null} origin={detail.origin}
      onClose={() => setDetail(null)} onRetry={noop} onOpenShop={onPlayAgain} />}
  </>;
}

function LeaderboardPreview({ onHome = noop, onStart = noop }: { onHome?: () => void; onStart?: () => void }) {
  return <LeaderboardScreen player={HALLOWEEN_PLAYER} onBack={onHome} onChallenge={onStart}
    load={loadHalloweenLeaderboard} loadProfile={loadHalloweenProfile} loadViewerTitles={loadHalloweenTitles}
    loadLikes={loadHalloweenLikes} sendLike={sendHalloweenLike} loadPets={loadHalloweenPets} loadPetDetail={loadHalloweenPetDetail} />;
}

/** Local UI flow: real engine and controls, fixture loaders only; no registration or settlement requests. */
function PreviewFlow() {
  const [screen, setScreen] = useState<'home' | 'prep' | 'board' | 'report' | 'leaderboard'>('home');
  const [round, setRound] = useState(() => createGame({ seed: 31031, lineup: HALLOWEEN_PETS.map(pet => pet.id) }));
  const [summary, setSummary] = useState<GameSummary>(HALLOWEEN_SUMMARY);
  const pets = useMemo(() => round.lineup.map(id => HALLOWEEN_PETS.find(pet => pet.id === id)!), [round]);
  const home = () => setScreen('home');
  const prepare = () => {
    setRound(createGame({ seed: 31031, lineup: HALLOWEEN_PETS.map(pet => pet.id) }));
    setScreen('prep');
  };
  if (screen === 'home') return <HomePreview onStart={prepare} onLeaderboard={() => setScreen('leaderboard')} />;
  if (screen === 'leaderboard') return <LeaderboardPreview onHome={home} onStart={prepare} />;
  if (screen === 'prep') return <PrepScreen pets={pets} ownPetNames={['Maodu', 'Boluo']} onStart={() => setScreen('board')} onBack={home} />;
  if (screen === 'board') return <BoardScreen game={round} pets={pets} speed={3} startAt={29000}
    onExit={home} onFinished={result => { setSummary(result); setScreen('report'); }} />;
  return <ReportPreview summary={summary} pets={pets} onHome={home} onPlayAgain={prepare} />;
}

export default {
  name: 'HalloweenTheme',
  group: 'screens',
  states: {
    home: () => theme(<HomePreview />),
    'board-active': () => theme(<BoardPreview />),
    'board-hidden': () => theme(<BoardPreview rush={{ state: 'hidden' }} />),
    'board-success': () => theme(<BoardPreview rush={{ state: 'success' }} />),
    'board-expired': () => theme(<BoardPreview rush={{ state: 'expired' }} />),
    report: () => theme(<ReportPreview />),
    leaderboard: () => theme(<LeaderboardPreview />),
    'fish-unchanged': () => theme(<BoardPreview mode="fish" />),
    'default-off': () => theme(<HomePreview />, false),
    flow: () => theme(<PreviewFlow />),
  },
} satisfies GalleryEntry;
