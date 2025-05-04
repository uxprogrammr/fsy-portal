// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  birthDate: string;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe } = await request.json() as LoginRequest;

    // Call the stored procedure to check user login
    const sql = 'CALL check_user_login(?, ?)';
    const results = await query(sql, [username, password]) as RowDataPacket[];

    // Stored procedure returns array of result sets, first element is our user array
    const users = results[0] as RowDataPacket[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if user has company and group association
    const companyGroupSql = 'CALL get_user_company_group(?)';
    const companyGroupResults = await query(companyGroupSql, [user.user_id]) as RowDataPacket[];
    
    // Check if results exist and have data
    if (!companyGroupResults || !companyGroupResults[0] || !companyGroupResults[0][0]) {
      return NextResponse.json(
        { success: false, error: 'User information not found' },
        { status: 404 }
      );
    }
    
    const userInfo = companyGroupResults[0][0] as RowDataPacket;
    
    if (userInfo.company_id == null || userInfo.group_id == null) {
      return NextResponse.json(
        { success: false, error: 'User is not associated with any company or group' },
        { status: 403 }
      );
    }

    // Return user data for localStorage
    const userData: User = {
      id: user.user_id,
      name: user.full_name,
      type: user.user_type,
      email: user.email,
      phone_number: user.phone_number,
      birthDate: user.birth_date
    };

    // Create the response with the cookie
    const response = NextResponse.json({
      success: true,
      user: userData
    });

    // Set session cookie with appropriate expiration
    response.cookies.set('session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days if remember me, 1 day if not
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
