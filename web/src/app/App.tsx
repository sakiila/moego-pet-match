import { useI18n } from '../i18n';

/** 阶段 1（下）接入准备页、棋盘与基础报告前的占位。 */
export function App() {
  const { t } = useI18n();
  return (
    <main style={{ padding: 'var(--space-5) var(--space-4)' }}>
      <h1>{t('app.title')}</h1>
    </main>
  );
}
