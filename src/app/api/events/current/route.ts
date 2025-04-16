import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface DailyEvent extends RowDataPacket {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  company_id: number;
  group_id: number;
}

// In-memory cache for current event
let currentEventCache: DailyEvent | null = null;
let currentEventCacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    // Get event_id from query params if provided
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || 0;
    
    // If eventId is 0 (default) and we have a valid cache, use it
    const now = Date.now();
    if (eventId === '0' && currentEventCache && (now - currentEventCacheTimestamp) < CACHE_TTL) {
      return NextResponse.json(currentEventCache);
    }

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
    
    const currentEvent = events[0];
    
    // Update cache if this is the default event (eventId = 0)
    if (eventId === '0') {
      currentEventCache = currentEvent;
      currentEventCacheTimestamp = now;
    }

    return NextResponse.json(currentEvent);
  } catch (error) {
    console.error('Error fetching current event:', error);
    
    // Return a more graceful error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch current event',
        data: null
      },
      { status: 500 }
    );
  }
} 