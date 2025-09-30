## Global Books Filter - Step-by-Step Guide

### Quick Start (Beginner Friendly)

Follow these steps to get a basic text + rating + pages filter working. You can refine later.

1) Create a filters type

```ts
// app/types/BookFilters.ts
export interface BookFilters {
  q?: string;           // text typed by user
  minRating?: number;   // 0..5
  minPages?: number;    // e.g. 100
  maxPages?: number;    // e.g. 500
}
```

2) Update your books hook to accept filters

```ts
// app/services/books.ts
import { useQuery } from '@tanstack/react-query';
import type { BookWithDetails } from '@/app/types/BookWithDetails';
import type { BookFilters } from '@/app/types/BookFilters';
import apiClient from '@/lib/http';

function toQueryString(filters?: BookFilters) {
  if (!filters) return '';
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = new URLSearchParams(entries as [string, string][]).toString();
  return qs ? `?${qs}` : '';
}

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      const qs = toQueryString(filters);
      const res = await apiClient.get<{ data: BookWithDetails[] }>(`/books${qs}`);
      return res.data.data;
    }
  });
}
```

3) Add a simple filter UI

```tsx
// app/components/forms/BooksFilter.tsx
'use client'
import { useEffect, useState } from 'react';
import type { BookFilters } from '@/app/types/BookFilters';

export default function BooksFilter({ value, onChange }: { value: BookFilters; onChange: (v: BookFilters) => void }) {
  const [local, setLocal] = useState<BookFilters>(value);

  useEffect(() => {
    const id = setTimeout(() => onChange(local), 300); // debounce
    return () => clearTimeout(id);
  }, [local, onChange]);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input
        placeholder="Search title/author/category"
        value={local.q || ''}
        onChange={(e) => setLocal({ ...local, q: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        placeholder="Min rating (0-5)"
        value={local.minRating ?? ''}
        onChange={(e) => setLocal({ ...local, minRating: e.target.value ? Number(e.target.value) : undefined })}
        className="border rounded px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Min pages"
          value={local.minPages ?? ''}
          onChange={(e) => setLocal({ ...local, minPages: e.target.value ? Number(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          placeholder="Max pages"
          value={local.maxPages ?? ''}
          onChange={(e) => setLocal({ ...local, maxPages: e.target.value ? Number(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />
      </div>
    </div>
  );
}
```

4) Use it on the books page

```tsx
// app/(home)/list/page.tsx
'use client'
import { useState } from 'react';
import type { BookFilters } from '@/app/types/BookFilters';
import BooksFilter from '@/app/components/forms/BooksFilter';
import { useBooks } from '@/app/services/books';

export default function BooksPage() {
  const [filters, setFilters] = useState<BookFilters>({});
  const { data: books, isLoading, error } = useBooks(filters);
  // ... render your list/grid with books
}
```

5) Backend: make numeric filters work (copy-paste)

- Your search endpoint already handles `q` and optional `authorId`. To support numeric filters (minRating, minPages, maxPages) on the global list, extend `GET /api/books` with these query params.

```ts
// app/api/books/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import type { BookWithDetails } from '@/app/types/BookWithDetails';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q');
    const minRating = searchParams.get('minRating');
    const minPages = searchParams.get('minPages');
    const maxPages = searchParams.get('maxPages');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT 
        b.id, b.title, b.pages, b.author_id, b.category_id,
        b.publish_date, b.rating, b.cover_url, b.annotation,
        b.created_at, b.updated_at,
        a.full_name as author_name,
        c.title as category_title
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (q && q.trim().length >= 2) {
      sql += ` AND (
        LOWER(b.title) LIKE LOWER($${i}) OR
        LOWER(a.full_name) LIKE LOWER($${i}) OR
        LOWER(c.title) LIKE LOWER($${i})
      )`;
      params.push(`%${q}%`); i++;
    }
    if (minRating) { sql += ` AND b.rating >= $${i}`; params.push(Number(minRating)); i++; }
    if (minPages)  { sql += ` AND b.pages >= $${i}`; params.push(Number(minPages)); i++; }
    if (maxPages)  { sql += ` AND b.pages <= $${i}`; params.push(Number(maxPages)); i++; }

    sql += ` ORDER BY b.title ASC LIMIT $${i}`; params.push(limit);

    const { rows } = await pool.query(sql, params);
    const books: BookWithDetails[] = rows.map(r => ({
      id: r.id,
      title: r.title,
      pages: r.pages,
      author_id: r.author_id,
      category_id: r.category_id,
      publish_date: r.publish_date,
      rating: r.rating,
      cover_url: r.cover_url,
      annotation: r.annotation,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: r.author_name ? { id: r.author_id, full_name: r.author_name } : undefined,
      category: r.category_title ? { id: r.category_id, title: r.category_title } : undefined,
    }));

    return ApiResponses.ok(books);
  } catch (e) {
    console.error('GET /api/books failed', e);
    return ApiResponses.internalServerError('Failed to fetch books');
  }
}
```

6) Frontend: only send numeric filters when > 0

Update your `toQueryString` to drop zero values so the server doesn’t treat empty inputs as real filters:

```ts
// app/services/books.ts (helper)
function toQueryString(filters?: BookFilters) {
  if (!filters) return '';
  const cleaned: Record<string, string> = {};
  for (const [key, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'number' && val <= 0) continue; // drop 0
    cleaned[key] = String(val);
  }
  const qs = new URLSearchParams(cleaned).toString();
  return qs ? `?${qs}` : '';
}
```

And ensure your `useBooks` prefers `/search/books?q=...` only for text search; numeric filters should go through `/books`:

```ts
// app/services/books.ts (inside queryFn)
const hasQ = !!filters?.query && filters.query.trim().length > 0;
const onlyQ = hasQ && !filters?.minRating && !filters?.minPages && !filters?.maxPages;
const basePath = onlyQ ? '/search/books' : '/books';
const qs = onlyQ ? `?${new URLSearchParams({ q: filters!.query }).toString()}` : toQueryString(filters);
const response = await apiClient.get<{ data: BookWithDetails[] }>(`${basePath}${qs}`);
```

7) Validation tips

- Text search: require at least 2 characters on the server (already in your search endpoint)
- Treat missing numeric inputs as “no filter” (skip them server-side)
- Add indexes from the Performance section below if the table is large

This guide shows how to add flexible filtering for your global books list, aligned with your current stack:

- Next.js App Router, React Query
- `app/services/books.ts` fetching `GET /api/books`
- Strong types in `app/types/*`
- Existing search endpoint `GET /api/search/books` (optional path)

You have two viable approaches. Pick one and follow the steps.

- Option A (recommended): Add filter query params to `GET /api/books` for the global list
- Option B: Reuse `GET /api/search/books` for text + attribute filters

Both options include the same frontend pieces: a typed filters object, a `useBooks` hook that accepts filters, and a `BooksFilter` UI component.

---

### 1) Define a typed filters object

Create a reusable type for filters. This keeps server, hook, and UI in sync.

```ts
// app/types/BookFilters.ts
export interface BookFilters {
  // text search over title/author/category
  q?: string;
  authorId?: string;
  categoryId?: string;
  minRating?: number;    // e.g. 0..5
  maxPages?: number;     // upper bound on pages
  minPages?: number;     // lower bound on pages
  publishedAfter?: string;  // ISO date string
  publishedBefore?: string; // ISO date string
  limit?: number;        // pagination page size
}
```

---

### 2A) Backend (Option A): Extend `GET /api/books` to accept filters

Update your `app/api/books/route.ts` handler to read query params, build a parameterized SQL query, and return `BookWithDetails[]` just like you already do elsewhere.

Key points:
- Only include WHERE clauses for provided filters
- Use parameterized queries with an incrementing index
- Keep the existing shape compatible with `BookWithDetails`

Example shape (pseudo-diff; adapt to your file):

```ts
// app/api/books/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import type { BookWithDetails } from '@/app/types/BookWithDetails';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q') || undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const minRating = searchParams.get('minRating');
    const minPages = searchParams.get('minPages');
    const maxPages = searchParams.get('maxPages');
    const publishedAfter = searchParams.get('publishedAfter');
    const publishedBefore = searchParams.get('publishedBefore');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT 
        b.id,
        b.title,
        b.pages,
        b.author_id,
        b.category_id,
        b.publish_date,
        b.rating,
        b.cover_url,
        b.annotation,
        b.created_at,
        b.updated_at,
        a.full_name as author_name,
        c.title as category_title
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let i = 1;

    if (q) {
      sql += ` AND (
        LOWER(b.title) LIKE LOWER($${i}) OR
        LOWER(a.full_name) LIKE LOWER($${i}) OR
        LOWER(c.title) LIKE LOWER($${i})
      )`;
      params.push(`%${q}%`); i++;
    }
    if (authorId) { sql += ` AND b.author_id = $${i}`; params.push(authorId); i++; }
    if (categoryId) { sql += ` AND b.category_id = $${i}`; params.push(categoryId); i++; }
    if (minRating) { sql += ` AND b.rating >= $${i}`; params.push(Number(minRating)); i++; }
    if (minPages)  { sql += ` AND b.pages >= $${i}`; params.push(Number(minPages)); i++; }
    if (maxPages)  { sql += ` AND b.pages <= $${i}`; params.push(Number(maxPages)); i++; }
    if (publishedAfter)  { sql += ` AND b.publish_date >= $${i}`; params.push(publishedAfter); i++; }
    if (publishedBefore) { sql += ` AND b.publish_date <= $${i}`; params.push(publishedBefore); i++; }

    sql += ` ORDER BY b.title ASC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(sql, params);
    const books: BookWithDetails[] = rows.map(r => ({
      id: r.id,
      title: r.title,
      pages: r.pages,
      author_id: r.author_id,
      category_id: r.category_id,
      publish_date: r.publish_date,
      rating: r.rating,
      cover_url: r.cover_url,
      annotation: r.annotation,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: r.author_name ? { id: r.author_id, full_name: r.author_name } : undefined,
      category: r.category_title ? { id: r.category_id, title: r.category_title } : undefined,
    }));

    return ApiResponses.ok(books);
  } catch (e) {
    return ApiResponses.internalServerError('Failed to fetch books');
  }
}
```

If you prefer not to modify `GET /api/books`, use Option B below instead.

---

### 2B) Backend (Option B): Reuse `GET /api/search/books`

You already have `app/api/search/books/route.ts` that supports `q`, optional `authorId`, and `limit`. If your initial scope is primarily text search (title/author/category), you can:

- Keep `GET /api/books` unchanged for the full list
- Use `GET /api/search/books` whenever filters are active
- Extend that endpoint later with more params (categoryId, rating, pages) following the same pattern as Option A

---

### 3) Frontend: Update `useBooks` hook to accept filters

Modify `app/services/books.ts` so it accepts an optional `BookFilters` and varies the `queryKey` and request URL accordingly.

```ts
// app/services/books.ts
import { useQuery } from '@tanstack/react-query';
import type { BookWithDetails } from '@/app/types/BookWithDetails';
import type { BookFilters } from '@/app/types/BookFilters';
import apiClient from '@/lib/http';

function toQueryString(filters?: BookFilters) {
  if (!filters) return '';
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const params = new URLSearchParams(entries as [string, string][]);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      const qs = toQueryString(filters);
      const url = qs ? `/books${qs}` : '/books'; // Option A
      // For Option B (search), you can instead route to `/search/books${qs}` when filters are present.
      const response = await apiClient.get<{ data: BookWithDetails[] }>(url);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
```

If you choose Option B, add logic to swap base path when `filters` include any property (e.g., `q`):

```ts
const basePath = filters && Object.keys(filters).length > 0 ? '/search/books' : '/books';
const response = await apiClient.get<{ data: BookWithDetails[] }>(`${basePath}${qs}`);
```

---

### 4) UI: Build a `BooksFilter` component

Place it near the top of `app/(home)/list/page.tsx`. It should:

- Manage local filter state (`q`, `authorId`, `categoryId`, `minRating`, `minPages`, `maxPages`)
- Debounce text input
- Call `useBooks(filters)` with the current state

Skeleton:

```tsx
// app/components/forms/BooksFilter.tsx
'use client'
import { useEffect, useMemo, useState } from 'react';
import type { BookFilters } from '@/app/types/BookFilters';
import { Input } from '@/components/ui/input'; // you already have inputs under components/ui
import { Select } from '@/components/ui/select';

interface BooksFilterProps {
  value: BookFilters;
  onChange: (next: BookFilters) => void;
}

export default function BooksFilter({ value, onChange }: BooksFilterProps) {
  const [local, setLocal] = useState<BookFilters>(value);

  // Debounce text search
  useEffect(() => {
    const id = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(id);
  }, [local, onChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input
        placeholder="Search by title, author, or category"
        value={local.q || ''}
        onChange={(e) => setLocal({ ...local, q: e.target.value })}
      />
      <Select
        value={local.minRating?.toString() ?? ''}
        onValueChange={(v) => setLocal({ ...local, minRating: v ? Number(v) : undefined })}
      >
        {/* options: 0..5 */}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Min pages"
          value={local.minPages ?? ''}
          onChange={(e) => setLocal({ ...local, minPages: e.target.value ? Number(e.target.value) : undefined })}
        />
        <Input
          type="number"
          placeholder="Max pages"
          value={local.maxPages ?? ''}
          onChange={(e) => setLocal({ ...local, maxPages: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
    </div>
  );
}
```

Use this component on the books page and pass its state to `useBooks`:

```tsx
// app/(home)/list/page.tsx
'use client'
import { useState } from 'react';
import Section from '@/app/components/layouts/Section';
import { useBooks } from '@/app/services/books';
import BooksFilter from '@/app/components/forms/BooksFilter';
import type { BookFilters } from '@/app/types/BookFilters';

export default function BooksPage() {
  const [filters, setFilters] = useState<BookFilters>({});
  const { data: books, isLoading, error } = useBooks(filters);

  return (
    <Section>
      <div className="space-y-6">
        <BooksFilter value={filters} onChange={setFilters} />
        {/* existing list/grid rendering using books */}
      </div>
    </Section>
  );
}
```

---

### 5) Performance: Supabase/Postgres indexes

To keep filters fast, add indexes. Use your Supabase project to run these (SQL Editor or migration):

```sql
-- Accelerate equality filters
create index if not exists idx_books_author_id on books(author_id);
create index if not exists idx_books_category_id on books(category_id);

-- Range queries
create index if not exists idx_books_rating on books(rating);
create index if not exists idx_books_pages on books(pages);
create index if not exists idx_books_publish_date on books(publish_date);

-- Text search over title; for ILIKE/LOWER(title) LIKE '%q%'
-- You can choose either a trigram index (best for substring search) or a simple btree on LOWER(title)
create extension if not exists pg_trgm;
create index if not exists idx_books_title_trgm on books using gin (title gin_trgm_ops);

-- Optional: author and category names
create index if not exists idx_authors_full_name_trgm on authors using gin (full_name gin_trgm_ops);
create index if not exists idx_categories_title_trgm on categories using gin (title gin_trgm_ops);
```

Tip: If you filter mostly by `q`, favor the `/search/books` path and the trigram indexes above.

---

### 6) UX polish

- Show active filters as chips with a clear button
- Persist filters in the URL (`useSearchParams`) so refresh/share keeps state
- Add skeletons and empty states; your `ReusableList` and `AccordionList` already support loading/error
- Invalidate queries when creating a new book (already done in `useSearchBooks` via `queryClient.invalidateQueries(['books'])`)

---

### 7) Quick sanity checklist

- `BookFilters` type exists and is imported where needed
- Backend endpoint handles each provided filter param safely and is parameterized
- `useBooks(filters)` varies both `queryKey` and URL
- `BooksFilter` updates parent `filters` with debounce for text
- Indexes are applied in Supabase; explainable performance for large datasets

That’s it — your global books list now supports fast, typed, and user-friendly filtering.


