import type { JwtPayload } from '@/app/api/lib/jwt';

/**
 * Client-side JWT token decoder
 * This function safely decodes JWT tokens in the browser without requiring server-side environment variables
 */
export function decodeJWT<T extends JwtPayload = JwtPayload>(token: string): T | null {
    try {
        // Split the token into its three parts
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT token format');
        }

        // Decode the payload (second part)
        const payload = parts[1];
        
        // Add padding if needed
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        
        // Decode base64
        const decodedPayload = atob(paddedPayload);
        
        // Parse JSON
        const parsedPayload = JSON.parse(decodedPayload) as T;
        
        // Check if token is expired
        if (parsedPayload.exp && parsedPayload.exp < Math.floor(Date.now() / 1000)) {
            console.warn('JWT token has expired');
            return null;
        }
        
        return parsedPayload;
    } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
}

/**
 * Check if a JWT token is valid (not expired and properly formatted)
 */
export function isTokenValid(token: string): boolean {
    const payload = decodeJWT(token);
    return payload !== null;
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
    const payload = decodeJWT(token);
    if (payload && payload.exp) {
        return new Date(payload.exp * 1000);
    }
    return null;
}
