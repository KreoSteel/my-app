import pool from "@/lib/supabase";
import type { Book } from "@/app/types/Book";
import type { BookWithDetails } from "@/app/types/BookWithDetails";

export async function getAllBooks(): Promise<Book[]> {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY created_at DESC')
        return result.rows
    } catch (error: unknown) {
        console.error("Error getting all books:", error)
        throw new Error("Failed to get all books")
    }
}

export async function getAllBooksWithDetails(): Promise<BookWithDetails[]> {
    try {
        const result = await pool.query(`
            SELECT 
                b.*,
                a.id as author_id,
                a.full_name as author_name,
                c.id as category_id,
                c.title as category_name
            FROM books b
            LEFT JOIN authors a ON b.author_id = a.id
            LEFT JOIN categories c ON b.category_id = c.id
            ORDER BY b.created_at DESC
        `)
        
        return result.rows.map(row => ({
            ...row,
            author: row.author_id ? {
                id: row.author_id,
                full_name: row.author_name
            } : undefined,
            category: row.category_id ? {
                id: row.category_id,
                title: row.category_name
            } : undefined
        }))
    } catch (error: unknown) {
        console.error("Error getting all books with details:", error)
        throw new Error("Failed to get all books with details")
    }
}
