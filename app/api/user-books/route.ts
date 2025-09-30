import { NextRequest } from 'next/server';
import { ApiResponses } from '@/app/api/lib/response';
import { getUserBooks, addBookToUserList } from '@/app/api/lib/userBooks';
import { decode } from '@/app/api/lib/jwt';
import type { ReadingStatus } from '@/app/types/ReadingStatus';

export const runtime = 'nodejs';

// GET /api/user-books - Get user's book list
export async function GET(req: NextRequest) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponses.unauthorized('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);
        
        // Decode and verify token
        const payload = await decode(token);
        const userId = payload.sub.toString();

        // Get user's books
        const userBooks = await getUserBooks(userId);
        
        return ApiResponses.ok(userBooks, 'User books retrieved successfully');
    } catch (error) {
        console.error('Error getting user books:', error);
        if (error instanceof Error && error.message.includes('JWT')) {
            return ApiResponses.unauthorized('Invalid token');
        }
        return ApiResponses.internalServerError('Failed to get user books');
    }
}

// POST /api/user-books - Add book to user's list
export async function POST(req: NextRequest) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponses.unauthorized('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);
        
        // Decode and verify token
        const payload = await decode(token);
        const userId = payload.sub.toString();

        // Parse request body
        const { bookId, status } = await req.json();
        
        if (!bookId) {
            return ApiResponses.badRequest('Missing required field: bookId');
        }

        // Add book to user's list
        const userBook = await addBookToUserList(userId, bookId, status as ReadingStatus);
        
        return ApiResponses.created(userBook, 'Book added to user list successfully');
    } catch (error) {
        console.error('Error adding book to user list:', error);
        if (error instanceof Error && error.message.includes('JWT')) {
            return ApiResponses.unauthorized('Invalid token');
        }
        if (error instanceof Error && error.message.includes('duplicate')) {
            return ApiResponses.conflict('Book already in user list');
        }
        return ApiResponses.internalServerError('Failed to add book to user list');
    }
}
