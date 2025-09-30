// Frontend API response handler for standardized API responses

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
 * Handles API responses and extracts data or throws appropriate errors
 * @param response - The axios response object
 * @returns The data from the response
 * @throws Error with appropriate message for error responses
 */
export function handleApiResponse<T = any>(response: { data: ApiResponse<T> }): T {
  const { data, error, message, status } = response.data

  // If there's an error, throw it with the message
  if (error) {
    const errorMessage = message || error
    const apiError = new Error(errorMessage)
    ;(apiError as any).status = status
    ;(apiError as any).apiError = error
    ;(apiError as any).apiMessage = message
    throw apiError
  }

  // Return the data (may be undefined for some endpoints)
  return data as T
}

/**
 * Handles API responses for cases where you want to return the full response
 * @param response - The axios response object
 * @returns The full API response
 */
export function handleFullApiResponse<T = any>(response: { data: ApiResponse<T> }): ApiResponse<T> {
  return response.data
}

/**
 * Checks if a response is successful
 * @param response - The API response
 * @returns True if the response is successful
 */
export function isApiSuccess<T = any>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return !response.error && response.status >= 200 && response.status < 300
}

/**
 * Checks if a response is an error
 * @param response - The API response
 * @returns True if the response is an error
 */
export function isApiError<T = any>(response: ApiResponse<T>): response is ApiErrorResponse {
  return !!response.error || response.status >= 400
}

/**
 * Extracts error message from API response
 * @param response - The API response
 * @returns The error message
 */
export function getApiErrorMessage(response: ApiResponse): string {
  return response.message || response.error || 'An unknown error occurred'
}
