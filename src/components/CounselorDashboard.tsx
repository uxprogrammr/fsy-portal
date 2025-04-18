'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Container, Paper, IconButton, useTheme, useMediaQuery, Grid, Badge, Switch, FormControlLabel, CircularProgress, Snackbar, Alert } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Fab from '@mui/material/Fab';
import { useRouter } from 'next/navigation';
import { getCurrentDateTimeInPH, formatDateTimeInPH } from '../utils/dateTimeUtils';

interface User {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  birthDate: string;
}

interface UserInfo {
  full_name: string;
  company_name: string;
  group_name: string;
  total_counselor: number;
  total_participant: number;
  group_id?: number;
}

interface Event {
  event_id: number;
  event_name: string;
  day_number: number;
  start_time: string;
  end_time: string;
  description: string | null;
  attendance_required: string;
  status: 'past' | 'ongoing' | 'upcoming';
}

const CounselorDashboard = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(getCurrentDateTimeInPH());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const refreshThreshold = 100; // pixels to trigger refresh
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeInPH());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

        // Check if this is a temporary session
        const isTemporary = sessionStorage.getItem('isTemporarySession');
        if (isTemporary) {
          console.log('Temporary session found');
          setUser(userData);
          fetchUserInfo(userData.id);
          fetchEvents();
          return;
        }

        // For permanent sessions (Remember Me checked)
        console.log('Permanent session found');
        setUser(userData);
        fetchUserInfo(userData.id);
        fetchEvents();
      } catch (error) {
        console.error('Auth check error:', error);
        // Only remove user data, not saved credentials
        localStorage.removeItem('user');
        router.push('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUserInfo = async (userId: number) => {
    try {
      const response = await fetch(`/api/user-info?userId=${userId}`);
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

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }
      
      setEvents(data.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Filter events based on showPastEvents state
  const filteredEvents = events.filter(event => 
    showPastEvents || event.status !== 'past'
  );
  
  console.log('Filtered events:', filteredEvents);

  // Handle touch/mouse events for pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Only handle if we're at the top of the scroll container
    if (scrollContainerRef.current?.scrollTop === 0) {
      isDragging.current = true;
      startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
      currentY.current = startY.current;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;
    
    currentY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Only allow pulling down when at the top
    if (scrollContainerRef.current?.scrollTop === 0) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    // If pulled down enough, refresh
    if (pullDistance > refreshThreshold) {
      refreshData();
    }
    
    // Reset pull distance
    setPullDistance(0);
  };

  // Refresh data function
  const refreshData = () => {
    if (isRefreshing || !user?.id) return;
    
    setIsRefreshing(true);
    fetchUserInfo(user.id);
    fetchEvents();
    
    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleEventClick = (event: Event) => {
    if (event.status === 'upcoming') {
      setSnackbar({
        open: true,
        message: 'Cannot check attendance for upcoming events',
        severity: 'warning'
      });
      return;
    }
    
    router.push(`/check-attendance?event_id=${event.event_id}`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isChecking || isLoading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F5F5F5'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px' }}>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Dashboard
          </Typography>
          <IconButton 
            onClick={() => router.push('/profile')}
            sx={{ color: 'white' }}
          >
            <AccountCircleIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
          </IconButton>
        </Box>
      </Box>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '64px', sm: '80px' },
            left: 0,
            right: 0,
            height: pullDistance,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(0, 188, 212, 0.1)',
            zIndex: 900,
            transition: 'height 0.2s ease-out'
          }}
        >
          {pullDistance > refreshThreshold ? (
            <Typography color="primary" sx={{ fontSize: '0.875rem' }}>
              Release to refresh
            </Typography>
          ) : (
            <CircularProgress size={20} color="primary" />
          )}
        </Box>
      )}

      {/* Scrollable Content */}
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          height: '100%',
          overflow: 'auto',
          pt: { xs: '64px', sm: '80px' },
          pb: { xs: 3, sm: 4 },
          bgcolor: '#f5f5f5',
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* User Info */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography color="text.secondary" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'right',
                mt: 1 // Added small top margin
              }}>
              {formatDateTimeInPH(currentDateTime, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
              })}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Hello,
            </Typography>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
                wordBreak: 'break-word',
                fontWeight: 'bold' // Added bold styling
              }}
            >
              {userInfo?.full_name || 'Loading...'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 },
              justifyContent: 'space-between', 
              mb: 2 
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography color="text.secondary" sx={{ textAlign: 'left' }}>
                  {userInfo?.company_name || 'No Company'}
                </Typography>
                <Typography color="text.secondary" sx={{ textAlign: 'right' }}>
                  {userInfo?.group_name || 'No Group'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1.5, sm: 2 }, 
            mb: { xs: 3, sm: 4 } 
          }}>
            <Paper sx={{ 
              flex: 1, 
              p: { xs: 1.5, sm: 2 }, 
              textAlign: 'center', 
              borderRadius: 4,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={() => {
              if (userInfo?.group_id) {
                router.push(`/my-group-members?group_id=${userInfo.group_id}`);
              }
            }}
            >
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', sm: '3rem' }
                }}
              >
                {userInfo?.total_participant || 0}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Participants
              </Typography>
            </Paper>
            <Paper sx={{ 
              flex: 1, 
              p: { xs: 1.5, sm: 2 }, 
              textAlign: 'center', 
              borderRadius: 4 
            }}>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', sm: '3rem' }
                }}
              >
                {userInfo?.total_counselor || 0}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Counselors
              </Typography>
            </Paper>
          </Box>

          {/* Check Attendance Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => router.push('/check-attendance')}
            sx={{
              bgcolor: '#006D91',
              color: 'white',
              py: { xs: 1.5, sm: 2 },
              mb: { xs: 3, sm: 4 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              '&:hover': {
                bgcolor: '#005d7a'
              }
            }}
          >
            Check Attendance
          </Button>

          {/* Events Section */}
          <Box sx={{ mb: { xs: 13, sm: 14 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: { xs: 1.5, sm: 2 } 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mr: 2 }}
                >
                  Events
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPastEvents}
                      onChange={(e) => setShowPastEvents(e.target.checked)}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Show Past
                    </Typography>
                  }
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Day {events.length > 0 ? events[0].day_number : 1}
              </Typography>
            </Box>

            {filteredEvents.map((event) => (
              <Box
                key={event.event_id}
                onClick={() => handleEventClick(event)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: 'white',
                  p: { xs: 1.5, sm: 2 },
                  mb: 1,
                  borderRadius: 2,
                  position: 'relative',
                  textDecoration: event.status === 'past' ? 'line-through' : 'none',
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  component="h3" 
                  sx={{ 
                    mb: 0.5,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    pr: event.status === 'ongoing' ? { xs: '80px', sm: '100px' } : 0
                  }}
                >
                  {event.event_name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  {event.start_time} - {event.end_time}
                </Typography>
                {event.status === 'ongoing' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: { xs: 12, sm: 16 },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: '#FFA726',
                      color: 'white',
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.3, sm: 0.5 },
                      borderRadius: 4,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    On-going
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="qr-code"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 32 },
          right: { xs: 16, sm: 32 },
          bgcolor: '#006D91',
          '&:hover': {
            bgcolor: '#005d7a'
          },
          zIndex: 1000
        }}
      >
        <QrCodeIcon />
      </Fab>

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

export default CounselorDashboard;