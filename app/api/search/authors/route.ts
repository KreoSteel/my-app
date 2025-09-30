import { NextRequest } from 'next/server';
import { ApiResponses } from '@/app/api/lib/response';
import pool from '@/lib/supabase';
import type { Author } from '@/app/types/Author';

export const runtime = 'nodejs';

// GET /api/search/authors - Search authors by name
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query || query.trim().length < 2) {
            return ApiResponses.badRequest('Query parameter "q" is required and must be at least 2 characters');
        }

        const result = await pool.query(`
            SELECT 
                id,
                full_name,
                description,
                birth_date,
                created_at,
                updated_at
            FROM authors
            WHERE LOWER(full_name) LIKE LOWER($1)
            ORDER BY full_name ASC
            LIMIT $2
        `, [`%${query}%`, limit]);

        const authors: Author[] = result.rows;

        return ApiResponses.ok(authors, 'Authors found successfully');
    } catch (error) {
        console.error('Error searching authors:', error);
        return ApiResponses.internalServerError('Failed to search authors');
    }
}

