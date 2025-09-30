import { api } from "@/lib/http";

export async function registerUser(fullName: string, email: string, password: string) {
    const data = await api.post('/auth/register', {
        fullName,
        email,
        password
    })
    
    // Log the JWT tokens in browser console
    if (data.accessToken) {
        console.log('Access Token:', data.accessToken)
    }
    if (data.refreshToken) {
        console.log('Refresh Token:', data.refreshToken)
    }
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
}

export async function loginUser(email: string, password: string) {
    const data = await api.post('/auth/login', {
        email,
        password
    })
    
    // Log the JWT tokens in browser console
    if (data.accessToken) {
        console.log('Access Token:', data.accessToken)
    }
    if (data.refreshToken) {
        console.log('Refresh Token:', data.refreshToken)
    }
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
}