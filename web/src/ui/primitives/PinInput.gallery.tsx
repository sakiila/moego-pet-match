import { useId, useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { useI18n } from '../../i18n';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { PinInput } from './PinInput';

function Preview({ initial = '', invalid = false, disabled = false, autoFocus = false, longLabel = false }) {
  const { t } = useI18n();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState(invalid);
  const errorId = useId();
  return <div>
    <PinInput label={longLabel ? `${t('auth.pin_label')} · Alexandra Catherine Montgomery-Wellington` : t('auth.pin_label')}
      value={value} onChange={next => { setValue(next); setError(false); }}
      autoFocus={autoFocus} disabled={disabled} invalid={error} describedBy={error ? errorId : undefined} />
    {error && <div id={errorId} role="alert"><StatusMessage tone="error" text={t('auth.wrong_pin')} /></div>}
  </div>;
}

const entry: GalleryEntry = {
  name: 'PinInput', group: 'primitives', states: {
    empty: () => <Preview />,
    'focused / two digits': () => <Preview initial="01" autoFocus />,
    filled: () => <Preview initial="0123" />,
    error: () => <Preview initial="0123" invalid />,
    disabled: () => <Preview initial="01" disabled />,
    'long label / both languages / fish theme': () => <Preview longLabel />,
  },
};
export default entry;
