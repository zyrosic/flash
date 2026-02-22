# FlashForge —  Flashcard Notes Generator

A premium Next.js site that lets users **sign up / sign in with Supabase** and generate **beautiful flashcards from notes** using the **Gemini API**.

![Preview](/app/opengraph-image.png)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## What you get

- Landing page (premium UI)
- Auth (Supabase email/password): `/signup`, `/login`
- Flashcard Studio dashboard: `/dashboard`
- Gemini-powered API route: `/api/flashcards`
- Export flashcards as CSV/JSON

## Tech

- Next.js 15 + App Router
- Tailwind CSS 4 + shadcn/ui
- Supabase Auth (client-side)
- Gemini API (server route)

## Setup

### 1) Create a Supabase project

In **Supabase Dashboard → Project Settings → API**, copy:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then in **Authentication → Providers → Email**, enable Email auth.

### 2) Get a Gemini API key

Create an API key for Gemini and set it as `GEMINI_API_KEY`.

### 3) Configure environment variables

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 4) Install & run

```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000`.

## Usage

1. Visit `/signup` and create an account.
2. Go to `/dashboard`.
3. Paste your notes → choose card count and style → Generate.
4. Flip cards, copy, or export CSV/JSON.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

MIT
