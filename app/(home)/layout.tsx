"use client"
import { useEffect, useState } from "react"
import { isTokenValid } from "@/lib/jwt-client"
import { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const [isAuth, setIsAuth] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            if (typeof window === 'undefined') {
                return
            }

            const token = localStorage.getItem('accessToken')

            if (!token) {
                window.location.href = '/auth/login'
                return
            }

            try {
                if (isTokenValid(token)) {
                    setIsAuth(true)
                } else {
                    window.location.href = '/auth/login'
                }
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
        <QueryClientProvider client={queryClient}>
            <AuthGuard>{children}</AuthGuard>
        </QueryClientProvider>
    );
}