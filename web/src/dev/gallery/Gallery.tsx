import { useState } from 'react';
import { useI18n, type Locale } from '../../i18n';
import styles from './Gallery.module.css';
import type { GalleryEntry } from './types';

const modules = import.meta.glob<{ default: GalleryEntry }>('/src/**/*.gallery.tsx', { eager: true });
const entries = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
const groups = ['primitives', 'components', 'screens'] as const;

type Theme = 'default' | 'fish';

export default function Gallery() {
  const { locale, setLocale } = useI18n();
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get('c') ?? entries[0]?.name);
  const [theme, setTheme] = useState<Theme>('default');
  const [width, setWidth] = useState('390px');
  const entry = entries.find((e) => e.name === selected) ?? entries[0];

  const select = (name: string) => {
    setSelected(name);
    history.replaceState(null, '', `?c=${encodeURIComponent(name)}`);
  };

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="Components">
        <strong>Gallery</strong>
        {groups.map((group) => {
          const items = entries.filter((e) => e.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group}>
              <h2>{group}</h2>
              {items.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  className={styles.navItem}
                  aria-current={e.name === entry?.name}
                  onClick={() => select(e.name)}
                >
                  {e.name}
                </button>
              ))}
            </section>
          );
        })}
      </nav>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <label>
            Locale{' '}
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Theme{' '}
            <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              <option value="default">default</option>
              <option value="fish">fish</option>
            </select>
          </label>
          <label>
            Frame{' '}
            <select value={width} onChange={(e) => setWidth(e.target.value)}>
              <option value="390px">390 (phone)</option>
              <option value="768px">768 (tablet)</option>
              <option value="100%">full</option>
            </select>
          </label>
        </div>

        {entry ? (
          <div className={styles.grid} style={{ ['--frame-width' as string]: width }}>
            {Object.entries(entry.states).map(([state, render]) => (
              <figure key={state} className={styles.frame} style={{ margin: 0 }}>
                <figcaption className={styles.frameLabel}>
                  {entry.name} · {state}
                </figcaption>
                <div className={styles.stage} data-theme={theme === 'fish' ? 'fish' : undefined}>
                  {render()}
                </div>
              </figure>
            ))}
          </div>
        ) : (
          <p>No components registered yet.</p>
        )}
      </main>
    </div>
  );
}
