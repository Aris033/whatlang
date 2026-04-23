# WhatLang

WhatLang is a responsive English learning web app focused on active practice instead of passive reading.

The current product is built around vocabulary training: the user sees an English word, writes the Spanish translation, gets immediate feedback, and gradually builds a review loop based on real mistakes.

The app already supports authenticated practice with Supabase, a guest preview mode, multiple vocabulary practice modes, and a mistakes review flow based on accumulated progress.

## What the app does

WhatLang is designed to help users practise English in short, repeatable sessions.

Right now the main experience includes:

- `Free Practice`: open vocabulary practice with answer checking, hint and reveal support
- `Quiz`: 10-question vocabulary quiz by selected difficulty or random mix
- `Category`: 5-question vocabulary session filtered by a selected topic/category
- `Sprint`: timed 35-second vocabulary challenge
- `Mistakes`: review screen built from each user's progress, showing words that still need reinforcement
- `Guest mode`: a limited preview without login, restricted to `Free Practice` with local demo words and no persistence

The app also prepares the product for future learning areas such as:

- `Phrasal Verbs`
- `Verbs`
- `Grammar`

These appear in the UI as coming soon sections to reflect the intended direction of the platform.

## Product idea

The goal of WhatLang is to feel like a focused language-learning product, not just a technical demo.

That means the app is built around:

- short practice loops
- fast feedback
- lightweight progression
- visible review of weak points
- mobile-friendly sessions

The current version is still vocabulary-first, but the structure is already prepared to grow into broader English learning modules.

## Tech stack

WhatLang is built with:

- `Vite`
- `React 19`
- `TypeScript`
- `Supabase`
- `CSS` without Tailwind

### Frontend

- `React` is used for the UI and local state-driven flows
- `TypeScript` is used across components, services and app types
- `Vite` provides the dev server and production build pipeline
- Styling is written with plain maintainable CSS in `src/App.css` and `src/index.css`

### Backend / data

`Supabase` is used for:

- authentication with email + password
- reading vocabulary from the `words` table
- saving attempts to the `answers` table
- updating per-user summary progress in `user_word_progress`

## Main features implemented

### Authentication

- Email + password sign in
- Email + password sign up
- Sign out
- Session detection on app load
- Auth state change listening
- Welcome toast after successful sign in

### Guest mode

- Users can try the app without registering
- Guest mode is limited to `Free Practice`
- Answers are checked locally only
- No answers, mistakes or progress are saved
- Guest mode uses a small local demo vocabulary set

### Vocabulary practice

- Random word loading
- Multiple valid Spanish translations in one field using `|`
- Normalized answer checking:
  - lowercase
  - trim
  - accent-insensitive comparison
- Human-friendly display of accepted translations using ` / `

### Free Practice

- Open-ended vocabulary practice
- `Hint -> Reveal` flow
- Automatic advance after a correct answer
- Answer persistence for authenticated users
- Progress updates in `user_word_progress`

### Quiz

- Exactly 10 questions
- Difficulty selector: `1`, `2`, `3`, `4`, `Random`
- Supabase filtering by difficulty when a level is selected
- No hints or reveal
- Score summary at the end

### Category mode

- Exactly 5 questions
- Category selector based on the `topic` field
- Support for multiple categories in `topic` using `|`
- Topic matching is safely parsed and validated
- No hints or reveal

### Sprint mode

- 35-second timed session
- Visible countdown
- Immediate next word after each answer
- Running stats for:
  - correct
  - wrong
  - total answered

### Mistakes

- Built from `user_word_progress`, not raw answer history
- Shows only words where `wrong_count > correct_count`
- Inline retry directly inside each card
- Translation toggle
- Pagination in groups of 5

## Current data model

The app currently expects these Supabase tables:

### `words`

Used as the vocabulary source.

Expected fields:

- `id`
- `english_word`
- `spanish_translation`
- `difficulty`
- `topic`
- `created_at`

Notes:

- `spanish_translation` may contain multiple accepted answers separated by `|`
- `topic` may contain multiple categories separated by `|`

### `answers`

Stores each practice attempt.

Expected fields:

- `id`
- `user_id`
- `word_id`
- `user_answer`
- `is_correct`
- `answered_at`
- `hint_used`
- `reveal_used`
- `penalty_points`

### `user_word_progress`

Stores one summary row per `user + word`.

Expected fields:

- `id`
- `user_id`
- `word_id`
- `correct_count`
- `wrong_count`
- `last_is_correct`
- `last_answered_at`
- `updated_at`

## Project structure

```text
src/
  components/
    CategoryPractice.tsx
    DifficultyIndicator.tsx
    FreePractice.tsx
    NavBar.tsx
    QuizPractice.tsx
    SprintPractice.tsx
  lib/
    guestWords.ts
    supabase.ts
  pages/
    Home.tsx
    Login.tsx
    Mistakes.tsx
    Practice.tsx
  services/
    answersService.ts
    dashboardService.ts
    mistakesService.ts
    progressService.ts
    reviewService.ts
    wordsService.ts
  types/
    dashboard.ts
    mistake.ts
    navigation.ts
    practice.ts
    progress.ts
    word.ts
  utils/
    topics.ts
    translations.ts
  App.tsx
  App.css
  index.css
  main.tsx
```

## How the app is organised

### `pages`

Top-level views such as:

- `Home`
- `Login`
- `Practice`
- `Mistakes`

### `components`

Reusable or mode-specific UI pieces such as:

- `FreePractice`
- `QuizPractice`
- `CategoryPractice`
- `SprintPractice`
- `DifficultyIndicator`

### `services`

Business logic and Supabase interaction:

- fetching words
- saving answers
- updating progress
- building mistake lists
- assembling dashboard summary data

### `utils`

Small shared helpers for core learning logic:

- translation parsing and normalization
- topic/category parsing

### `types`

Shared TypeScript models for app data and navigation state.

## Practice architecture

The practice system is intentionally simple and component-driven.

At a high level:

1. `Practice.tsx` acts as the entry point for the practice area.
2. It first groups training under the `Vocabulary` area.
3. Inside that area, the app exposes the current modes:
   - `Free Practice`
   - `Quiz`
   - `Category`
   - `Sprint`
4. Each mode lives in its own component and uses shared services/utilities.

This keeps the app easy to extend later when `Phrasal Verbs`, `Verbs` and `Grammar` become real modules.

## Answer-checking logic

One important part of WhatLang is that answer checking is shared and normalized across the app.

Current rules:

- the `spanish_translation` field can contain multiple valid answers using `|`
- user input is normalized before comparison
- accepted translations are also normalized before comparison

Normalization includes:

- trimming spaces
- lowercasing
- removing accents / diacritics

Examples:

- `oír` matches `oir`
- ` ESCUCHAR ` matches `escuchar`
- `bello` matches one option inside `hermoso|bello|lindo`

## UI / UX direction

The current UI is built to feel calm, clean and product-like.

Design choices include:

- custom CSS without utility frameworks
- responsive layout for desktop and mobile
- a branded header and dashboard feel
- compact practice cards
- a lightweight login flow with guest preview
- sticky, non-invasive controls where useful

The idea is to keep the interface clear and fast to scan while still feeling like a real learning product.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

## Environment setup

The app expects Supabase environment variables to be configured for authenticated features.

Typical Vite setup:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These values are consumed by:

- `src/lib/supabase.ts`

Without valid Supabase configuration:

- authenticated login will not work
- persisted practice flows will not work
- guest mode can still be useful as a local preview

## Scripts

Available scripts from `package.json`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Current limitations

This is already a solid product base, but it is still an early version.

Things not implemented yet:

- real stats/progress dashboard views
- phrases practice module
- phrasal verbs practice module
- verbs practice module
- grammar practice module
- audio / listening
- speaking / pronunciation
- spaced repetition scheduling

## Why this structure works

The current project is simple on purpose.

It avoids overengineering by keeping:

- local UI state inside components where possible
- shared logic in focused services
- reusable parsing utilities for core language rules
- a small set of typed domain models

That makes the codebase easy to reason about, easy to extend, and very suitable for incrementally adding new English learning features.

## Next natural steps

Good next steps for the product would be:

- add a real `Phrases` module
- create a proper `Stats` page from `answers` and `user_word_progress`
- improve review scheduling beyond the current mistakes rule
- expand guest preview content
- add richer progress visualisation and streaks

---

WhatLang is currently a strong base for an English practice product centered on vocabulary, feedback and lightweight review, with a structure ready to grow into a broader learning platform.
