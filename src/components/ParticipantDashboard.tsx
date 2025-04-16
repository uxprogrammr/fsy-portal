'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress, Button, Modal, Container } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentDateTimeInPH, formatDateTimeInPH, formatTimeInPH } from '../utils/dateTimeUtils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

interface DailyEvent {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  venue: string | null;
}

const ParticipantDashboard = () => {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<Date>(getCurrentDateTimeInPH());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentEvent, setCurrentEvent] = useState<DailyEvent | null>(null);
  const [nextEvent, setNextEvent] = useState<DailyEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<DailyEvent[]>([]);
  const [countdown, setCountdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        
        // Fetch user info
        const userResponse = await fetch(`/api/user-info?userId=${userData.id}`);
        const userData2 = await userResponse.json();
        
        if (!userResponse.ok) {
          throw new Error(userData2.error || 'Failed to fetch user info');
        }
        
        setUserInfo(userData2.data);

        // Fetch current event
        const eventResponse = await fetch('/api/events/current');
        if (eventResponse.status === 404) {
          setCurrentEvent(null);
        } else {
          const eventData = await eventResponse.json();
          if (eventResponse.ok) {
            setCurrentEvent(eventData);
          } else {
            console.error('Error fetching current event:', eventData.error);
          }
        }

        // Fetch next event
        const nextEventResponse = await fetch('/api/events/next');
        if (nextEventResponse.ok) {
          const nextEventData = await nextEventResponse.json();
          setNextEvent(nextEventData);
        }

        // Fetch all events
        const upcomingResponse = await fetch('/api/events');
        if (upcomingResponse.ok) {
          const eventsData = await upcomingResponse.json();
          const now = getCurrentDateTimeInPH();
          const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
          
          // Filter out past events and sort by start time
          const upcoming = eventsData.data
            .filter((event: DailyEvent) => {
              if (event.day_number < (currentEvent?.day_number || 1)) return false;
              if (event.day_number > (currentEvent?.day_number || 1)) return true;
              return event.start_time > currentTime;
            })
            .sort((a: DailyEvent, b: DailyEvent) => {
              if (a.day_number !== b.day_number) {
                return a.day_number - b.day_number;
              }
              return a.start_time.localeCompare(b.start_time);
            });
          
          setUpcomingEvents(upcoming);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeInPH());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!nextEvent) return;

    const updateCountdown = () => {
      const now = getCurrentDateTimeInPH();
      const [hours, minutes] = nextEvent.start_time.split(':').map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(hours, minutes, 0);

      if (eventTime < now) {
        eventTime.setDate(eventTime.getDate() + 1);
      }

      const diff = eventTime.getTime() - now.getTime();
      const hours_remaining = Math.floor(diff / (1000 * 60 * 60));
      const minutes_remaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds_remaining = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours_remaining}h ${minutes_remaining}m ${seconds_remaining}s`);
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(timer);
  }, [nextEvent]);

  const handleQrClick = () => {
    setQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
  };

  if (loading) {
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

  return (
    <Box sx={{ 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
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

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        pt: { xs: '64px', sm: '80px' }
      }}>
        {/* Date/Time */}
        <Box sx={{ 
          pb: 0.5,
          px: { xs: 2, sm: 3 }, 
          mb: 0.5
        }}>
          <Typography color="text.secondary" sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            textAlign: 'right',
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
        </Box>

        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          {/* User Info and QR Code Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}>
            {/* User Info */}
            <Box sx={{ mb: { xs: 1, sm: 2 } }}>
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
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                {userInfo?.full_name || 'Loading...'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mb: 0.25
                }}
              >
                {userInfo?.stake_name || 'No Stake'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mb: 0.5
                }}
              >
                {userInfo?.unit_name || 'No Unit'}
              </Typography>
            </Box>

            {/* QR Code */}
            <Box sx={{ 
              ml: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 1
            }}>
              <Box onClick={handleQrClick} sx={{ cursor: 'pointer' }}>
                <QRCodeSVG
                  value={JSON.stringify({
                    fsy_id: userInfo?.fsy_id,
                    name: userInfo?.full_name,
                    stake: userInfo?.stake_name,
                    unit: userInfo?.unit_name
                  })}
                  size={100}
                  level="H"
                  includeMargin={true}
                />
                <Typography sx={{ 
                  fontSize: '8px',
                  color: '#2A0F0F',
                  textAlign: 'center',
                  mt: 0.25
                }}>
                  Tap to Enlarge
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Company and Group Info - Moved outside the flex container */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mb: 0.5,
            mt: 0
          }}>
            <Typography color="text.secondary" sx={{ textAlign: 'left' }}>
              {userInfo?.company_name || 'No Company'}
            </Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'right' }}>
              {userInfo?.group_name || 'No Group'}
            </Typography>
          </Box>

          {/* Current Event or Next Event Section */}
          <Box sx={{ 
            p: 1.5,
            mb: 3
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : currentEvent ? (
              <>
                <Typography sx={{ 
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0F172A',
                  mb: 0.5,
                  textAlign: 'center'
                }}>
                  {currentEvent.event_name}
                </Typography>
                <Typography sx={{ 
                  fontSize: '14px',
                  color: '#9CA2AA',
                  mb: 0.25,
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {formatTimeInPH(currentEvent.start_time)} - {formatTimeInPH(currentEvent.end_time)}
                </Typography>
                {currentEvent.venue && (
                  <Typography sx={{ 
                    fontSize: '14px',
                    color: '#0F172A',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    Venue: {currentEvent.venue}
                  </Typography>
                )}
              </>
            ) : nextEvent ? (
              <>
                <Typography sx={{ 
                  fontSize: '12px',
                  color: '#006184',
                  mb: 0.5,
                  textAlign: 'center',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Next Event
                </Typography>
                <Typography sx={{ 
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0F172A',
                  mb: 0.5,
                  textAlign: 'center'
                }}>
                  {nextEvent.event_name}
                </Typography>
                <Typography sx={{ 
                  fontSize: '14px',
                  color: '#9CA2AA',
                  mb: 0.25,
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  Starts in: {countdown}
                </Typography>
                <Typography sx={{ 
                  fontSize: '14px',
                  color: '#9CA2AA',
                  mb: 0.25,
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {formatTimeInPH(nextEvent.start_time)} - {formatTimeInPH(nextEvent.end_time)}
                </Typography>
                {nextEvent.venue && (
                  <Typography sx={{ 
                    fontSize: '14px',
                    color: '#0F172A',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    Venue: {nextEvent.venue}
                  </Typography>
                )}
              </>
            ) : (
              <Typography sx={{ 
                fontSize: '16px',
                color: '#0F172A',
                textAlign: 'center',
                fontWeight: 500
              }}>
                No events scheduled
              </Typography>
            )}
          </Box>

          {/* Group Members Button */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            mb: 2
          }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: '#006184',
                color: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '6px',
                py: 1.5,
                fontSize: '14px',
                fontWeight: 500,
                '&:hover': { bgcolor: '#005d7a' }
              }}
            >
              My Group Members
            </Button>
            <Button
              variant="contained"
              sx={{
                minWidth: '46px',
                height: '46px',
                bgcolor: '#006184',
                color: '#FFFFFF',
                p: 0,
                borderRadius: '6px',
                '&:hover': { bgcolor: '#005d7a' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Image
                src="/images/menu_button.png"
                alt="Menu"
                width={24}
                height={24}
                priority
                style={{
                  width: '24px',
                  height: '24px',
                  objectFit: 'contain'
                }}
              />
            </Button>
          </Box>

          {/* Upcoming Events Section */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ 
              fontSize: '16px',
              fontWeight: 600,
              color: '#0B111E'
            }}>
              Upcoming Events
            </Typography>
            <Typography sx={{ 
              fontSize: '14px',
              color: '#0F172A'
            }}>
              Day {currentEvent?.day_number || 1}
            </Typography>
          </Box>

          {/* Events List */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Box
                  key={event.event_id}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    p: 2,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Typography sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#0F172A',
                    mb: 0.5
                  }}>
                    {event.event_name}
                  </Typography>
                  <Typography sx={{
                    fontSize: '12px',
                    color: '#9CA2AA',
                    fontWeight: 500
                  }}>
                    {formatTimeInPH(event.start_time)} - {formatTimeInPH(event.end_time)}
                  </Typography>
                  {event.venue && (
                    <Typography sx={{
                      fontSize: '12px',
                      color: '#9CA2AA',
                      fontWeight: 500,
                      mt: 0.5
                    }}>
                      Venue: {event.venue}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography sx={{
                fontSize: '14px',
                color: '#9CA2AA',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                No upcoming events
              </Typography>
            )}
          </Box>
        </Container>
      </Box>

      {/* QR Code Modal */}
      <Modal
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        aria-labelledby="qr-code-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          bgcolor: 'white',
          p: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '95%'
        }}>
          {/* FSY ID */}
          <Typography sx={{ 
            color: '#000000',
            fontSize: '14px',
            fontFamily: 'Inter',
            mb: 0
          }}>
            FSY ID: {userInfo?.fsy_id}
          </Typography>

          {/* QR Code */}
          <Box sx={{ mb: 0 }}>
            <QRCodeSVG
              value={JSON.stringify({
                fsy_id: userInfo?.fsy_id,
                name: userInfo?.full_name,
                stake: userInfo?.stake_name,
                unit: userInfo?.unit_name
              })}
              size={250}
              level="H"
              includeMargin={true}
            />
          </Box>

          {/* Instruction Text */}
          <Typography sx={{ 
            color: '#000000',
            fontSize: '12px',
            textAlignLast: 'left',
            fontFamily: 'Inter',
            textAlign: 'center',
            maxWidth: '250px' // Match QR code width
          }}>
            Show this QR to your counselor during check-in.
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

export default ParticipantDashboard; 