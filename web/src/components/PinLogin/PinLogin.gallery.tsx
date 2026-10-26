import { ApiError } from '../../api/client';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PinLogin, type PinLoginProps } from './PinLogin';

const colleague = { userId: 'U1', name: 'Bob' };
const noop = () => {};
const setup: PinLoginProps['loadState'] = async () => ({ ...colleague, hasPin: false });
const login: PinLoginProps['loadState'] = async () => ({ ...colleague, hasPin: true });
const pending = () => new Promise<never>(() => {});
const failed = () => Promise.reject(new Error('unavailable'));
const wrong = () => Promise.reject(new ApiError('unauthorized', 'wrong_pin'));
const locked = () => Promise.reject(new ApiError('rate_limited', 'locked'));
function Preview(props: Partial<PinLoginProps>) {
  return <PinLogin colleague={colleague} loadState={setup} submit={async () => {}} onBack={noop} onSuccess={noop} {...props} />;
}

const entry: GalleryEntry = {
  name: 'PinLogin', group: 'components', states: {
    'first login / empty / disabled': () => <Preview />,
    'returning player': () => <Preview loadState={login} />,
    loading: () => <Preview loadState={pending} />,
    'load failed / retry': () => <Preview loadState={failed} />,
    'submit loading': () => <Preview submit={pending} />,
    'wrong PIN': () => <Preview loadState={login} submit={wrong} />,
    locked: () => <Preview loadState={login} submit={locked} />,
    'long English name': () => <Preview colleague={{ userId: 'U_LONG', name: 'Alexandra Catherine Montgomery-Wellington' }} />,
  },
};
export default entry;
