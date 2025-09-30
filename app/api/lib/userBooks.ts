import pool from "@/lib/supabase";
import type { UserBookWithDetails } from "@/app/types/UserBookWithDetails";
import type { UserBook } from "@/app/types/UserBook";
import { ReadingStatus } from "@/app/types/ReadingStatus";

export async function getUserBooks(userId: string): Promise<UserBookWithDetails[]> {
    try {
        const result = await pool.query(`
            SELECT 
                ub.id,
                ub.user_id,
                ub.book_id,
                ub.rating,
                ub.description,
                ub.status,
                ub.started_at,
                ub.finished_at,
                ub.created_at,
                ub.updated_at,
                b.id as book_id,
                b.title,
                b.pages,
                b.author_id,
                b.category_id,
                b.publish_date,
                b.rating as book_rating,
                b.cover_url,
                b.annotation,
                b.created_at as book_created_at,
                b.updated_at as book_updated_at,
                a.id as author_id,
                a.full_name as author_name,
                c.id as category_id,
                c.title as category_title
            FROM user_books ub
            JOIN books b ON ub.book_id = b.id
            LEFT JOIN authors a ON b.author_id = a.id
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ub.user_id = $1
            ORDER BY ub.created_at DESC
        `, [userId]);

        return result.rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            book_id: row.book_id,
            rating: row.rating,
            description: row.description,
            status: row.status as ReadingStatus,
            started_at: row.started_at,
            finished_at: row.finished_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            book: {
                id: row.book_id,
                title: row.title,
                pages: row.pages,
                author_id: row.author_id,
                category_id: row.category_id,
                publish_date: row.publish_date,
                rating: row.book_rating,
                cover_url: row.cover_url,
                annotation: row.annotation,
                created_at: row.book_created_at,
                updated_at: row.book_updated_at,
                author: row.author_name ? {
                    id: row.author_id,
                    full_name: row.author_name
                } : undefined,
                category: row.category_title ? {
                    id: row.category_id,
                    title: row.category_title
                } : undefined
            }
        }));
    } catch (error) {
        console.error("getUserBooks error:", error);
        throw new Error("Failed to fetch user books");
    }
}

export async function addBookToUserList(
    userId: string, 
    bookId: string, 
    status?: ReadingStatus
): Promise<UserBook> {
    try {
        const result = await pool.query(`
            INSERT INTO user_books (user_id, book_id, status)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [userId, bookId, status || ReadingStatus.TO_READ]);

        return result.rows[0];
    } catch (error) {
        console.error("addBookToUserList error:", error);
        throw new Error("Failed to add book to user list");
    }
}

export async function updateUserBook(
    userBookId: string, 
    updates: Partial<UserBook>
): Promise<UserBook> {
    try {
        const setClause = [];
        const values = [];
        let paramCount = 1;

        if (updates.rating !== undefined) {
            setClause.push(`rating = $${paramCount++}`);
            values.push(updates.rating);
        }
        if (updates.description !== undefined) {
            setClause.push(`description = $${paramCount++}`);
            values.push(updates.description);
        }
        if (updates.status !== undefined) {
            setClause.push(`status = $${paramCount++}`);
            values.push(updates.status);
        }
        if (updates.started_at !== undefined) {
            setClause.push(`started_at = $${paramCount++}`);
            values.push(updates.started_at);
        }
        if (updates.finished_at !== undefined) {
            setClause.push(`finished_at = $${paramCount++}`);
            values.push(updates.finished_at);
        }

        if (setClause.length === 0) {
            throw new Error("No fields to update");
        }

        setClause.push(`updated_at = now()`);
        values.push(userBookId);

        const result = await pool.query(`
            UPDATE user_books 
            SET ${setClause.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            throw new Error("User book not found");
        }

        return result.rows[0];
    } catch (error) {
        console.error("updateUserBook error:", error);
        throw new Error("Failed to update user book");
    }
}

export async function removeBookFromUserList(userBookId: string): Promise<void> {
    try {
        const result = await pool.query(`
            DELETE FROM user_books 
            WHERE id = $1
        `, [userBookId]);

        if (result.rowCount === 0) {
            throw new Error("User book not found");
        }
    } catch (error) {
        console.error("removeBookFromUserList error:", error);
        throw new Error("Failed to remove book from user list");
    }
}

export async function getUserBookById(userBookId: string): Promise<UserBook | null> {
    try {
        const result = await pool.query(`
            SELECT * FROM user_books 
            WHERE id = $1
        `, [userBookId]);

        return result.rows[0] || null;
    } catch (error) {
        console.error("getUserBookById error:", error);
        throw new Error("Failed to fetch user book");
    }
}
