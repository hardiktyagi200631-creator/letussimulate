import { describe, it, expect } from 'vitest';
import { TRANSLATIONS, LANGUAGES, getTranslation, type LanguageCode } from '../../src/i18n/translations';

describe('Multilingual i18n System', () => {
  const expectedLanguages: LanguageCode[] = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar', 'ja'];

  it('supports all 8 required languages with proper metadata', () => {
    expect(LANGUAGES).toHaveLength(8);
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expect.arrayContaining(expectedLanguages));

    const arMeta = LANGUAGES.find((l) => l.code === 'ar');
    expect(arMeta?.dir).toBe('rtl');

    const enMeta = LANGUAGES.find((l) => l.code === 'en');
    expect(enMeta?.dir).toBe('ltr');
  });

  it('guarantees complete key parity across all 8 languages', () => {
    const enKeys = Object.keys(TRANSLATIONS.en);
    expect(enKeys.length).toBeGreaterThanOrEqual(100);

    for (const lang of expectedLanguages) {
      const dict = TRANSLATIONS[lang];
      expect(dict).toBeDefined();

      for (const key of enKeys) {
        expect(dict[key], `Language ${lang} missing key: ${key}`).toBeDefined();
        expect(dict[key].trim().length, `Language ${lang} has empty key: ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('translates dynamic stroke and telemetry badges accurately', () => {
    // English
    expect(TRANSLATIONS.en.stroke_1).toBe('1. INTAKE (SUCTION)');
    expect(TRANSLATIONS.en.val_firing).toBe('FIRING');
    expect(TRANSLATIONS.en.piston_down).toBe('Down (TDC→BDC)');

    // Hindi
    expect(TRANSLATIONS.hi.stroke_1).toContain('सक्शन');
    expect(TRANSLATIONS.hi.val_firing).toBe('सक्रिय (फायरिंग)');
    expect(TRANSLATIONS.hi.piston_down).toBe('नीचे (TDC→BDC)');

    // Spanish
    expect(TRANSLATIONS.es.stroke_1).toContain('ADMISIÓN');
    expect(TRANSLATIONS.es.val_firing).toBe('ENCENDIDO');

    // French
    expect(TRANSLATIONS.fr.stroke_1).toContain('ADMISSION');
    expect(TRANSLATIONS.fr.val_firing).toBe('ALLUMÉ');

    // German
    expect(TRANSLATIONS.de.stroke_1).toContain('ANSAUG');
    expect(TRANSLATIONS.de.val_firing).toBe('ZÜNDUNG');

    // Portuguese
    expect(TRANSLATIONS.pt.stroke_1).toContain('ADMISSÃO');
    expect(TRANSLATIONS.pt.val_firing).toBe('IGNIÇÃO');

    // Arabic
    expect(TRANSLATIONS.ar.stroke_1).toContain('السحب');
    expect(TRANSLATIONS.ar.val_firing).toBe('اشتعال');

    // Japanese
    expect(TRANSLATIONS.ja.stroke_1).toContain('吸気');
    expect(TRANSLATIONS.ja.val_firing).toBe('点火中');
  });

  it('translates component inspector metadata in each language', () => {
    for (const lang of expectedLanguages) {
      expect(TRANSLATIONS[lang].comp_piston).toBeDefined();
      expect(TRANSLATIONS[lang].comp_piston_def).toBeDefined();
      expect(TRANSLATIONS[lang].comp_connectingRod).toBeDefined();
      expect(TRANSLATIONS[lang].comp_crankshaft).toBeDefined();
      expect(TRANSLATIONS[lang].ctrl_isolate).toBeDefined();
      expect(TRANSLATIONS[lang].ctrl_restore).toBeDefined();
    }
  });

  it('safely falls back to English when given an unknown key or language', () => {
    expect(getTranslation('en', 'title')).toBe('Four-Stroke Engine Simulator');
    expect(getTranslation('hi', 'non_existent_key')).toBe('non_existent_key');
  });
});
