import type { ElementType } from 'react';

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  /** Words from this index onward get `accentClass` (e.g. the italic accent phrase). */
  accentFrom?: number;
  accentClass?: string;
}

/**
 * Splits text into masked words (`.mw > .mi`) so a section can reveal them by sliding each word
 * up from behind its own clip line. The full text is exposed via aria-label for screen readers.
 */
export function Words({ text, as: Tag = 'span', className, accentFrom, accentClass = 'serif' }: Props) {
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="mw" aria-hidden="true">
            <span className={`mi${accentFrom !== undefined && i >= accentFrom ? ` ${accentClass}` : ''}`}>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
