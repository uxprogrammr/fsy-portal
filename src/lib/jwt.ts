// src/lib/jwt.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export async function getSessionUser() {
    console.log('[Debug] Getting session token');
    const token = (await cookies()).get('session_token')?.value;
    console.log('[Debug] Session token present:', !!token);

    if (!token) {
        console.log('[Debug] No session token found');
        return null;
    }

    try {
        console.log('[Debug] Verifying JWT token');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[Debug] JWT verification successful');
        return decoded;
    } catch (err) {
        console.error('[Debug] JWT verification failed:', err);
        return null;
    }
}
