import { useCallback, useEffect, useRef, useState } from 'react';
import { SocialWallScreen } from '../../screens/SocialWallScreen';
import type { SocialPage } from '../../components/social/SocialWall';
import { SocialEmpty } from '../../components/social/SocialChrome';
import type { SocialState } from '../../social/model';
import { useI18n } from '../../i18n';
import { createSocialFixtures, previewPets, previewViewer } from './fixtures';
import { createPreviewRepository } from './repository';
import { readPreviewPhoto } from './photos';
import { previewActions } from './actions';
import styles from '../../components/social/Social.module.css';

const repository = createPreviewRepository();
const pages = new Set(['gate', 'feed', 'mine', 'compose', 'activity']);
const requested = new URLSearchParams(location.search).get('view') ?? 'gate';
const initialPage: SocialPage = {
  name: pages.has(requested) ? (requested as 'gate' | 'feed' | 'mine' | 'compose' | 'activity') : 'gate',
};

export default function SocialPreview() {
  const { t } = useI18n();
  const [state, setState] = useState<SocialState>();
  const current = useRef<SocialState | undefined>(undefined);
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    const previous = document.title;
    document.title = `${t('social.title')} · ${t('social.preview')}`;
    return () => {
      document.title = previous;
    };
  }, [t]);
  useEffect(() => {
    let cancelled = false;
    void repository
      .load()
      .catch(() => {
        if (!cancelled) setStorageFailed(true);
        return null;
      })
      .then((data) => {
        if (cancelled) return;
        const next = data ?? createSocialFixtures();
        current.current = next;
        setState(next);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const mutate = useCallback(async (update: (s: SocialState) => SocialState) => {
    if (!current.current) return;
    const next = update(current.current);
    current.current = next;
    setState(next);
    try {
      await repository.save(next);
    } catch {
      setStorageFailed(true);
    }
  }, []);
  if (!state)
    return (
      <main className={styles.root}>
        <p className={styles.preview}>{t('social.preview')}</p>
        <SocialEmpty state="loading" />
      </main>
    );
  return (
    <SocialWallScreen
      state={state}
      viewer={previewViewer}
      pets={previewPets}
      initialPage={initialPage}
      storageFailed={storageFailed}
      actions={previewActions(previewViewer, mutate)}
      readPhoto={readPreviewPhoto}
      onHome={() => location.assign('/')}
      onReset={() => {
        void mutate(() => createSocialFixtures());
      }}
    />
  );
}
