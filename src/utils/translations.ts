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

export function getFirstAcceptedTranslation(value: string) {
  const acceptedTranslations = parseAcceptedTranslations(value)

  return acceptedTranslations[0] ?? ''
}

export function getHintPrefix(value: string) {
  const firstTranslation = getFirstAcceptedTranslation(value)
  const translationLength = firstTranslation.length

  if (translationLength <= 4) {
    return firstTranslation.slice(0, 1)
  }

  if (translationLength <= 7) {
    return firstTranslation.slice(0, 2)
  }

  return firstTranslation.slice(0, 3)
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
