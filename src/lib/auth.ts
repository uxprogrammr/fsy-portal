// src/lib/auth.ts
import { cookies } from 'next/headers';
import { getSessionUser } from './jwt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

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
        const session = cookieStore.get('session_token');
        
        console.log('[Debug] Session cookie present:', !!session);
        
        if (!session) {
            console.log('[Debug] No session cookie found');
            return null;
        }

        // Get user data from JWT token
        const decoded = jwt.verify(session.value, JWT_SECRET) as { id: number };
        console.log('[Debug] JWT decoded:', decoded);
        
        // Fetch user data from database
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        const results = await query(sql, [decoded.id]) as RowDataPacket[];
        
        if (!results || results.length === 0) {
            console.log('[Debug] No user found in database');
            return null;
        }

        const userData = results[0];
        console.log('[Debug] User data retrieved:', { id: userData.user_id, type: userData.user_type });
        
        return {
            id: userData.user_id,
            name: userData.full_name,
            type: userData.user_type,
            email: userData.email,
            phone_number: userData.phone_number,
            birthDate: userData.birth_date
        };
    } catch (error) {
        console.error('[Debug] Error getting user:', error);
        return null;
    }
}
