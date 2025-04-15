'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, IconButton, CircularProgress } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentDateTimeInPH, formatDateTimeInPH } from '../utils/dateTimeUtils';
import { useRouter } from 'next/navigation';

interface UserInfo {
  fsy_id: number;
  full_name: string;
  company_id: number;
  company_name: string;
  group_id: number;
  group_name: string;
  stake_name: string;
  unit_name: string;
}

const ParticipantDashboard = () => {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<Date>(getCurrentDateTimeInPH());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        const response = await fetch(`/api/user-info?userId=${userData.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user info');
        }
        
        setUserInfo(data.data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeInPH());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const qrCodeData = JSON.stringify({
    fsy_id: userInfo?.fsy_id,
    name: userInfo?.full_name,
    stake: userInfo?.stake_name,
    unit: userInfo?.unit_name
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: '#00BCD4',
        color: 'white',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: { xs: '56px', sm: '64px' }
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Dashboard
        </Typography>
        <IconButton 
          onClick={() => router.push('/profile')}
          sx={{ color: 'white' }}
        >
          <AccountCircleIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          pt: { xs: '64px', sm: '80px' },
          pb: { xs: 8, sm: 10 }
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Current Date/Time */}
          <Typography 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: { xs: 2, sm: 3 },
              textAlign: 'right'
            }}
          >
            {formatDateTimeInPH(currentDateTime, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })}
          </Typography>

          {/* Greeting and Name */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              Hello,
            </Typography>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 500,
                mb: { xs: 1, sm: 2 }
              }}
            >
              {userInfo?.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userInfo?.stake_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userInfo?.unit_name}
            </Typography>
          </Box>

          {/* Company and Group */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mb: { xs: 2, sm: 3 }
          }}>
            <Typography variant="body2" color="text.secondary">
              {userInfo?.company_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userInfo?.group_name}
            </Typography>
          </Box>

          {/* QR Code */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: { xs: 2, sm: 3 }
          }}>
            <Box sx={{ 
              bgcolor: 'white',
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: 1,
              mb: 1
            }}>
              <QRCodeSVG
                value={qrCodeData}
                size={160}
                level="H"
                includeMargin={true}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              FSY ID: {userInfo?.fsy_id}
            </Typography>
          </Box>

          {/* Current Event */}
          <Box sx={{ 
            bgcolor: 'white',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: 1,
            mb: { xs: 2, sm: 3 }
          }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              Meet Your Counselor
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              1:30pm - 2:20pm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Venue: Ball Room
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Fixed Bottom Button */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: { xs: 2, sm: 3 },
        bgcolor: '#f5f5f5',
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        zIndex: 1000
      }}>
        <Container maxWidth="sm">
          <Box
            component="button"
            sx={{
              width: '100%',
              bgcolor: '#006D91',
              color: 'white',
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              border: 'none',
              borderRadius: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#005d7a'
              }
            }}
          >
            Locate Venue
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ParticipantDashboard; 