import axios, { AxiosResponse } from "axios";
import { handleApiResponse, handleFullApiResponse, type ApiResponse } from "./api-response";

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add response interceptor to handle standardized API responses
apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        // Return the response as-is for manual handling when needed
        return response
    },
    (error) => {
        // Handle axios errors (network, timeout, etc.)
        if (error.response) {
            // Server responded with error status
            const apiResponse = error.response.data as ApiResponse
            if (apiResponse.error) {
                // Use our standardized error format
                const apiError = new Error(apiResponse.message || apiResponse.error)
                ;(apiError as any).status = apiResponse.status
                ;(apiError as any).apiError = apiResponse.error
                ;(apiError as any).apiMessage = apiResponse.message
                return Promise.reject(apiError)
            }
        }
        
        // For other errors (network, timeout, etc.)
        return Promise.reject(error)
    }
)

apiClient.interceptors.request.use((config) =>{
    const token = localStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


// Helper methods for common operations
export const api = {
    // GET request that returns data directly
    get: async <T = any>(url: string): Promise<T> => {
        const response = await apiClient.get<ApiResponse<T>>(url)
        return handleApiResponse(response)
    },
    
    // POST request that returns data directly
    post: async <T = any>(url: string, data?: any): Promise<T> => {
        const response = await apiClient.post<ApiResponse<T>>(url, data)
        return handleApiResponse(response)
    },
    
    // PUT request that returns data directly
    put: async <T = any>(url: string, data?: any): Promise<T> => {
        const response = await apiClient.put<ApiResponse<T>>(url, data)
        return handleApiResponse(response)
    },
    
    // DELETE request that returns data directly
    delete: async <T = any>(url: string): Promise<T> => {
        const response = await apiClient.delete<ApiResponse<T>>(url)
        return handleApiResponse(response)
    },
    
    // GET request that returns full response
    getFull: async <T = any>(url: string): Promise<ApiResponse<T>> => {
        const response = await apiClient.get<ApiResponse<T>>(url)
        return handleFullApiResponse(response)
    },
    
    // POST request that returns full response
    postFull: async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
        const response = await apiClient.post<ApiResponse<T>>(url, data)
        return handleFullApiResponse(response)
    },
    
    // PUT request that returns full response
    putFull: async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
        const response = await apiClient.put<ApiResponse<T>>(url, data)
        return handleFullApiResponse(response)
    },
    
    // DELETE request that returns full response
    deleteFull: async <T = any>(url: string): Promise<ApiResponse<T>> => {
        const response = await apiClient.delete<ApiResponse<T>>(url)
        return handleFullApiResponse(response)
    }
}

export default apiClient