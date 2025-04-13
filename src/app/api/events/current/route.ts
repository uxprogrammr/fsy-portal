import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface DailyEvent extends RowDataPacket {
  event_id: number;
  name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  company_id: number;
  group_id: number;
}

export async function GET(request: Request) {
  try {
    // Get event_id from query params if provided
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || 0;

    const result = await query('CALL get_current_event(?)', [eventId]) as DailyEvent[][];

    // The stored procedure returns an array with two elements:
    // First element is the result set, second is the affected rows
    const events = result[0];
    
    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'No current event found' },
        { status: 404 }
      );
    }

    return NextResponse.json(events[0]);
  } catch (error) {
    console.error('Error fetching current event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current event' },
      { status: 500 }
    );
  }
} 