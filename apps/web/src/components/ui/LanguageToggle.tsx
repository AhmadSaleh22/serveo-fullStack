'use client';

import { useLanguageStore } from '@/lib/store';

export function LanguageToggle() {
  const { lang, setLang } = useLanguageStore();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
    >
      <span className="text-lg">{lang === 'en' ? '🇪🇬' : '🇬🇧'}</span>
      <span>{lang === 'en' ? 'عربي' : 'English'}</span>
    </button>
  );
}
