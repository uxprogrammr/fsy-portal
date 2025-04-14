import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone_number, password, userId } = body;

    console.log('Profile update request body:', body); // Add logging to debug

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
    if (phone_number) {
      updateFields.push(' phone_number = ?');
      values.push(phone_number);
    }

    // Add password if provided using SHA2 256
    if (password) {
      updateFields.push(' password_hash = SHA2(?, 256)');
      values.push(password);
    }

    // If no fields to update, return error
    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Complete the SQL query
    sql += updateFields.join(',') + ' WHERE user_id = ?';
    values.push(userId);

    console.log('SQL Query:', sql);
    console.log('Values:', values);

    // Execute the update query
    const result = await query(sql, values);
    console.log('Query Result:', result);

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 