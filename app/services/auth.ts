import apiClient from "@/lib/http";

export async function registerUser(fullName: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password
    })
    
    // Log the JWT tokens in browser console
    if (response.data.accessToken) {
        console.log('Access Token:', response.data.accessToken)
    }
    if (response.data.refreshToken) {
        console.log('Refresh Token:', response.data.refreshToken)
    }
    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
}

export async function loginUser(email: string, password: string) {
    const response = await apiClient.post('/auth/login', {
        email,
        password
    })
    
    // Log the JWT tokens in browser console
    if (response.data.accessToken) {
        console.log('Access Token:', response.data.accessToken)
    }
    if (response.data.refreshToken) {
        console.log('Refresh Token:', response.data.refreshToken)
    }
    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
}