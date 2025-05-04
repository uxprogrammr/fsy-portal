import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface EventDetails extends RowDataPacket {
  event_id: number;
  event_name: string;
  day_number: number;
  start_time: string;
  end_time: string;
  description: string | null;
  attendance_required: string;
  venue: string | null;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Query the daily_events table directly since we have the schema
    const sql = `
      SELECT 
        event_id,
        event_name,
        day_number,
        start_time,
        end_time,
        description,
        attendance_required,
        venue,
        created_at
      FROM daily_events
      WHERE event_id = ?
    `;

    const results = await query(sql, [parseInt(eventId)]) as EventDetails[];

    if (!results || results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = results[0];

    return NextResponse.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
} 