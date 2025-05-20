// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  birthDate: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

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

    // Create JWT token
    const token = jwt.sign({ id: user.user_id }, JWT_SECRET, {
      expiresIn: rememberMe ? '7d' : '24h'
    });

    // Create the response with the cookie
    const response = NextResponse.json({
      success: true,
      user: userData
    });

    // Set the session cookie
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 7 days or 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
