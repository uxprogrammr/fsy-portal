import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    console.log('[Debug] Starting counselor-participants GET request');
    console.log('[Debug] Request URL:', request.url);
    
    // Log all cookies for debugging
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('[Debug] All cookies present:', allCookies.map(c => c.name));
    
    const isAuth = await isAuthenticated();
    console.log('[Debug] Authentication check result:', isAuth);
    
    if (!isAuth) {
      console.log('[Debug] Authentication failed - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the counselor's fsy_id from the session
    const session = cookieStore.get('session_token');
    console.log('[Debug] Session cookie present:', !!session);
    if (session) {
      console.log('[Debug] Session cookie name:', session.name);
    }
    
    if (!session) {
      console.log('[Debug] No session cookie found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from JWT token
    const decoded = jwt.verify(session.value, JWT_SECRET) as { id: number };
    console.log('[Debug] JWT decoded:', decoded);

    // First get the counselor's company and group information
    const counselorInfo = await query(
      `SELECT cm.company_id, cm.group_id 
       FROM company_members cm
       WHERE cm.fsy_id = ?`,
      [decoded.id]
    ) as RowDataPacket[];

    console.log('[Debug] Counselor info query result:', counselorInfo);

    if (!counselorInfo || counselorInfo.length === 0) {
      console.log('[Debug] No counselor info found - returning 404');
      return NextResponse.json({ error: 'Counselor not found in company members' }, { status: 404 });
    }

    // Get participants using the stored procedure
    const participants = await query(
      'CALL get_participants(?, ?, ?)',
      [0, counselorInfo[0].company_id, counselorInfo[0].group_id]
    ) as RowDataPacket[][];

    console.log('[Debug] Successfully retrieved participants');
    // The stored procedure returns results in the first element of the array
    return NextResponse.json(participants[0]);
  } catch (error) {
    console.error('[Debug] Error in counselor-participants route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 