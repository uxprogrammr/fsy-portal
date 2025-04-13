// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone: string;
  birthDate: string;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json() as LoginRequest;

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

    // Return user data for localStorage
    const userData: User = {
      id: user.user_id,
      name: user.full_name,
      type: user.user_type,
      email: user.email,
      phone: user.phone_number,
      birthDate: user.birth_date
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
