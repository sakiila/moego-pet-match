import { GAME_VERSION } from '../../app/version';
import { COPYRIGHT, GITHUB_REPOSITORY_URL } from '../../app/project';
import type { GalleryEntry } from '../../dev/gallery/types';
import { useI18n } from '../../i18n';
import { HomeFooter } from './HomeFooter';

function Example({ version, repositoryUrl = GITHUB_REPOSITORY_URL }: { version: string; repositoryUrl?: string }) {
  const { t } = useI18n();
  return (
    <HomeFooter
      version={version}
      repositoryUrl={repositoryUrl}
      copyright={COPYRIGHT}
      links={[
        { label: t('info.use_link'), onClick: () => {} },
        { label: t('info.removal_link'), onClick: () => {} },
        { label: t('nav.settings'), onClick: () => {} },
      ]}
    />
  );
}

const entry: GalleryEntry = {
  name: 'HomeFooter',
  group: 'components',
  states: {
    default: () => <Example version={GAME_VERSION} />,
    'dev version without build date (no copyright year)': () => <Example version="dev" />,
    'two-digit revision': () => <Example version="20261025.12" />,
    'long repository address': () => <Example version={GAME_VERSION} repositoryUrl="https://github.com/example/a-very-long-pet-match-repository-name-for-layout-preview" />,
  },
};

export default entry;
