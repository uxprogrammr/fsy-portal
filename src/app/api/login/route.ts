// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
    user_id: number;
    full_name: string;
    user_type: 'Coordinator' | 'Counselor' | 'Participant';
    email: string;
    phone_number: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Call the stored procedure
        const sql = 'CALL check_user_login(?, ?)';
        const results = await query(sql, [username, password]) as RowDataPacket[];
        
        // Stored procedure returns array of result sets, first element is our user array
        const users = results[0] as UserRow[];

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const user = users[0];

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                name: user.full_name,
                type: user.user_type,
                email: user.email,
                phone: user.phone_number
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
