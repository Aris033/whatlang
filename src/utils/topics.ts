const TOPIC_DELIMITER = '|'

export function parseTopics(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(TOPIC_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function hasTopic(value: string | null, selectedTopic: string) {
  const normalizedSelectedTopic = selectedTopic.trim().toLowerCase()

  if (!normalizedSelectedTopic) {
    return false
  }

  return parseTopics(value).some(
    (topic) => topic.toLowerCase() === normalizedSelectedTopic
  )
}

export function formatTopicsForDisplay(value: string | null) {
  return parseTopics(value).join(' / ')
}
