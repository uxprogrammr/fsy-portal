import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface MemberInfo extends RowDataPacket {
  fsy_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
  company_name: string;
  group_name: string;
  room_name: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fsyId = searchParams.get('fsyId');

    if (!fsyId) {
      return NextResponse.json(
        { error: 'FSY ID is required' },
        { status: 400 }
      );
    }

    const result = await query('CALL get_member_info(?)', [fsyId]) as MemberInfo[][];

    // The stored procedure returns an array with the first element being the result set
    const memberInfo = result[0]?.[0];

    if (!memberInfo) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(memberInfo);
  } catch (error) {
    console.error('Error fetching member info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member info' },
      { status: 500 }
    );
  }
} 