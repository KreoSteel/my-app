import { useState, useEffect } from 'react';
import type { JwtPayload } from '@/app/api/lib/jwt';
import { decodeJWT } from '@/lib/jwt-client';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const [user, setUser] = useState<JwtPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter()

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        router.push('/auth/login');
    };

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    const payload = decodeJWT<JwtPayload>(token);
                    setUser(payload);
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        getCurrentUser();
        return;
    }, []);

    return { user, isLoading, logout };
}
