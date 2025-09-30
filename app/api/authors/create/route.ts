import { NextRequest } from 'next/server';
import { ApiResponses } from '@/app/api/lib/response';
import pool from '@/lib/supabase';
import type { Author } from '@/app/types/Author';

export const runtime = 'nodejs';

// POST /api/authors/create - Create a new author
export async function POST(req: NextRequest) {
    try {
        const { 
            full_name, 
            description, 
            birth_date 
        } = await req.json();

        // Validate required fields
        if (!full_name) {
            return ApiResponses.badRequest('Missing required field: full_name is required');
        }

        // Check if author already exists
        const existingAuthor = await pool.query(
            'SELECT id FROM authors WHERE LOWER(full_name) = LOWER($1)',
            [full_name]
        );

        if (existingAuthor.rows.length > 0) {
            return ApiResponses.conflict('An author with this name already exists');
        }

        // Create the author
        const result = await pool.query(`
            INSERT INTO authors (full_name, description, birth_date)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [
            full_name,
            description || null,
            birth_date || null
        ]);

        const newAuthor: Author = result.rows[0];

        return ApiResponses.created(newAuthor, 'Author created successfully');
    } catch (error) {
        console.error('Error creating author:', error);
        return ApiResponses.internalServerError('Failed to create author');
    }
}

