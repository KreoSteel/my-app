## Friends Feature: Invitations via Links, Profiles with Full Name, Age, and Books

This document provides a step-by-step plan to implement a Friends feature with invitation links and a Friend page showing a user's full name, age, and their books. It aligns with your current stack (Next.js App Router APIs, Postgres via Supabase/`pg` `Pool`, JWT-based auth) and your existing schema:

- `users(id uuid, full_name varchar, email varchar, hashed_password text, age smallint, avatar_url varchar, created_at timestamptz, updated_at timestamp)`
- `books`, `authors`, `categories`
- `user_books(user_id uuid, book_id uuid, rating real, description text, status varchar, started_at date, finished_at date, created_at timestamptz, updated_at timestamp)`

We will add:
- `friend_invitations` to manage invitation links
- `friendships` to store mutual friend relationships

Your existing code uses `pg` via `lib/supabase.ts`, and you already have helpers to fetch a user's books (`app/api/lib/userBooks.ts`). We'll reuse that.

---

### 1) Database: Tables and Policies

Create tables for invitations and friendships. Tokens are random, time-limited, and single-use. Use unique constraints to prevent duplicates.

```sql
-- 1.1 friend_invitations
create table if not exists public.friend_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.users(id) on delete cascade,
  invitee_email varchar not null,
  token text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists friend_invitations_inviter_idx on public.friend_invitations(inviter_id);
create index if not exists friend_invitations_email_idx on public.friend_invitations(invitee_email);

-- 1.2 friendships (mutual; enforce undirected uniqueness via (user_id, friend_user_id) ordering convention in code)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, friend_user_id)
);

create index if not exists friendships_user_idx on public.friendships(user_id);
create index if not exists friendships_friend_idx on public.friendships(friend_user_id);
```

If you're using Supabase migrations, add a new migration (e.g., `2025XXXXXX_add_friends`) with the SQL above.

RLS suggestions (optional now; adjust per your policy model):

```sql
-- Enable RLS and basic owner/read rules if you rely on PostgREST. Your app uses server-side queries via Pool,
-- so you can skip RLS for first iteration or allow authenticated access. Keep least-privilege in production.
alter table public.friend_invitations enable row level security;
alter table public.friendships enable row level security;

-- Example policies (adapt/expand later):
create policy "own_invites"
  on public.friend_invitations for all
  to authenticated
  using (auth.uid() = inviter_id);

create policy "own_friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_user_id);
```

---

### 2) Invitation Flow Overview

- Authenticated user generates an invitation link for a friend by email
- System creates `friend_invitations` row with a random `token` and expiry
- Recipient visits `/friends/invite/[token]` while logged in or after registering
- On acceptance:
  - Validate token is unexpired and not used
  - Create mutual friendship rows: `(A -> B)` and `(B -> A)`
  - Mark invitation `accepted_at`
  - Redirect to Friend page `/friends/[friendId]`

Token generation: use Node `crypto` (url-safe) or PostgreSQL `gen_random_bytes`. We'll use Node for simplicity.

```ts
import crypto from 'crypto';
function generateUrlSafeToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}
```

---

### 3) API Endpoints (Next.js App Router)

Target directory structure:
- `app/api/friends/invitations/route.ts` (POST: create invitation)
- `app/api/friends/invitations/[token]/route.ts` (GET: inspect, POST: accept)
- `app/api/friends/route.ts` (GET: list my friends)
- `app/api/friends/[friendId]/route.ts` (GET: friend profile + books)

We will reuse:
- `lib/supabase.ts` Pool
- Auth helpers you already have (`app/api/auth/login/route.ts` + JWT). Ensure you can read the current user from the `Authorization` header in a small utility.

Example: `getAuthenticatedUserId(req)` utility (adjust to your JWT impl in `app/api/lib/jwt.ts`).

```ts
// app/api/lib/authUser.ts
import { NextRequest } from 'next/server';
import { decode } from '@/app/api/lib/jwt';

export function getAuthenticatedUserId(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7);
  try {
    const payload = decode(token); // your Promise-returning or sync wrapper per your jwt helper
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}
```

3.1 Create Invitation

```ts
// app/api/friends/invitations/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import { getAuthenticatedUserId } from '@/app/api/lib/authUser';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return ApiResponses.unauthorized('Unauthorized');

  const { email } = await req.json();
  if (!email) return ApiResponses.badRequest('Email is required');

  const token = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `insert into friend_invitations (inviter_id, invitee_email, token, expires_at)
     values ($1, $2, $3, $4)`,
    [userId, email, token, expiresAt]
  );

  const link = `${process.env.APP_ORIGIN}/friends/invite/${token}`; // e.g., https://your-app.com
  return ApiResponses.created({ token, link }, 'Invitation created');
}
```

3.2 Inspect Invitation and Accept

```ts
// app/api/friends/invitations/[token]/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import { getAuthenticatedUserId } from '@/app/api/lib/authUser';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const { rows } = await pool.query(
    `select fi.*, u.full_name as inviter_name from friend_invitations fi
     join users u on u.id = fi.inviter_id where token = $1`,
    [params.token]
  );
  if (rows.length === 0) return ApiResponses.notFound('Invitation not found');
  const invite = rows[0];
  const expired = new Date(invite.expires_at).getTime() < Date.now();
  return ApiResponses.ok({ invite, expired });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const currentUserId = getAuthenticatedUserId(req);
  if (!currentUserId) return ApiResponses.unauthorized('Unauthorized');

  // Load invite
  const { rows } = await pool.query(
    `select * from friend_invitations where token = $1`,
    [params.token]
  );
  if (rows.length === 0) return ApiResponses.notFound('Invitation not found');
  const invite = rows[0];

  if (invite.accepted_at) return ApiResponses.conflict('Invitation already accepted');
  if (new Date(invite.expires_at).getTime() < Date.now()) return ApiResponses.gone('Invitation expired');

  // If email constraint is desired, you can assert the current user's email matches invitee_email here.

  // Create mutual friendship (idempotent)
  await pool.query('begin');
  try {
    await pool.query(
      `insert into friendships (user_id, friend_user_id)
       values ($1, $2) on conflict do nothing`,
      [invite.inviter_id, currentUserId]
    );
    await pool.query(
      `insert into friendships (user_id, friend_user_id)
       values ($1, $2) on conflict do nothing`,
      [currentUserId, invite.inviter_id]
    );
    await pool.query(
      `update friend_invitations set accepted_at = now() where id = $1`,
      [invite.id]
    );
    await pool.query('commit');
  } catch (e) {
    await pool.query('rollback');
    throw e;
  }

  return ApiResponses.ok({ friendId: invite.inviter_id }, 'Invitation accepted');
}
```

3.3 List My Friends

```ts
// app/api/friends/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import { getAuthenticatedUserId } from '@/app/api/lib/authUser';

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return ApiResponses.unauthorized('Unauthorized');

  const { rows } = await pool.query(
    `select u.id, u.full_name, u.age, u.avatar_url
     from friendships f
     join users u on u.id = f.friend_user_id
     where f.user_id = $1
     order by u.full_name asc`,
    [userId]
  );
  return ApiResponses.ok(rows);
}
```

3.4 Friend Profile (Full name, age, and books)

```ts
// app/api/friends/[friendId]/route.ts
import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import { getAuthenticatedUserId } from '@/app/api/lib/authUser';
import { getUserBooks } from '@/app/api/lib/userBooks';

export async function GET(req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return ApiResponses.unauthorized('Unauthorized');

  // Optional guard: ensure they are friends
  const rel = await pool.query(
    `select 1 from friendships where user_id = $1 and friend_user_id = $2`,
    [userId, params.friendId]
  );
  if (rel.rowCount === 0) return ApiResponses.forbidden('Not friends');

  const { rows } = await pool.query(
    `select id, full_name, age, avatar_url from users where id = $1`,
    [params.friendId]
  );
  if (rows.length === 0) return ApiResponses.notFound('User not found');

  const books = await getUserBooks(params.friendId);
  return ApiResponses.ok({ profile: rows[0], books });
}
```

---

### 4) Frontend Pages

4.1 Friends List Page: `/friends`

Features:
- Loads my friends via `GET /api/friends`
- Shows `full_name`, `age`, avatar
- Link to `/friends/[friendId]`
- Form to create an invitation by email (calls `POST /api/friends/invitations`), shows generated link

```tsx
// app/(app)/friends/page.tsx
"use client";
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/http';
import { useState } from 'react';
import Link from 'next/link';

export default function FriendsPage() {
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await apiClient.get('/friends')).data.data,
  });
  const [email, setEmail] = useState('');
  const invite = useMutation({
    mutationFn: async (payload: { email: string }) => (await apiClient.post('/friends/invitations', payload)).data.data,
  });

  return (
    <div className="container">
      <h1>My Friends</h1>
      <ul>
        {friends?.map((f: any) => (
          <li key={f.id}>
            <Link href={`/friends/${f.id}`}>{f.full_name} {f.age ? `(${f.age})` : ''}</Link>
          </li>
        ))}
      </ul>

      <h2>Invite a Friend</h2>
      <form onSubmit={async (e) => { e.preventDefault(); invite.mutate({ email }); }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" />
        <button type="submit">Create Invite</button>
      </form>
      {invite.data?.link && (
        <p>Share this link: <a href={invite.data.link}>{invite.data.link}</a></p>
      )}
    </div>
  );
}
```

4.2 Invitation Landing: `/friends/invite/[token]`

Behavior:
- Fetch `GET /api/friends/invitations/[token]` to show inviter and expiry status
- If logged in, show Accept button → POST to same endpoint → redirect to `/friends/[friendId]`
- If not logged in, prompt to login/register first; after auth, retry accept

```tsx
// app/(public)/friends/invite/[token]/page.tsx
"use client";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/http';

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['invite', params.token],
    queryFn: async () => (await apiClient.get(`/friends/invitations/${params.token}`)).data.data,
  });
  const accept = useMutation({
    mutationFn: async () => (await apiClient.post(`/friends/invitations/${params.token}`)).data.data,
    onSuccess: (res) => router.push(`/friends/${res.friendId}`),
  });

  if (!data) return null;
  if (data.expired) return <p>Invitation expired.</p>;
  return (
    <div className="container">
      <h1>Friend Invitation</h1>
      <p>You were invited by {data.invite.inviter_name}.</p>
      <button onClick={() => accept.mutate()}>Accept</button>
    </div>
  );
}
```

4.3 Friend Profile Page: `/friends/[friendId]`

Loads `GET /api/friends/[friendId]` and shows profile and list of books using your existing format from `getUserBooks`.

```tsx
// app/(app)/friends/[friendId]/page.tsx
"use client";
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/http';

export default function FriendProfile({ params }: { params: { friendId: string } }) {
  const { data } = useQuery({
    queryKey: ['friend', params.friendId],
    queryFn: async () => (await apiClient.get(`/friends/${params.friendId}`)).data.data,
  });
  if (!data) return null;
  const { profile, books } = data;
  return (
    <div className="container">
      <h1>{profile.full_name} {profile.age ? `(${profile.age})` : ''}</h1>
      <h2>Books</h2>
      <ul>
        {books.map((b: any) => (
          <li key={b.id}>{b.title} {b.author ? `by ${b.author.full_name}` : ''}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 5) Wiring Auth on the Client

Your login/register endpoints already issue access/refresh tokens. Ensure `apiClient` attaches `Authorization: Bearer <token>` header. If not, add an interceptor or wrapper.

```ts
// lib/http.ts (concept)
import axios from 'axios';
const apiClient = axios.create({ baseURL: '/api' });
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default apiClient;
```

---

### 6) Validation and Edge Cases

- Prevent self-invites: check `invitee_email` vs inviter email on creation
- Token reuse: guard with `accepted_at is null`
- Expiry: refuse when `expires_at < now()`
- Friendship idempotency: `on conflict do nothing`
- Email binding (optional): require current user's email to match `invitee_email` when accepting
- Privacy: friend profile endpoint checks they are friends before returning details

---

### 7) Optional Enhancements

- Email delivery: send invitation links via an email provider
- Revoke invitations: add `revoked_at` column and an endpoint
- Rate limits: limit invitations per day per user
- UI polish: display avatars, statuses, book counts, loading skeletons

---

### 8) Step-by-Step Checklist

1. Apply DB migration for `friend_invitations` and `friendships`
2. Add `getAuthenticatedUserId` utility using your JWT decode
3. Implement API routes for invitations, acceptance, list friends, and friend profile
4. Build pages `/friends`, `/friends/invite/[token]`, `/friends/[friendId]`
5. Ensure `apiClient` attaches `Authorization` header
6. Test: create invite → open link as another user → accept → view friend page with books

---

### 9) Reusing Your Existing Modules

- Database access: `lib/supabase.ts` Pool is used by all new endpoints
- Books hydration: `app/api/lib/userBooks.ts` returns the exact shape to list a user's books
- Auth: continue using your `generateAccessToken`/`generateRefreshToken` and implement `decode` in `app/api/lib/jwt.ts` (HS256 with `JWT_SECRET`) as per your project standard

---

### 10) Environment Variables

- `APP_ORIGIN` (e.g., `https://your-app.com`) for generating absolute invitation links
- `JWT_SECRET` for token decoding on the server

---

This plan is designed to drop into your current project structure with minimal friction while respecting the database you already have in Supabase (`users`, `user_books`, etc.).


