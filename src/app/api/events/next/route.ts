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

// In-memory cache for next event
let nextEventCache: DailyEvent | null = null;
let nextEventCacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (nextEventCache && (now - nextEventCacheTimestamp) < CACHE_TTL) {
      return NextResponse.json(nextEventCache);
    }

    // Call the stored procedure
    const result = await query('CALL next_upcoming_event()') as DailyEvent[][];

    // The stored procedure returns an array where the first element is the result set
    const events = result[0];

    // If no event is found, return empty data instead of 404
    if (!events || events.length === 0) {
      return NextResponse.json({ 
        success: true,
        data: null,
        message: 'No upcoming events found'
      });
    }

    // Update cache
    nextEventCache = events[0];
    nextEventCacheTimestamp = now;

    // Return the next upcoming event (first row of the result set)
    return NextResponse.json(events[0]);

  } catch (error) {
    console.error('Error fetching next upcoming event:', error);
    
    // Return a more graceful error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch next upcoming event',
        data: null
      },
      { status: 500 }
    );
  }
} 