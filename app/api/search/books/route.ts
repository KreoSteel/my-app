import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import type { BookWithDetails } from '@/app/types/BookWithDetails';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q') || undefined;
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
        b.rating_count,
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

    if (query) {
      sql += ` AND (
        LOWER(b.title) LIKE LOWER($${i}) OR
        LOWER(a.full_name) LIKE LOWER($${i}) OR
        LOWER(c.title) LIKE LOWER($${i})
      )`;
      params.push(`%${query}%`); i++;
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
      rating_count: r.rating_count,
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