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
        const user = await getSessionUser();
        if (!user || typeof user !== 'object' || user === null || !('id' in user)) {
            return false;
        }
        return { userId: (user as { id: number }).id };
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

export async function getUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        
        if (!session) {
            return null;
        }

        const userData = JSON.parse(session.value) as User;
        return userData;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}
