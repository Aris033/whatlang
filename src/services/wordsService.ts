import { supabase } from '../lib/supabase'
import type { Word } from '../types/word'

function createWordsQuery() {
  return supabase
    .from('words')
    .select(
      'id, english_word, spanish_translation, difficulty, topic, created_at'
    )
}

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function fetchWords(): Promise<Word[]> {
  const { data, error } = await createWordsQuery().order('created_at', {
    ascending: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data satisfies Word[]
}

export async function fetchWordsByDifficulty(
  difficulty: string
): Promise<Word[]> {
  const parsedDifficulty = Number(difficulty)
  const difficultyFilter = Number.isNaN(parsedDifficulty)
    ? difficulty
    : parsedDifficulty

  const { data, error } = await createWordsQuery()
    .eq('difficulty', difficultyFilter)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data satisfies Word[]
}

export async function fetchWordsByTopic(topic: string): Promise<Word[]> {
  const trimmedTopic = topic.trim()

  const { data, error } = await createWordsQuery()
    .ilike('topic', `%${escapeLikeValue(trimmedTopic)}%`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data satisfies Word[]
}
