// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

    if (!email || !password) {
        return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [rows]: any = await connection.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        await connection.end();

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        const token = jwt.sign(
            {
                id: user.user_id,
                email: user.email,
                type: user.user_type,
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie
        (await
            // Set cookie
            cookies()).set('session_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

        // Example: Return user info (or set a cookie/session/token here)
        return NextResponse.json({ message: 'Login successful', user: { id: user.user_id, email: user.email, type: user.user_type } });
    } catch (err: any) {
        console.error('Login error:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
