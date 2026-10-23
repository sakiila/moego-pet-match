import styles from './Toggle.module.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 无障碍名称（通常是这一行的标签）。 */
  label: string;
  onText: string;
  offText: string;
  disabled?: boolean;
}

/** 开关：同时用文字（开 / 关）与圆点位置表示状态，开为橙色轨道、关为灰色；不可用时整体变淡。 */
export function Toggle({ checked, onChange, label, onText, offText, disabled }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={styles.wrap} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={styles.text} data-on={checked}>
        {checked ? onText : offText}
      </span>
      <span className={styles.track} data-on={checked}>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
