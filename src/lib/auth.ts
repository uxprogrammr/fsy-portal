// src/lib/auth.ts
import { cookies } from 'next/headers';

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token'); // or any token/cookie you use
    return !!token;
}
