import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCurrentTimeStringInPH } from '@/utils/dateTimeUtils';

interface DailyEvent extends RowDataPacket {
  event_id: number;
  event_name: string;
  day_number: number;
  start_time: string;
  end_time: string;
  description: string | null;
  attendance_required: string;
  created_at: string;
}

export async function GET() {
  try {
    // Call the stored procedure and get the first result set
    const result = await query(`CALL get_current_events()`);
    const events = Array.isArray(result) && result[0] ? (result[0] as DailyEvent[]) : [];
    
    // Get current time in Philippines timezone for comparison
    const currentTime = getCurrentTimeStringInPH();

    // Process events to add status
    const processedEvents = events.map((event) => {
      const isPast = event.end_time < currentTime;
      const isOngoing = event.start_time <= currentTime && event.end_time >= currentTime;

      return {
        ...event,
        status: isPast ? 'past' : isOngoing ? 'ongoing' : 'upcoming'
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: processedEvents 
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 