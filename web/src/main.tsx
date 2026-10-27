import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { isGalleryPath } from './app/entryRoute';
import { FeedbackProvider } from './audio/FeedbackProvider';
import { I18nProvider } from './i18n';
import { SeasonalThemeProvider } from './components/SeasonalTheme/SeasonalTheme';
import './ui/fonts.css';
import './ui/global.css';

const isGallery = isGalleryPath(window.location.pathname);
const Gallery = isGallery ? lazy(() => import('./dev/gallery/Gallery')) : null;
const SocialPreview = import.meta.env.DEV && location.pathname === '/dev/social'
  ? lazy(() => import('./dev/social/SocialPreview')) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <SeasonalThemeProvider>
      <FeedbackProvider>
      {SocialPreview ? <Suspense fallback={null}><SocialPreview/></Suspense> : Gallery ? (
        <Suspense fallback={null}>
          <Gallery />
        </Suspense>
      ) : (
        <App />
      )}
      </FeedbackProvider>
      </SeasonalThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
