import { NextRequest } from 'next/server';
import { ApiResponses } from '@/app/api/lib/response';
import pool from '@/lib/supabase';
import type { Book } from '@/app/types/Book';

export const runtime = 'nodejs';

// POST /api/books/create - Create a new book
export async function POST(req: NextRequest) {
    try {
        const { 
            title, 
            pages, 
            author_id, 
            category_id, 
            publish_date, 
            rating, 
            cover_url, 
            annotation 
        } = await req.json();

        // Validate required fields
        if (!title || !author_id || !category_id) {
            return ApiResponses.badRequest('Missing required fields: title, author_id, and category_id are required');
        }

        // Check if book already exists
        const existingBook = await pool.query(
            'SELECT id FROM books WHERE title = $1 AND author_id = $2',
            [title, author_id]
        );

        if (existingBook.rows.length > 0) {
            return ApiResponses.conflict('A book with this title by this author already exists');
        }

        // Create the book
        const result = await pool.query(`
            INSERT INTO books (
                title, 
                pages, 
                author_id, 
                category_id, 
                publish_date, 
                rating, 
                cover_url, 
                annotation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            title,
            pages || null,
            author_id,
            category_id,
            publish_date || null,
            rating || null,
            cover_url || null,
            annotation || null
        ]);

        const newBook: Book = result.rows[0];

        return ApiResponses.created(newBook, 'Book created successfully');
    } catch (error) {
        console.error('Error creating book:', error);
        return ApiResponses.internalServerError('Failed to create book');
    }
}

