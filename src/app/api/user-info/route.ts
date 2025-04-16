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
    venue: string | null;
  };
  error?: string;
}

// In-memory cache for user info
const userInfoCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Check if we have a valid cache for this user
    const now = Date.now();
    if (userInfoCache[userId] && (now - userInfoCache[userId].timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: userInfoCache[userId].data,
        cached: true
      });
    }

    // Call the stored procedure with proper error handling
    const sql = 'CALL get_user_company_group(?)';
    const results = await query(sql, [parseInt(userId)]) as RowDataPacket[];
    
    // Check if results exist and have data
    if (!results || !results[0] || !results[0][0]) {
      return NextResponse.json(
        { success: false, error: 'User information not found' },
        { status: 404 }
      );
    }
    
    // Stored procedure returns array of result sets, first element is our data
    const userInfo = results[0][0] as RowDataPacket;
    
    const userData = {
      fsy_id: userInfo.fsy_id,
      full_name: userInfo.full_name,
      company_id: userInfo.company_id,
      company_name: userInfo.company_name,
      group_id: userInfo.group_id,
      group_name: userInfo.group_name,
      total_counselor: userInfo.total_counselor,
      total_participant: userInfo.total_participant,
      stake_name: userInfo.stake_name,
      unit_name: userInfo.unit_name,
      venue: userInfo.venue
    };
    
    // Update cache
    userInfoCache[userId] = {
      data: userData,
      timestamp: now
    };

    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('User info error:', error);
    
    // Return a more graceful error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user information',
        data: null
      },
      { status: 500 }
    );
  }
} 