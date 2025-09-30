# MyList Page Implementation Plan

## Overview
This document outlines the implementation plan for the MyList page, where each user can view and manage their personal book collection. The page will display books that users have added to their personal reading list with additional metadata like reading status, personal rating, and notes.

## Current Database Analysis

### Existing Tables
1. **users** - User accounts
   - `id` (uuid, primary key)
   - `full_name` (varchar)
   - `email` (varchar, unique)
   - `hashed_password` (text)
   - `age` (smallint, nullable)
   - `avatar_url` (varchar, nullable)
   - `created_at`, `updated_at` (timestamps)

2. **books** - Book catalog
   - `id` (uuid, primary key)
   - `title` (varchar)
   - `pages` (smallint, nullable)
   - `author_id` (uuid, foreign key to authors.id)
   - `category_id` (uuid, foreign key to categories.id)
   - `rating` (real, nullable)
   - `cover_url` (varchar, nullable)
   - `publish_date` (date, nullable)
   - `annotation` (text, nullable)
   - `created_at`, `updated_at` (timestamps)

3. **authors** - Author information
   - `id` (uuid, primary key)
   - `full_name` (varchar, nullable)
   - `description` (text, nullable)
   - `birth_date` (date, nullable)
   - `created_at`, `updated_at` (timestamps)

4. **categories** - Book categories
   - `id` (uuid, primary key)
   - `title` (varchar, unique)
   - `description` (text)
   - `created_at`, `updated_at` (timestamps)

5. **user_books** - User's personal book collection (CURRENTLY MISSING user_id!)
   - `id` (uuid, primary key)
   - `book_id` (uuid, foreign key to books.id)
   - `rating` (real, nullable) - User's personal rating
   - `description` (text, nullable) - User's personal notes
   - `status` (varchar, nullable) - Reading status (to_read, reading, completed, abandoned)
   - `started_at` (date, nullable)
   - `finished_at` (date, nullable)
   - `created_at`, `updated_at` (timestamps)

## Critical Issues Identified

### 1. Missing user_id Column
The `user_books` table is missing a `user_id` column to link books to users. This is a critical issue that must be fixed before implementation.

### 2. Missing Foreign Key Constraint
There's no foreign key constraint linking `user_books` to `users` table.

## Required Database Changes

### Migration 1: Add user_id to user_books table
```sql
-- Add user_id column
ALTER TABLE user_books 
ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraint
ALTER TABLE user_books 
ADD CONSTRAINT user_books_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL after adding the column
ALTER TABLE user_books 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_user_id_status ON user_books(user_id, status);
```

## Type Definitions

### New Types to Create

#### 1. UserBook Interface
```typescript
// app/types/UserBook.ts
export interface UserBook {
    id: string
    user_id: string
    book_id: string
    rating?: number
    description?: string
    status?: 'to_read' | 'reading' | 'completed' | 'abandoned'
    started_at?: string
    finished_at?: string
    created_at: string
    updated_at: string
}
```

#### 2. UserBookWithDetails Interface
```typescript
// app/types/UserBookWithDetails.ts
import type { UserBook } from "./UserBook"
import type { BookWithDetails } from "./BookWithDetails"

export interface UserBookWithDetails extends UserBook {
    book: BookWithDetails
}
```

#### 3. User Interface
```typescript
// app/types/User.ts
export interface User {
    id: string
    full_name: string
    email: string
    age?: number
    avatar_url?: string
    created_at: string
    updated_at: string
}
```

#### 4. Reading Status Enum
```typescript
// app/types/ReadingStatus.ts
export enum ReadingStatus {
    TO_READ = 'to_read',
    READING = 'reading',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned'
}
```

## API Implementation

### 1. Database Functions
```typescript
// app/api/lib/userBooks.ts
export async function getUserBooks(userId: string): Promise<UserBookWithDetails[]>
export async function addBookToUserList(userId: string, bookId: string, status?: ReadingStatus): Promise<UserBook>
export async function updateUserBook(userBookId: string, updates: Partial<UserBook>): Promise<UserBook>
export async function removeBookFromUserList(userBookId: string): Promise<void>
```

### 2. API Endpoints
```typescript
// app/api/user-books/route.ts - GET /api/user-books
// app/api/user-books/route.ts - POST /api/user-books
// app/api/user-books/[id]/route.ts - PUT /api/user-books/[id]
// app/api/user-books/[id]/route.ts - DELETE /api/user-books/[id]
```

## React Query Hooks

### 1. User Books Query Hook
```typescript
// app/hooks/useUserBooks.ts
export function useUserBooks(userId: string)
export function useAddBookToUserList()
export function useUpdateUserBook()
export function useRemoveBookFromUserList()
```

## Component Structure

### 1. MyList Page
```typescript
// app/(home)/my-list/page.tsx
- Main page component
- Uses useUserBooks hook
- Displays user's book collection
- Includes filtering by status
- Includes search functionality
```

### 2. UserBookCard Component
```typescript
// app/components/cards/UserBookCard.tsx
- Displays book with user-specific data
- Shows reading status
- Shows user rating and notes
- Includes action buttons (update status, remove, etc.)
```

### 3. UserBookListItem Component
```typescript
// app/components/cards/UserBookListItem.tsx
- Accordion-style list item
- Shows book details with user metadata
- Expandable for more details
```

### 4. Reading Status Filter
```typescript
// app/components/filters/ReadingStatusFilter.tsx
- Filter component for reading status
- Dropdown or button group
- Updates query parameters
```

## File Structure
```
app/
├── (home)/
│   └── my-list/
│       └── page.tsx                    # Main MyList page
├── api/
│   ├── user-books/
│   │   ├── route.ts                    # GET, POST endpoints
│   │   └── [id]/
│   │       └── route.ts                # PUT, DELETE endpoints
│   └── lib/
│       └── userBooks.ts                # Database functions
├── components/
│   ├── cards/
│   │   ├── UserBookCard.tsx            # Card view for user books
│   │   └── UserBookListItem.tsx        # List item for user books
│   └── filters/
│       └── ReadingStatusFilter.tsx     # Status filter component
├── hooks/
│   └── useUserBooks.ts                 # React Query hooks
└── types/
    ├── User.ts                         # User interface
    ├── UserBook.ts                     # UserBook interface
    ├── UserBookWithDetails.ts          # UserBook with book details
    └── ReadingStatus.ts                # Reading status enum
```

## Implementation Priority

### Phase 1: Database Setup (Critical)
1. ✅ Create migration to add user_id column to user_books table
2. ✅ Add foreign key constraint
3. ✅ Add necessary indexes

### Phase 2: Type Definitions (High Priority)
1. ✅ Create User interface
2. ✅ Create UserBook interface
3. ✅ Create UserBookWithDetails interface
4. ✅ Create ReadingStatus enum

### Phase 3: API Implementation (High Priority)
1. ✅ Create database functions in app/api/lib/userBooks.ts
2. ✅ Create API endpoints for CRUD operations
3. ✅ Add authentication middleware

### Phase 4: React Query Hooks (High Priority)
1. ✅ Create useUserBooks hook
2. ✅ Create mutation hooks for add/update/remove operations

### Phase 5: UI Components (Medium Priority)
1. ✅ Create UserBookCard component
2. ✅ Create UserBookListItem component
3. ✅ Create ReadingStatusFilter component

### Phase 6: MyList Page (Medium Priority)
1. ✅ Implement main MyList page
2. ✅ Add filtering and search functionality
3. ✅ Add responsive design

### Phase 7: Integration & Testing (Low Priority)
1. ✅ Test all CRUD operations
2. ✅ Test authentication flow
3. ✅ Add error handling and loading states
4. ✅ Add optimistic updates

## Authentication Requirements

### JWT Token Validation
- All user-books endpoints require valid JWT token
- Extract user_id from JWT payload
- Ensure users can only access their own book lists

### Middleware
```typescript
// app/api/middleware/auth.ts
export function validateAuth(req: NextRequest): { userId: string } | null
```

## Security Considerations

### Row Level Security (RLS)
- Enable RLS on user_books table
- Create policy: users can only access their own books
- Create policy: users can only modify their own books

### SQL Injection Prevention
- Use parameterized queries
- Validate all input data
- Sanitize user inputs

## Performance Optimizations

### Database Indexes
- Index on user_books(user_id)
- Composite index on user_books(user_id, status)
- Index on user_books(user_id, created_at) for sorting

### React Query Configuration
- Cache user books for 5 minutes
- Stale time of 2 minutes
- Background refetch on window focus
- Optimistic updates for better UX

## Error Handling

### API Error Responses
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (trying to access other user's books)
- 404: Book not found
- 409: Book already in list
- 500: Internal server error

### Frontend Error States
- Loading skeletons
- Error boundaries
- Retry mechanisms
- User-friendly error messages

## Testing Strategy

### Unit Tests
- Test database functions
- Test API endpoints
- Test React Query hooks
- Test component rendering

### Integration Tests
- Test complete user flow
- Test authentication integration
- Test CRUD operations

### E2E Tests
- Test MyList page functionality
- Test filtering and search
- Test responsive design

## Future Enhancements

### Phase 8: Advanced Features (Future)
1. Book recommendations based on user's list
2. Reading progress tracking
3. Reading goals and statistics
4. Social features (share lists, see friends' lists)
5. Book reviews and ratings
6. Import/export functionality
7. Reading challenges
8. Book clubs integration

## Migration Script

```sql
-- Migration: Add user_id to user_books table
BEGIN;

-- Add user_id column
ALTER TABLE user_books 
ADD COLUMN user_id uuid;

-- Add foreign key constraint
ALTER TABLE user_books 
ADD CONSTRAINT user_books_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_user_id_status ON user_books(user_id, status);

-- Note: user_id will be NOT NULL after data migration
-- This should be done in a separate step after populating existing data

COMMIT;
```

## Conclusion

This implementation plan provides a comprehensive roadmap for building the MyList page functionality. The critical first step is fixing the database schema by adding the missing user_id column to the user_books table. Once that's complete, the implementation can proceed systematically through the defined phases.

The plan emphasizes security, performance, and user experience while maintaining consistency with the existing codebase architecture and patterns.
