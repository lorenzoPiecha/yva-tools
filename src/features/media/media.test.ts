import { describe, expect, it } from 'vitest';
import { formatMediaDuration } from './MediaTools';

describe('Visualizador de mídia', () => {
  it('formata durações para áudio e vídeo', () => {
    expect(formatMediaDuration(65)).toBe('1:05');
    expect(formatMediaDuration(3661)).toBe('1:01:01');
    expect(formatMediaDuration(Number.NaN)).toBe('—');
  });
});
