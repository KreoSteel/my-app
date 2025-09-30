import { useState, useEffect } from 'react';
import type { JwtPayload } from '@/app/api/lib/jwt';
import { decodeJWT } from '@/lib/jwt-client';

export function useAuth() {
    const [user, setUser] = useState<JwtPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    }, []);

    return { user, isLoading };
}
