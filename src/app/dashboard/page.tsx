'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CounselorDashboard from '@/components/CounselorDashboard';
import ParticipantDashboard from '@/components/ParticipantDashboard';
import { Box, CircularProgress } from '@mui/material';

interface User {
  id: number;
  name: string;
  type: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);
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

        setUserType(userData.type);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('user');
        router.push('/');
      } finally {
        setIsLoading(false);
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

  if (!userType) {
    router.push('/');
    return null;
  }

  return userType === 'Counselor' ? <CounselorDashboard /> : <ParticipantDashboard />;
} 