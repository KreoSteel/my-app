import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
    status: number
  data?: T
  error?: string
  message?: string
}

export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface ApiErrorResponse extends ApiResponse {
  error: string
  message?: string
  status: number
}

/**
 * Creates a standardized API response for successful requests
 * @param data - The data to return
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    data,
    status,
    ...(message && { message })
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Creates a standardized API response for error requests
 * @param error - The error message
 * @param message - Optional additional message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with standardized format
 */
export function createErrorResponse(
  error: string,
  message?: string,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    status,
    ...(message && { message })
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Creates a standardized API response with custom properties
 * @param response - The response object with data, error, message, and status
 * @returns NextResponse with standardized format
 */
export function createApiResponse<T = any>(
  response: ApiResponse<T>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(response, { status: response.status })
}

// Common response helpers
export const ApiResponses = {
  // Success responses
  ok: <T>(data: T, message?: string) => createSuccessResponse(data, message, 200),
  created: <T>(data: T, message?: string) => createSuccessResponse(data, message, 201),
  // Note: 204 responses MUST NOT include a response body
  noContent: () => new NextResponse(null, { status: 204 }),
  
  // Client error responses
  badRequest: (error: string, message?: string) => createErrorResponse(error, message, 400),
  unauthorized: (error: string = 'Unauthorized', message?: string) => createErrorResponse(error, message, 401),
  forbidden: (error: string = 'Forbidden', message?: string) => createErrorResponse(error, message, 403),
  notFound: (error: string = 'Not Found', message?: string) => createErrorResponse(error, message, 404),
  conflict: (error: string, message?: string) => createErrorResponse(error, message, 409),
  unprocessableEntity: (error: string, message?: string) => createErrorResponse(error, message, 422),
  
  // Server error responses
  internalServerError: (error: string = 'Internal Server Error', message?: string) => createErrorResponse(error, message, 500),
  serviceUnavailable: (error: string = 'Service Unavailable', message?: string) => createErrorResponse(error, message, 503),
}
