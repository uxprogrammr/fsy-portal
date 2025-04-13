// src/lib/jwt.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export async function getSessionUser() {
    const token = (await cookies()).get('session_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        return null;
    }
}
