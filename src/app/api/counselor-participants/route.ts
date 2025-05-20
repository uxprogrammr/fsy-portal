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

    // Get user's company and group information using the stored procedure
    console.log('[Debug] Getting user company and group info for user_id:', decoded.id);
    const userInfo = await query(
      'CALL get_user_company_group(?)',
      [decoded.id]
    ) as RowDataPacket[][];

    console.log('[Debug] User info from stored procedure:', userInfo[0][0]);

    if (!userInfo || !userInfo[0] || userInfo[0].length === 0) {
      console.log('[Debug] User not found - returning 404');
      return NextResponse.json({ 
        error: 'User not found',
        details: { user_id: decoded.id }
      }, { status: 404 });
    }

    const userData = userInfo[0][0];
    
    // Check if user is a counselor
    if (userData.user_type !== 'Counselor') {
      console.log('[Debug] User is not a counselor - returning 403');
      return NextResponse.json({ 
        error: 'User is not a counselor',
        details: { 
          user_id: decoded.id,
          user_type: userData.user_type
        }
      }, { status: 403 });
    }

    // Check if user has company and group assignment
    if (!userData.company_id || !userData.group_id) {
      console.log('[Debug] User has no company/group assignment - returning 404');
      return NextResponse.json({ 
        error: 'Counselor has no company or group assignment',
        details: {
          user_id: decoded.id,
          company_id: userData.company_id,
          group_id: userData.group_id
        }
      }, { status: 404 });
    }

    // Get participants using the stored procedure
    console.log('[Debug] Calling get_participants with:', {
      company_id: userData.company_id,
      group_id: userData.group_id
    });
    
    const participants = await query(
      'CALL get_participants(?, ?, ?)',
      [0, userData.company_id, userData.group_id]
    ) as RowDataPacket[][];

    console.log('[Debug] Successfully retrieved participants');
    // The stored procedure returns results in the first element of the array
    return NextResponse.json(participants[0]);
  } catch (error) {
    console.error('[Debug] Error in counselor-participants route:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 