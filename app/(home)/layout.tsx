"use client"
import { useEffect, useState } from "react"
import { verifyToken } from "../api/lib/jwt"
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const [isAuth, setIsAuth] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            // Check if we're on the client side
            if (typeof window === 'undefined') {
                return
            }

            const token = localStorage.getItem('accessToken')
            
            if (!token) {
                window.location.href = '/auth/login'
                return
            }

            try {
                await verifyToken(token)
                setIsAuth(true)
            } catch (error) {
                window.location.href = '/auth/login'
            } finally {
                setIsLoading(false)
            }
        }
        
        checkAuth()
    }, [])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return isAuth ? children : <div>Loading...</div>
}

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthGuard>{children}</AuthGuard>
    );
}