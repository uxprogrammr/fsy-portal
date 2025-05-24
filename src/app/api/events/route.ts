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
  participant_dress_attire: string | null;
  counselor_dress_attire: string | null;
}

// In-memory cache for events
let eventsCache: DailyEvent[] | null = null;
let eventsCacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (eventsCache && (now - eventsCacheTimestamp) < CACHE_TTL) {
      // Get current time in Philippines timezone for comparison
      const currentTime = getCurrentTimeStringInPH();

      // Process events to add status
      const processedEvents = eventsCache.map((event) => {
        const isPast = event.end_time < currentTime;
        const isOngoing = event.start_time <= currentTime && event.end_time >= currentTime;

        return {
          ...event,
          status: isPast ? 'past' : isOngoing ? 'ongoing' : 'upcoming'
        };
      });

      return NextResponse.json({ 
        success: true, 
        data: processedEvents,
        cached: true
      });
    }

    // Call the stored procedure and get the first result set
    const result = await query(`CALL get_current_events()`);
    
    // Check if result exists and has data
    if (!result || !Array.isArray(result) || !result[0]) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    const events = result[0] as DailyEvent[];
    
    // Update cache
    eventsCache = events;
    eventsCacheTimestamp = now;
    
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
    
    // Return empty data instead of error to prevent cascading failures
    return NextResponse.json({ 
      success: true, 
      data: [] 
    });
  }
} 