'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Container, Divider, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatTimeInPH } from '../utils/dateTimeUtils';

interface DailyEvent {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  company_id: number;
  group_id: number;
}

interface Participant {
  fsy_id: number;
  attendance_status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
  status: string;
}

interface UserCompanyGroup {
  full_name: string;
  company_id: number;
  company_name: string;
  group_id: number;
  group_name: string;
  total_counselor: number;
  total_participant: number;
}

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  birthDate: string;
}

const CheckAttendance = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentEvent, setCurrentEvent] = useState<DailyEvent | null>(null);
  const [userCompanyGroup, setUserCompanyGroup] = useState<UserCompanyGroup | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [counselors, setCounselors] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const stats = {
    present: participants.filter(p => p.attendance_status === 'Present').length,
    absent: participants.filter(p => p.attendance_status === 'Absent').length,
    excused: participants.filter(p => p.attendance_status === 'Excused').length,
    notSet: participants.filter(p => !['Present', 'Absent', 'Excused'].includes(p.attendance_status)).length,
  };

  const fetchParticipants = async (eventId: number, companyId: number, groupId: number) => {
    try {
      console.log('Fetching participants with:', { eventId, companyId, groupId });
      const response = await fetch(`/api/participants?event_id=${eventId}&company_id=${companyId}&group_id=${groupId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Participants API error:', errorData);
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      console.log('Participants data:', data);
      console.log('Number of participants:', data.participants?.length || 0);
      console.log('Number of counselors:', data.counselors?.length || 0);
      setParticipants(data.participants || []);
      setCounselors(data.counselors || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Failed to load participants');
    }
  };

  useEffect(() => {
    const fetchUserCompanyGroup = async (userId: number) => {
      try {
        console.log('Fetching user info for ID:', userId);
        const response = await fetch(`/api/user-info?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user information');
        }
        const data = await response.json();
        console.log('User info data:', data);
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch user information');
        }
        console.log('User company/group data:', {
          company_id: data.data.company_id,
          group_id: data.data.group_id,
          company_name: data.data.company_name,
          group_name: data.data.group_name
        });
        setUserCompanyGroup(data.data);
        return data.data;
      } catch (error) {
        console.error('Error fetching user information:', error);
        setError('Failed to load user information');
        return null;
      }
    };

    const fetchCurrentEvent = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const eventId = searchParams.get('event_id');
        console.log('Fetching event with ID:', eventId);
        const response = await fetch(`/api/events/current${eventId ? `?event_id=${eventId}` : ''}`);
        
        if (response.status === 404) {
          console.log('No current event found');
          setCurrentEvent(null);
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        console.log('Event data:', data);
        setCurrentEvent(data);
        return data;
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details');
        return null;
      }
    };

    const initializeData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          console.log('No user data found in localStorage');
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        console.log('User data from localStorage:', userData);
        if (!userData.id || !userData.type) {
          console.log('Invalid user data found');
          localStorage.removeItem('user');
          router.push('/');
          return;
        }

        setUser(userData);
        
        // Fetch user company/group and event details
        const [userInfo, eventData] = await Promise.all([
          fetchUserCompanyGroup(userData.id),
          fetchCurrentEvent()
        ]);

        console.log('Fetched data:', { userInfo, eventData });

        // If we have both user info and event data, fetch participants
        if (userInfo && eventData && userInfo.company_id && userInfo.group_id) {
          console.log('Fetching participants with IDs:', {
            eventId: eventData.event_id,
            companyId: userInfo.company_id,
            groupId: userInfo.group_id
          });
          await fetchParticipants(eventData.event_id, userInfo.company_id, userInfo.group_id);
        } else {
          console.log('Missing required data for participants:', { userInfo, eventData });
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [router]);

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />;
      case 'Absent':
        return <CancelOutlinedIcon sx={{ color: 'error.main' }} />;
      case 'Excused':
        return <BlockOutlinedIcon sx={{ color: 'warning.main' }} />;
      default:
        return <AddCircleOutlineIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'Not Set':
        return 'Present';
      case 'Present':
        return 'Absent';
      case 'Absent':
        return 'Excused';
      case 'Excused':
        return 'Not Set';
      default:
        return 'Not Set';
    }
  };

  const handleAttendanceClick = (participantId: number, currentStatus: string) => {
    const newStatus = getNextStatus(currentStatus);
    
    // Update local state only
    setParticipants(participants.map(p => 
      p.fsy_id === participantId ? { ...p, attendance_status: newStatus } : p
    ));
    
    // Also update counselors if needed
    setCounselors(counselors.map(c => 
      c.fsy_id === participantId ? { ...c, attendance_status: newStatus } : c
    ));
  };

  const handleClearAll = () => {
    // Update local state only
    setParticipants(participants.map(p => ({ ...p, attendance_status: 'Not Set' })));
    setCounselors(counselors.map(c => ({ ...c, attendance_status: 'Not Set' })));
  };

  const handleAllPresent = () => {
    // Update local state only
    setParticipants(participants.map(p => ({ ...p, attendance_status: 'Present' })));
    setCounselors(counselors.map(c => ({ ...c, attendance_status: 'Present' })));
  };

  const handleSubmitAttendance = async () => {
    try {
      if (!currentEvent) return;

      const response = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: currentEvent.event_id,
          company_id: userCompanyGroup?.company_id,
          group_id: userCompanyGroup?.group_id,
          participants: participants.map(p => ({
            fsy_id: p.fsy_id,
            attendance_status: p.attendance_status
          })),
          counselors: counselors.map(c => ({
            fsy_id: c.fsy_id,
            attendance_status: c.attendance_status
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit attendance');
      }

      // Show success toast
      setSnackbar({
        open: true,
        message: 'Attendance submitted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setError('Failed to submit attendance');
      
      // Show error toast
      setSnackbar({
        open: true,
        message: 'Failed to submit attendance',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
                  {formatTimeInPH(currentEvent.start_time)} - {formatTimeInPH(currentEvent.end_time)}
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
            ) : null}
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
              <Typography variant="h6">Participants ({participants.length})</Typography>
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
                key={participant.fsy_id}
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
                  <Typography>{`${participant.first_name} ${participant.last_name}`}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {participant.unit_name}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => handleAttendanceClick(participant.fsy_id, participant.attendance_status)}
                  sx={{ 
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  {getAttendanceIcon(participant.attendance_status)}
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Counselors Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Counselors ({counselors.length})</Typography>
            {counselors.map((counselor) => (
              <Box
                key={counselor.fsy_id}
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
                  <Typography>{`${counselor.first_name} ${counselor.last_name}`}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {counselor.unit_name}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => handleAttendanceClick(counselor.fsy_id, counselor.attendance_status)}
                  sx={{ 
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  {getAttendanceIcon(counselor.attendance_status)}
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmitAttendance}
            sx={{
              bgcolor: '#006D91',
              color: 'white',
              py: { xs: 1.5, sm: 2 },
              mb: { xs: 4, sm: 6 },
              '&:hover': {
                bgcolor: '#005d7a'
              }
            }}
          >
            Submit Attendance
          </Button>
          
          {/* Added extra space at the bottom */}
          <Box sx={{ height: { xs: 60, sm: 80 } }} />
        </Container>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CheckAttendance; 