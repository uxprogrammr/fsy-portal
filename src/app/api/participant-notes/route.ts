import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CreateNoteRequest } from '@/types/participant-notes';
import { isAuthenticated } from '@/lib/auth';
import { cookies } from 'next/headers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  fsy_id: number;
}

interface CompanyGroupRow extends RowDataPacket {
  company_id: number;
  group_id: number;
}

interface ParticipantRow extends RowDataPacket {
  company_name: string;
  group_name: string;
}

interface NoteRow extends RowDataPacket {
  note_id: number;
  participant_fsy_id: number;
  note_type: string;
  category: string;
  message: string;
  severity: string;
  photo_url: string | null;
  created_at: Date;
  counselor_name: string;
}

interface Session {
  userId: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Get the user's fsy_id from the session
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typedSession = session as Session;

    // Get the user's fsy_id from the users table
    const userRows = await query(
      'SELECT fsy_id FROM users WHERE user_id = ?',
      [typedSession.userId]
    ) as UserRow[];

    const userResult = userRows[0];
    if (!userResult || !userResult.fsy_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the user's company and group from get_user_company_group stored procedure
    const companyGroupRows = await query(
      'CALL get_user_company_group(?)',
      [typedSession.userId]
    ) as any[];

    // The result of a CALL is an array of arrays; the first array contains the result set
    const companyGroupResult = companyGroupRows[0][0];
    if (!companyGroupResult) {
      return NextResponse.json({ error: 'User not assigned to a company/group' }, { status: 404 });
    }

    // Get the participant's company and group
    const participantRows = await query(
      'SELECT company_name, group_name FROM registrations WHERE fsy_id = ?',
      [participantId]
    ) as ParticipantRow[];

    const participantResult = participantRows[0];
    if (!participantResult) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Compare company and group names directly
    console.log('Comparing company/group:', {
      participant_company: participantResult.company_name,
      participant_group: participantResult.group_name,
      counselor_company: companyGroupResult.company_name,
      counselor_group: companyGroupResult.group_name
    });
    if (
      participantResult.company_name !== companyGroupResult.company_name ||
      participantResult.group_name !== companyGroupResult.group_name
    ) {
      return NextResponse.json({ error: 'Unauthorized to view notes for this participant' }, { status: 403 });
    }

    // Get the notes
    const notes = await query(
      `SELECT 
        pn.note_id,
        pn.participant_fsy_id,
        pn.note_type,
        pn.category,
        pn.message,
        pn.severity,
        pn.photo_url,
        pn.created_at,
        u.full_name as counselor_name
      FROM participant_notes pn
      JOIN users u ON pn.counselor_fsy_id = u.fsy_id
      WHERE pn.participant_fsy_id = ?
      ORDER BY pn.created_at DESC`,
      [participantId]
    ) as NoteRow[];

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typedSession = session as Session;

    const body = await request.json();
    const { participant_fsy_id, note_type, category, message, severity, photo_url } = body;

    if (!participant_fsy_id || !note_type || !category || !message || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the user's fsy_id from the users table
    const userRows = await query(
      'SELECT fsy_id FROM users WHERE user_id = ?',
      [typedSession.userId]
    ) as UserRow[];

    const userResult = userRows[0];
    if (!userResult || !userResult.fsy_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the user's company and group from get_user_company_group stored procedure
    const companyGroupRows = await query(
      'CALL get_user_company_group(?)',
      [typedSession.userId]
    ) as any[];

    // The result of a CALL is an array of arrays; the first array contains the result set
    const companyGroupResult = companyGroupRows[0][0];
    if (!companyGroupResult) {
      return NextResponse.json({ error: 'User not assigned to a company/group' }, { status: 404 });
    }

    // Get the participant's company and group
    const participantRows = await query(
      'SELECT company_name, group_name FROM registrations WHERE fsy_id = ?',
      [participant_fsy_id]
    ) as ParticipantRow[];

    const participantResult = participantRows[0];
    if (!participantResult) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Compare company and group names directly
    console.log('Comparing company/group:', {
      participant_company: participantResult.company_name,
      participant_group: participantResult.group_name,
      counselor_company: companyGroupResult.company_name,
      counselor_group: companyGroupResult.group_name
    });
    if (
      participantResult.company_name !== companyGroupResult.company_name ||
      participantResult.group_name !== companyGroupResult.group_name
    ) {
      return NextResponse.json({ error: 'Unauthorized to add notes for this participant' }, { status: 403 });
    }

    // Insert the note
    const result = await query(
      `INSERT INTO participant_notes (
        participant_fsy_id,
        counselor_fsy_id,
        note_type,
        category,
        message,
        severity,
        photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [participant_fsy_id, userResult.fsy_id, note_type, category, message, severity, photo_url]
    ) as ResultSetHeader;

    return NextResponse.json({ 
      success: true, 
      note_id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typedSession = session as Session;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get the user's fsy_id from the users table
    const userRows = await query(
      'SELECT fsy_id FROM users WHERE user_id = ?',
      [typedSession.userId]
    ) as UserRow[];

    const userResult = userRows[0];
    if (!userResult || !userResult.fsy_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the note to check permissions
    const noteRows = await query(
      `SELECT pn.*, r.company_name, r.group_name 
       FROM participant_notes pn
       JOIN registrations r ON pn.participant_fsy_id = r.fsy_id
       WHERE pn.note_id = ?`,
      [noteId]
    ) as any[];

    const note = noteRows[0];
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Get the user's company and group
    const companyGroupRows = await query(
      'CALL get_user_company_group(?)',
      [typedSession.userId]
    ) as any[];

    const companyGroupResult = companyGroupRows[0][0];
    if (!companyGroupResult) {
      return NextResponse.json({ error: 'User not assigned to a company/group' }, { status: 404 });
    }

    // Check if the user has permission to delete the note
    if (
      note.company_name !== companyGroupResult.company_name ||
      note.group_name !== companyGroupResult.group_name
    ) {
      return NextResponse.json({ error: 'Unauthorized to delete this note' }, { status: 403 });
    }

    // Delete the note
    await query(
      'DELETE FROM participant_notes WHERE note_id = ?',
      [noteId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typedSession = session as Session;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { note_type, category, message, severity, photo_url } = body;

    if (!note_type || !category || !message || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the user's fsy_id from the users table
    const userRows = await query(
      'SELECT fsy_id FROM users WHERE user_id = ?',
      [typedSession.userId]
    ) as UserRow[];

    const userResult = userRows[0];
    if (!userResult || !userResult.fsy_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the note to check permissions
    const noteRows = await query(
      `SELECT pn.*, r.company_name, r.group_name 
       FROM participant_notes pn
       JOIN registrations r ON pn.participant_fsy_id = r.fsy_id
       WHERE pn.note_id = ?`,
      [noteId]
    ) as any[];

    const note = noteRows[0];
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Get the user's company and group
    const companyGroupRows = await query(
      'CALL get_user_company_group(?)',
      [typedSession.userId]
    ) as any[];

    const companyGroupResult = companyGroupRows[0][0];
    if (!companyGroupResult) {
      return NextResponse.json({ error: 'User not assigned to a company/group' }, { status: 404 });
    }

    // Check if the user has permission to edit the note
    if (
      note.company_name !== companyGroupResult.company_name ||
      note.group_name !== companyGroupResult.group_name
    ) {
      return NextResponse.json({ error: 'Unauthorized to edit this note' }, { status: 403 });
    }

    // Update the note
    await query(
      `UPDATE participant_notes 
       SET note_type = ?, 
           category = ?, 
           message = ?, 
           severity = ?, 
           photo_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE note_id = ?`,
      [note_type, category, message, severity, photo_url, noteId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 