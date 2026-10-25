import { useI18n } from '../../i18n';
import { PageLinks, type PageLink } from '../PageLinks/PageLinks';
import styles from './HomeFooter.module.css';

export interface HomeFooterProps {
  links: PageLink[];
  version: string;
  repositoryUrl: string;
  /** 版权方与制作人（原文）；年份取版本号里的构建日期，不读设备时钟。 */
  copyright: { holder: string; author: string };
}

export function HomeFooter({ links, version, repositoryUrl, copyright }: HomeFooterProps) {
  const { t } = useI18n();
  const repository = repositoryUrl.replace(/^https?:\/\//, '');
  const year = /^\d{4}/.exec(version)?.[0];
  return (
    <footer className={styles.footer}>
      <PageLinks
        links={[...links, { label: 'GitHub', href: repositoryUrl, ariaLabel: t('home.github_link', { repository }), testId: 'game-repository' }]}
        compact
      />
      <p className={styles.version}>
        <span data-testid="game-version">{t('home.version', { version })}</span>
        {year && (
          <>
            <span aria-hidden="true"> · </span>
            <span className={styles.copyright} data-testid="game-copyright">{t('home.copyright', { year, ...copyright })}</span>
          </>
        )}
      </p>
    </footer>
  );
}
