'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Container, Divider, Paper, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Attendee {
  id: number;
  name: string;
  company: string;
  status: 'present' | 'absent' | 'excused' | 'not-set';
}

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone: string;
  birthDate: string;
}

const CheckAttendance = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<Attendee[]>([
    { id: 1, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
    { id: 2, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
    { id: 3, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
    { id: 4, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
    { id: 5, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
  ]);
  const [counselors, setCounselors] = useState<Attendee[]>([
    { id: 6, name: 'Juan D.', company: 'Kalibo / Altavas', status: 'present' },
    { id: 7, name: 'John Rey B.', company: 'Kalibo / Altavas', status: 'not-set' },
  ]);

  const stats = {
    present: participants.filter(p => p.status === 'present').length,
    absent: participants.filter(p => p.status === 'absent').length,
    excused: participants.filter(p => p.status === 'excused').length,
    notSet: participants.filter(p => p.status === 'not-set').length,
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          console.log('No user data found in localStorage');
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        if (!userData.id || !userData.type) {
          console.log('Invalid user data found');
          localStorage.removeItem('user');
          router.push('/');
          return;
        }

        // Check if this is a temporary session
        const isTemporary = sessionStorage.getItem('isTemporarySession');
        if (isTemporary) {
          console.log('Temporary session found');
          setUser(userData);
          return;
        }

        // For permanent sessions (Remember Me checked)
        console.log('Permanent session found');
        setUser(userData);
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

  const handleClearAll = () => {
    setParticipants(participants.map(p => ({ ...p, status: 'not-set' })));
    setCounselors(counselors.map(c => ({ ...c, status: 'not-set' })));
  };

  const handleAllPresent = () => {
    setParticipants(participants.map(p => ({ ...p, status: 'present' })));
    setCounselors(counselors.map(c => ({ ...c, status: 'present' })));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Header */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bgcolor: '#00BCD4',
        color: 'white',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => router.back()}
            sx={{ color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Check Attendance
          </Typography>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        height: '100%',
        overflow: 'auto',
        pt: { xs: '64px', sm: '80px' },
        pb: { xs: 3, sm: 4 },
        bgcolor: '#f5f5f5'
      }}>
        <Container maxWidth="sm" sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Event Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '1.25rem', mb: 1 }}>
              Meet Your Counselor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              1:30pm - 2:20pm
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Company 1
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Group 1
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mb: 3,
            '& > div': {
              textAlign: 'center',
              flex: 1
            }
          }}>
            <Box>
              <Typography variant="h6" color="success.main">{stats.present}</Typography>
              <Typography variant="body2">Present</Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="error.main">{stats.absent}</Typography>
              <Typography variant="body2">Absent</Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main">{stats.excused}</Typography>
              <Typography variant="body2">Excused</Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="text.secondary">{stats.notSet}</Typography>
              <Typography variant="body2">Not Set</Typography>
            </Box>
          </Box>

          {/* Participants Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Participants</Typography>
              <Box>
                <Button 
                  size="small" 
                  onClick={handleClearAll}
                  sx={{ mr: 1, textTransform: 'none' }}
                >
                  Clear All
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={handleAllPresent}
                  sx={{ 
                    bgcolor: '#4CAF50',
                    '&:hover': { bgcolor: '#388E3C' },
                    textTransform: 'none'
                  }}
                >
                  All Present
                </Button>
              </Box>
            </Box>
            {participants.map((participant) => (
              <Box
                key={participant.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  bgcolor: 'white',
                  borderRadius: 1
                }}
              >
                <Box>
                  <Typography>{participant.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {participant.company}
                  </Typography>
                </Box>
                {participant.status === 'present' ? (
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Typography>P</Typography>
                  </Box>
                ) : (
                  <IconButton>
                    <AddCircleOutlineIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          {/* Counselors Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Counselors</Typography>
            {counselors.map((counselor) => (
              <Box
                key={counselor.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  bgcolor: 'white',
                  borderRadius: 1
                }}
              >
                <Box>
                  <Typography>{counselor.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {counselor.company}
                  </Typography>
                </Box>
                {counselor.status === 'present' ? (
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Typography>P</Typography>
                  </Box>
                ) : (
                  <IconButton>
                    <AddCircleOutlineIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            sx={{
              bgcolor: '#006D91',
              color: 'white',
              py: { xs: 1.5, sm: 2 },
              '&:hover': {
                bgcolor: '#005d7a'
              }
            }}
          >
            Submit Attendance
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default CheckAttendance; 