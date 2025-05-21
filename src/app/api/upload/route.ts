import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { isAuthenticated } from '@/lib/auth';
import { query } from '@/lib/db';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Helper function to extract filename from URL
function getFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove the leading '/v0/b/' and everything after '?'
    const path = pathname.split('/v0/b/')[1]?.split('?')[0] || '';
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(path);
    // Get the filename from the path
    const filename = decodedPath.split('/').pop();
    return filename || null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user type from database
    const userRows = await query(
      'SELECT user_type FROM users WHERE user_id = ?',
      [session.userId]
    ) as any[];

    const userType = userRows[0]?.user_type;
    if (!userType || userType !== 'Counselor') {
      return NextResponse.json({ error: 'Only counselors can upload photos' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `notes/${filename}`);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file to Firebase Storage
    await uploadBytes(storageRef, uint8Array);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return NextResponse.json({ url: downloadURL });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await isAuthenticated();
    if (!session || typeof session === 'boolean') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user type from database
    const userRows = await query(
      'SELECT user_type FROM users WHERE user_id = ?',
      [session.userId]
    ) as any[];

    const userType = userRows[0]?.user_type;
    if (!userType || userType !== 'Counselor') {
      return NextResponse.json({ error: 'Only counselors can delete photos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoUrl = searchParams.get('url');

    if (!photoUrl) {
      return NextResponse.json({ error: 'No photo URL provided' }, { status: 400 });
    }

    // Extract filename from URL
    const filename = getFilenameFromUrl(photoUrl);
    if (!filename) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    // Delete file from Firebase Storage
    const storageRef = ref(storage, `notes/${filename}`);
    await deleteObject(storageRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
} 