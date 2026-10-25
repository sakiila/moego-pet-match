import { useI18n } from '../../i18n';
import { PageLinks, type PageLink } from '../PageLinks/PageLinks';
import styles from './HomeFooter.module.css';

export interface HomeFooterProps {
  links: PageLink[];
  version: string;
  repositoryUrl: string;
}

export function HomeFooter({ links, version, repositoryUrl }: HomeFooterProps) {
  const { t } = useI18n();
  const repository = repositoryUrl.replace(/^https?:\/\//, '');
  return (
    <footer className={styles.footer}>
      <PageLinks links={links} />
      <p className={styles.version} data-testid="game-version">{t('home.version', { version })}</p>
      <a
        className={`${styles.version} ${styles.repository}`}
        href={repositoryUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('home.github_link', { repository })}
        data-testid="game-repository"
      >
        {repository}
      </a>
    </footer>
  );
}
