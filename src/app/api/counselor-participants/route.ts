import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    console.log('[Debug] Starting counselor-participants GET request');
    
    const isAuth = await isAuthenticated();
    console.log('[Debug] Authentication check result:', isAuth);
    
    if (!isAuth) {
      console.log('[Debug] Authentication failed - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the counselor's fsy_id from the session
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    console.log('[Debug] Session cookie present:', !!session);
    
    if (!session) {
      console.log('[Debug] No session cookie found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = JSON.parse(session.value);
    console.log('[Debug] User data from session:', { id: userData.id, type: userData.type });

    // First get the counselor's company and group information
    const counselorInfo = await query(
      `SELECT cm.company_id, cm.group_id 
       FROM company_members cm
       WHERE cm.fsy_id = ?`,
      [userData.id]
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