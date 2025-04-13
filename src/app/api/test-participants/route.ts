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
    // Test with hardcoded values
    const eventId = 1;
    const companyId = 1;
    const groupId = 1;

    console.log('Testing with hardcoded values:', { eventId, companyId, groupId });

    const result = await query(
      'CALL get_participants(?, ?, ?)',
      [eventId, companyId, groupId]
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
      participants: regularParticipants,
      debug: {
        eventId,
        companyId,
        groupId,
        resultLength: result.length,
        participantsLength: participants.length,
        counselorsLength: counselors.length,
        regularParticipantsLength: regularParticipants.length
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test data', details: error },
      { status: 500 }
    );
  }
} 