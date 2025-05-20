'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import { Box, CircularProgress } from '@mui/material';

interface User {
  id: number;
  name: string;
  type: string;
}

export default function QRScannerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          console.log('No user data found in localStorage');
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser) as User;
        if (!userData.id || !userData.type) {
          console.log('Invalid user data found');
          localStorage.removeItem('user');
          router.push('/');
          return;
        }

        if (userData.type !== 'Counselor') {
          console.log('User is not a counselor');
          router.push('/dashboard');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('user');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F5F5F5'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return <QRScanner />;
} 