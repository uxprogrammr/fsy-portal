import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface AttendanceUpdate {
  fsy_id: number;
  attendance_status: string;
}

interface SubmitAttendanceRequest {
  event_id: number;
  company_id: number;
  group_id: number;
  user_id: number;
  participants: AttendanceUpdate[];
  counselors: AttendanceUpdate[];
}

export async function POST(request: Request) {
  try {
    const body: SubmitAttendanceRequest = await request.json();
    const { event_id, company_id, group_id, user_id, participants, counselors } = body;

    if (!event_id || !company_id || !group_id || !user_id) {
      return NextResponse.json(
        { error: 'Event ID, Company ID, Group ID, and User ID are required' },
        { status: 400 }
      );
    }

    console.log('Submitting attendance for:', {
      event_id,
      company_id,
      group_id,
      user_id,
      participantsCount: participants.length,
      counselorsCount: counselors.length
    });

    // Call the stored procedure to update attendance
    await query(
      'CALL update_attendance(?, ?, ?, ?, ?, ?)',
      [
        event_id,
        company_id,
        group_id,
        user_id,
        JSON.stringify(participants),
        JSON.stringify(counselors)
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to submit attendance' },
      { status: 500 }
    );
  }
} 