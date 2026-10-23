import { Fragment } from 'react';

/**
 * 说明正文的极简排版：只认 `**粗体**` 与 `<br>` 换行（UI_COPY 里的正文只用到这两种），
 * 其余原样作为文字输出，不解析 HTML。
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split(/<br\s*\/?>/i);
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: i ? '0.6em 0 0' : 0 }}>
          {line.split(/(\*\*[^*]+\*\*)/).map((seg, j) =>
            seg.startsWith('**') && seg.endsWith('**') ? <strong key={j}>{seg.slice(2, -2)}</strong> : <Fragment key={j}>{seg}</Fragment>,
          )}
        </p>
      ))}
    </div>
  );
}
