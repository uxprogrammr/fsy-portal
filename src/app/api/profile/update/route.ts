import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, password, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Start building the SQL query
    let sql = 'UPDATE users SET';
    const values = [];
    const updateFields = [];

    // Add email if provided
    if (email) {
      updateFields.push(' email = ?');
      values.push(email);
    }

    // Add phone if provided
    if (phone) {
      updateFields.push(' phone = ?');
      values.push(phone);
    }

    // Add password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(' password_hash = ?');
      values.push(hashedPassword);
    }

    // If no fields to update, return error
    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Complete the SQL query
    sql += updateFields.join(',') + ' WHERE id = ?';
    values.push(userId);

    // Execute the update query
    await query(sql, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 