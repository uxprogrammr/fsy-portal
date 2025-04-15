import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface UserInfoResponse {
  success: boolean;
  data?: {
    fsy_id: number;
    full_name: string;
    company_id: number;
    company_name: string;
    group_id: number;
    group_name: string;
    total_counselor: number;
    total_participant: number;
    stake_name: string;
    unit_name: string;
  };
  error?: string;
}

export async function GET(request: Request) {
  try {
    // Get user ID from the URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Call the stored procedure
    const sql = 'CALL get_user_company_group(?)';
    const results = await query(sql, [parseInt(userId)]) as RowDataPacket[];
    
    // Stored procedure returns array of result sets, first element is our data
    const userInfo = results[0][0] as RowDataPacket;

    return NextResponse.json({
      success: true,
      data: {
        fsy_id: userInfo.fsy_id,
        full_name: userInfo.full_name,
        company_id: userInfo.company_id,
        company_name: userInfo.company_name,
        group_id: userInfo.group_id,
        group_name: userInfo.group_name,
        total_counselor: userInfo.total_counselor,
        total_participant: userInfo.total_participant,
        stake_name: userInfo.stake_name,
        unit_name: userInfo.unit_name
      }
    });

  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 