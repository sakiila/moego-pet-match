import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { FeedbackProvider } from './audio/FeedbackProvider';
import { I18nProvider } from './i18n';
import './ui/fonts.css';
import './ui/global.css';

const isGallery = import.meta.env.DEV && window.location.pathname.startsWith('/dev/gallery');
const Gallery = isGallery ? lazy(() => import('./dev/gallery/Gallery')) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <FeedbackProvider>
      {Gallery ? (
        <Suspense fallback={null}>
          <Gallery />
        </Suspense>
      ) : (
        <App />
      )}
      </FeedbackProvider>
    </I18nProvider>
  </StrictMode>,
);
