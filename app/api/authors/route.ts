import { NextRequest } from 'next/server'
import { createAuthor, getAllAuthors } from '@/app/api/lib/author'
import { ApiResponses } from '@/app/api/lib/response'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const author = await createAuthor(body)
        return ApiResponses.created(author, 'Author created successfully')
    } catch (error) {
        console.error('Error creating author:', error)
        return ApiResponses.internalServerError('Failed to create author')
    }
}

export async function GET() {
    try {
        const authors = await getAllAuthors()
        return ApiResponses.ok(authors, 'Authors retrieved successfully')
    } catch (error) {
        console.error('Error getting all authors:', error)
        return ApiResponses.internalServerError('Failed to get all authors')
    }
}