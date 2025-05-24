import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface Participant {
  fsy_id: number;
  name: string;
  stake: string;
  unit: string;
}

export async function GET(request: Request) {
  try {
    // Get the search query and event_id from URL parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('query');
    const eventId = searchParams.get('event_id');

    if (!searchQuery) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get user from session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user is a counselor
    if (user.type !== 'Counselor') {
      return NextResponse.json({ 
        error: 'User is not a counselor' 
      }, { status: 403 });
    }

    // Search for participants
    const participants = await query(
      `SELECT 
        r.fsy_id,
        CONCAT(r.first_name, ' ', r.last_name) as name,
        r.stake_name as stake,
        r.unit_name as unit,
        COALESCE(a.attendance_status, 'Not Set') as attendance_status
      FROM registrations r
      LEFT JOIN attendances a ON r.fsy_id = a.fsy_id 
        AND a.event_id = ?
      WHERE status='Approved' AND 
        (LOWER(r.first_name) LIKE LOWER(?)
        OR LOWER(r.last_name) LIKE LOWER(?)
        OR LOWER(CONCAT(r.first_name, ' ', r.last_name)) LIKE LOWER(?))
      ORDER BY r.first_name, r.last_name
      LIMIT 10`,
      [
        eventId,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`
      ]
    ) as Participant[];

    console.log('Search query:', searchQuery);
    console.log('Raw query result:', participants);
    console.log('Is array?', Array.isArray(participants));
    console.log('Number of results:', participants.length);

    return NextResponse.json({ 
      data: participants 
    });

  } catch (error) {
    console.error('Error searching participants:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 