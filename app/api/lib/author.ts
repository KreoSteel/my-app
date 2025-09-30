import pool from "@/lib/supabase";
import type { Author } from "@/app/types/Author";

export async function createAuthor(author: Partial<Author>): Promise<Author> {
    const { full_name, description, birth_date } = author
    if (!full_name || !description || !birth_date) {
        throw new Error("Missing required fields")
    }


    try {
        const newAuthor = await pool.query('INSERT INTO authors (full_name, description, birth_date) VALUES ($1, $2, $3) RETURNING *', [full_name, description, birth_date])
        return newAuthor.rows[0]
    } catch (error: unknown) {
        console.error("Error creating author:", error)
        throw new Error("Failed to create author")
    }
}

export async function getAllAuthors(): Promise<Author[]> {
    try {
        const result = await pool.query('SELECT * FROM authors ORDER BY created_at DESC')
        return result.rows
    } catch (error: unknown) {
        console.error("Error getting all authors:", error)
        throw new Error("Failed to get all authors")
    }
}