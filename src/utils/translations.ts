const TRANSLATION_DELIMITER = '|'

export function normalizeTranslation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function parseAcceptedTranslations(value: string) {
  return value
    .split(TRANSLATION_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function isCorrectTranslation(
  userAnswer: string,
  acceptedTranslationsRaw: string
) {
  const normalizedUserAnswer = normalizeTranslation(userAnswer)
  const acceptedTranslations = parseAcceptedTranslations(acceptedTranslationsRaw)
  const normalizedAcceptedTranslations = acceptedTranslations.map(normalizeTranslation)

  return {
    normalizedUserAnswer,
    acceptedTranslations,
    isCorrect: normalizedAcceptedTranslations.includes(normalizedUserAnswer),
  }
}

export function formatTranslationsForDisplay(value: string) {
  return parseAcceptedTranslations(value).join(' / ')
}
