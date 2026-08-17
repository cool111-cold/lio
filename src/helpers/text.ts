export const LANGUAGES = ['ru', 'en'] as const
export type Language = typeof LANGUAGES[number]

export const DEFAULT_LANGUAGE: Language = 'ru'

const text = {
    ru: {
        cubeLabel: 'Проектирование 3D моделей и внедрение их в web',
    },
    en: {
        cubeLabel: 'Designing 3D models and integrating them into the web',
    },
} as const satisfies Record<Language, Record<string, string>>

export type TextKey = keyof (typeof text)[Language]

export const getText = (key: TextKey, language: Language = DEFAULT_LANGUAGE) => text[language][key]
