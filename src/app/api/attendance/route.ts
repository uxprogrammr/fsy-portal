import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    // Get user from session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user is a counselor
    if (user.type !== 'Counselor') {
      return NextResponse.json({ 
        error: 'User is not a counselor' 
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { event_id, fsy_id, attendance_status } = body;

    if (!event_id || !fsy_id || !attendance_status) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if event exists
    const [eventCheck] = await query(
      'SELECT * FROM daily_events WHERE event_id = ?',
      [event_id]
    ) as RowDataPacket[];

    if (!eventCheck || eventCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if participant exists
    const [participantCheck] = await query(
      'SELECT * FROM registrations WHERE fsy_id = ? AND status = "Approved"',
      [fsy_id]
    ) as RowDataPacket[];

    if (!participantCheck || participantCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Participant not found' 
      }, { status: 404 });
    }

    // Check if attendance record already exists
    const [existingAttendance] = await query(
      'SELECT * FROM attendances WHERE event_id = ? AND fsy_id = ?',
      [event_id, fsy_id]
    ) as RowDataPacket[];

    if (existingAttendance) {
      // Update existing attendance record
      await query(
        'UPDATE attendances SET attendance_status = ?, user_id = ?, timestamp = CURRENT_TIMESTAMP WHERE event_id = ? AND fsy_id = ?',
        [attendance_status, user.id, event_id, fsy_id]
      );
    } else {
      // Create new attendance record
      await query(
        'INSERT INTO attendances (event_id, fsy_id, attendance_status, user_id) VALUES (?, ?, ?, ?)',
        [event_id, fsy_id, attendance_status, user.id]
      );
    }

    return NextResponse.json({ 
      message: 'Attendance recorded successfully' 
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 