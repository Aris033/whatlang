type DifficultyIndicatorProps = {
  difficulty: string | number | null
}

function getDifficultyLevel(value: string | number | null) {
  const parsedValue = Number(value)

  if (Number.isNaN(parsedValue)) {
    return null
  }

  return Math.min(4, Math.max(1, parsedValue))
}

function DifficultyIndicator({ difficulty }: DifficultyIndicatorProps) {
  const level = getDifficultyLevel(difficulty)

  if (!level) {
    return null
  }

  return (
    <div
      className={`difficulty-indicator difficulty-indicator--level-${level}`}
      aria-label={`Difficulty level ${level} out of 4`}
      title={`Difficulty ${level}/4`}
    >
      {[1, 2, 3, 4].map((item) => (
        <span
          key={item}
          className={
            item <= level
              ? 'difficulty-indicator__bar is-filled'
              : 'difficulty-indicator__bar'
          }
        />
      ))}
    </div>
  )
}

export default DifficultyIndicator
