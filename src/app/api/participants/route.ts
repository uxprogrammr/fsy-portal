import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Participant extends RowDataPacket {
  fsy_id: number;
  attendance_status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
  status: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const companyId = searchParams.get('company_id');
    const groupId = searchParams.get('group_id');

    if (!eventId || !companyId || !groupId) {
      return NextResponse.json(
        { error: 'Event ID, Company ID, and Group ID are required' },
        { status: 400 }
      );
    }

    console.log('Fetching participants with params:', { eventId, companyId, groupId });

    const result = await query(
      'CALL get_participants(?, ?, ?)',
      [parseInt(eventId), parseInt(companyId), parseInt(groupId)]
    ) as Participant[][];

    console.log('Raw result from stored procedure:', result);
    console.log('Result length:', result.length);
    console.log('First result set:', result[0]);

    const participants = result[0];
    console.log('Participants found:', participants.length);
    console.log('Sample participant data:', participants[0]);

    const counselors = participants.filter(p => p.participant_type === 'Counselor');
    const regularParticipants = participants.filter(p => p.participant_type === 'Participant');

    console.log('Filtered counselors:', counselors.length);
    console.log('Filtered participants:', regularParticipants.length);

    return NextResponse.json({
      counselors,
      participants: regularParticipants
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
} 