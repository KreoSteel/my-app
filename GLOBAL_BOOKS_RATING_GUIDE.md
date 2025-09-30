### Average Ratings for Global Books List (Using Your Existing Tables)

**Goal:** Show the **average rating from ALL users** in your global books list, not individual ratings.

**What you already have:**
- `books` table with `rating` column (currently stores individual ratings)
- `user_books` table with `rating` column (stores each user's rating for books they've read)

**What we'll do:**
- Add a `rating_count` column to track how many users rated each book
- Create a function to calculate **crowd average** from all `user_books` ratings for each book
- Update `books.rating` to show the **global average** (from all users) instead of individual ratings
- Add a trigger to keep global averages updated automatically

**Result:** Your global books list will show the average rating that all users gave to each book.

---

### 1) Add rating count column

Add a column to track how many users have rated each book.

```sql
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0 NOT NULL;
```

---

### 2) Create function to calculate GLOBAL average rating

This function calculates the **average rating from ALL users** who rated a specific book and updates the global `books` table.

```sql
CREATE OR REPLACE FUNCTION public.calculate_book_average_rating(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg numeric(10,2);
  v_count integer;
BEGIN
  -- Calculate GLOBAL average and count from ALL user_books ratings for this book
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0), 
    COUNT(*)
  INTO v_avg, v_count
  FROM public.user_books
  WHERE book_id = p_book_id AND rating IS NOT NULL;

  -- Update the GLOBAL books table with the crowd average and count
  UPDATE public.books
  SET rating = v_avg,           -- This becomes the global average
      rating_count = v_count,   -- How many users rated this book
      updated_at = now()
  WHERE id = p_book_id;
END;
$$;
```

---

### 3) Create trigger to auto-update GLOBAL averages

Whenever someone adds, updates, or removes a rating in `user_books`, automatically recalculate the **global average** for that book in the `books` table.

```sql
CREATE OR REPLACE FUNCTION public.user_books_rating_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT: recalculate global average for the book that was rated
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.calculate_book_average_rating(NEW.book_id);
  END IF;
  
  -- Handle UPDATE: recalculate global averages for both old and new book if book_id changed
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.book_id <> OLD.book_id THEN
      PERFORM public.calculate_book_average_rating(OLD.book_id);
      PERFORM public.calculate_book_average_rating(NEW.book_id);
    ELSE
      PERFORM public.calculate_book_average_rating(NEW.book_id);
    END IF;
  END IF;
  
  -- Handle DELETE: recalculate global average for the book that lost a rating
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.calculate_book_average_rating(OLD.book_id);
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_user_books_rating_update ON public.user_books;

CREATE TRIGGER trg_user_books_rating_update
AFTER INSERT OR UPDATE OR DELETE ON public.user_books
FOR EACH ROW EXECUTE FUNCTION public.user_books_rating_trigger();
```

---

### 4) Backfill existing data

Calculate **global averages** for all books that already have user ratings.

```sql
-- Update all books with their current GLOBAL average ratings
DO $$
DECLARE
  book_record RECORD;
BEGIN
  FOR book_record IN SELECT id FROM public.books LOOP
    PERFORM public.calculate_book_average_rating(book_record.id);
  END LOOP;
END $$;
```

---

### 5) Test the setup

Check that **global averages** are calculated correctly:

```sql
-- See current GLOBAL averages and counts
SELECT 
  b.title,
  b.rating as global_average_rating,  -- This is the crowd average
  b.rating_count,                     -- How many users rated this book
  ub.user_id,
  ub.rating as individual_user_rating
FROM books b
LEFT JOIN user_books ub ON b.id = ub.book_id
WHERE b.rating_count > 0
ORDER BY b.title;
```

---

### 6) How to add a user rating (for your API)

When a user rates a book, insert/update in `user_books`:

```sql
-- Insert or update user's rating for a book
INSERT INTO public.user_books (book_id, user_id, rating, status)
VALUES ($1, $2, $3, 'read')
ON CONFLICT (book_id, user_id)
DO UPDATE SET 
  rating = EXCLUDED.rating,
  updated_at = now();
```

The trigger will automatically update the **global average** in the `books` table!

---

### 7) Your existing API already works!

Your current queries in `app/api/books/route.ts` and `app/api/search/books/route.ts` already select `b.rating` from the books table. Now this will show the **global crowd average** instead of individual ratings.

---

### Notes

- `books.rating` now shows the **global average** of all user ratings
- `books.rating_count` shows how many users rated the book
- Only non-null ratings in `user_books` are counted
- The trigger keeps global averages in sync automatically
- Your existing filtering by `minRating` will work with global crowd averages
- Each user can only rate each book once (enforced by your existing constraints)


