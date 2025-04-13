'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Container, Divider, Paper, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DailyEvent {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  company_id: number;
  group_id: number;
}

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

interface UserCompanyGroup {
  full_name: string;
  company_name: string;
  group_name: string;
  total_counselor: number;
  total_participant: number;
}

const CheckAttendance = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentEvent, setCurrentEvent] = useState<DailyEvent | null>(null);
  const [userCompanyGroup, setUserCompanyGroup] = useState<UserCompanyGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    const fetchUserCompanyGroup = async (userId: number) => {
      try {
        const response = await fetch(`/api/user-info?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user information');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch user information');
        }
        setUserCompanyGroup(data.data);
      } catch (error) {
        console.error('Error fetching user information:', error);
        setError('Failed to load user information');
      }
    };

    const fetchCurrentEvent = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const eventId = searchParams.get('event_id');
        const response = await fetch(`/api/events/current${eventId ? `?event_id=${eventId}` : ''}`);
        
        if (response.status === 404) {
          // This is not an error, just no current event
          setCurrentEvent(null);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch event details');
        }
        
        const data = await response.json();
        setCurrentEvent(data);
      } catch (error: any) {
        console.error('Error fetching event:', error);
        setError(error.message || 'Failed to load event details');
      }
    };

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

        setUser(userData);
        fetchUserCompanyGroup(userData.id);
        fetchCurrentEvent();
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

  // If no current event, show centered message
  if (!currentEvent) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        textAlign="center"
        px={3}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Active Event
        </Typography>
        <Typography variant="body1" color="text.secondary">
          There is no event scheduled for the current time.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          sx={{ mt: 3 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

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
            {error ? (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            ) : currentEvent ? (
              <>
                <Typography variant="h6" sx={{ fontSize: '1.25rem', mb: 1 }}>
                  {currentEvent.event_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {formatTime(currentEvent.start_time)} - {formatTime(currentEvent.end_time)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {userCompanyGroup?.company_name || 'No Company'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userCompanyGroup?.group_name || 'No Group'}
              </Typography>
            </Box>
              </>
            ) : (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No active event at this time
              </Typography>
            )}
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