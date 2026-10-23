import { EuroPipe } from './euro.pipe';

describe('EuroPipe', () => {
  const pipe = new EuroPipe();

  it('formats prices in German notation', () => {
    expect(pipe.transform(2.4).replace(/\s/g, ' ')).toBe('2,40 €');
    expect(pipe.transform(1234.5).replace(/\s/g, ' ')).toBe('1.234,50 €');
  });

  it('returns an empty string for missing values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
