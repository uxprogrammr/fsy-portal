import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the counselor's fsy_id from the session
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = JSON.parse(session.value);

    // First get the counselor's company and group information
    const counselorInfo = await query(
      `SELECT cm.company_id, cm.group_id 
       FROM company_members cm
       WHERE cm.fsy_id = ?`,
      [userData.id]
    ) as RowDataPacket[];

    if (!counselorInfo || counselorInfo.length === 0) {
      return NextResponse.json({ error: 'Counselor not found in company members' }, { status: 404 });
    }

    // Get participants using the stored procedure
    const participants = await query(
      'CALL get_participants(?, ?, ?)',
      [0, counselorInfo[0].company_id, counselorInfo[0].group_id]
    ) as RowDataPacket[][];

    // The stored procedure returns results in the first element of the array
    return NextResponse.json(participants[0]);
  } catch (error) {
    console.error('Error fetching counselor participants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 