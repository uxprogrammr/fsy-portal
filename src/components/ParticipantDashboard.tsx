'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Container, Paper, IconButton, useTheme, useMediaQuery, Grid, Badge, Switch, FormControlLabel, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Fab from '@mui/material/Fab';
import { useRouter } from 'next/navigation';
import { getCurrentDateTimeInPH, formatDateTimeInPH } from '../utils/dateTimeUtils';
import { QRCodeSVG } from 'qrcode.react';

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

const ParticipantDashboard = () => {
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
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');

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

  const handleQrCodeClick = () => {
    // Generate QR code data with user ID and name
    const qrData = JSON.stringify({
      userId: user?.id,
      name: userInfo?.full_name,
      type: 'participant'
    });
    setQrCodeData(qrData);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
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
        bgcolor: '#4CAF50', // Green color for participant
        color: 'white',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px' }}>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Participant Dashboard
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
            bgcolor: 'rgba(76, 175, 80, 0.1)', // Green color for participant
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
                mt: 1
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
              Welcome,
            </Typography>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
                wordBreak: 'break-word',
                fontWeight: 'bold'
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

          {/* Participant Info Card */}
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: { xs: 3, sm: 4 },
            borderRadius: 4,
            bgcolor: '#E8F5E9' // Light green background
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
              Your Information
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid xs={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {user?.phone_number || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

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
                  Today's Schedule
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
                Day {events[0]?.day_number || 1}
              </Typography>
            </Box>

            {filteredEvents.map((event) => (
              <Paper
                key={event.event_id}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 1,
                  borderRadius: 2,
                  position: 'relative',
                  textDecoration: event.status === 'past' ? 'line-through' : 'none',
                  bgcolor: event.status === 'ongoing' ? '#E8F5E9' : 'white',
                  border: event.status === 'ongoing' ? '2px solid #4CAF50' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  component="h3" 
                  sx={{ 
                    mb: 0.5,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    pr: event.status === 'ongoing' ? { xs: '80px', sm: '100px' } : 0,
                    color: event.status === 'ongoing' ? '#2E7D32' : 'inherit'
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
                      bgcolor: '#4CAF50',
                      color: 'white',
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.3, sm: 0.5 },
                      borderRadius: 4,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Active Now
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="qr-code"
        onClick={handleQrCodeClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 32 },
          right: { xs: 16, sm: 32 },
          bgcolor: '#4CAF50',
          '&:hover': {
            bgcolor: '#388E3C'
          },
          zIndex: 1000
        }}
      >
        <QrCodeIcon />
      </Fab>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={handleCloseQrDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Your QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            p: 2 
          }}>
            <QRCodeSVG 
              value={qrCodeData} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Show this QR code to the counselor for attendance
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default ParticipantDashboard; 