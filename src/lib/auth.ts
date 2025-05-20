// src/lib/auth.ts
import { cookies } from 'next/headers';
import { getSessionUser } from './jwt';

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  birthDate: string;
}

interface Session {
  userId: number;
}

export async function isAuthenticated(): Promise<Session | boolean> {
    try {
        console.log('[Debug] Starting authentication check');
        const user = await getSessionUser();
        console.log('[Debug] Session user result:', user ? 'User found' : 'No user found');
        
        if (!user || typeof user !== 'object' || user === null || !('id' in user)) {
            console.log('[Debug] Invalid user data structure');
            return false;
        }
        console.log('[Debug] Authentication successful');
        return { userId: (user as { id: number }).id };
    } catch (error) {
        console.error('[Debug] Error in authentication check:', error);
        return false;
    }
}

export async function getUser(): Promise<User | null> {
    try {
        console.log('[Debug] Getting user from session');
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        
        console.log('[Debug] Session cookie present:', !!session);
        
        if (!session) {
            console.log('[Debug] No session cookie found');
            return null;
        }

        const userData = JSON.parse(session.value) as User;
        console.log('[Debug] User data retrieved:', { id: userData.id, type: userData.type });
        return userData;
    } catch (error) {
        console.error('[Debug] Error getting user:', error);
        return null;
    }
}
