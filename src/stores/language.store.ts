import { create } from 'zustand'

export type Language = 'vi' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  initLanguage: () => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'vi',
  initLanguage: () => {
    const savedLang = localStorage.getItem('language') as Language | null
    if (savedLang === 'vi' || savedLang === 'en') {
      set({ language: savedLang })
    } else {
      // Default to vi
      set({ language: 'vi' })
    }
  },
  setLanguage: (lang: Language) => {
    set({ language: lang })
    localStorage.setItem('language', lang)
  }
}))
