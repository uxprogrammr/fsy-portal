import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DailyEvent extends RowDataPacket {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  venue: string | null;
}

export async function GET() {
  try {
    // Call the stored procedure
    const result = await query('CALL next_upcoming_event()') as DailyEvent[][];

    // The stored procedure returns an array where the first element is the result set
    const events = result[0];

    // If no event is found, return 404
    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'No upcoming events found' },
        { status: 404 }
      );
    }

    // Return the next upcoming event (first row of the result set)
    return NextResponse.json(events[0]);

  } catch (error) {
    console.error('Error fetching next upcoming event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next upcoming event' },
      { status: 500 }
    );
  }
} 