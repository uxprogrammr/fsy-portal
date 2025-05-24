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
  room_name: string;
}

interface DailyEvent {
  event_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  day_number: number;
  venue: string | null;
  participant_dress_attire?: string | null;
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
        setLoading(true);
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        
        // Check if we have cached user info and it's less than 5 minutes old
        const cachedUserInfo = localStorage.getItem('cachedUserInfo');
        const cachedUserInfoTimestamp = localStorage.getItem('cachedUserInfoTimestamp');
        const now = Date.now();
        
        if (cachedUserInfo && cachedUserInfoTimestamp && (now - parseInt(cachedUserInfoTimestamp)) < 5 * 60 * 1000) {
          // Use cached user info
          setUserInfo(JSON.parse(cachedUserInfo));
        } else {
          // Fetch user info with retry logic
          let userInfoData = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && !userInfoData) {
            try {
              const userResponse = await fetch(`/api/user-info?userId=${userData.id}`);
              const userData2 = await userResponse.json();
              
              if (userResponse.ok) {
                userInfoData = userData2.data;
                setUserInfo(userInfoData);
                
                // Cache user info
                localStorage.setItem('cachedUserInfo', JSON.stringify(userInfoData));
                localStorage.setItem('cachedUserInfoTimestamp', now.toString());
                
                break;
              } else {
                console.warn(`Failed to fetch user info (attempt ${retryCount + 1}/${maxRetries}):`, userData2.error);
                retryCount++;
                if (retryCount < maxRetries) {
                  // Wait before retrying (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
              }
            } catch (error) {
              console.error(`Error fetching user info (attempt ${retryCount + 1}/${maxRetries}):`, error);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              }
            }
          }
          
          if (!userInfoData) {
            throw new Error('Failed to fetch user info after multiple attempts');
          }
        }

        // Check if we have cached events and they're less than 5 minutes old
        const cachedEvents = localStorage.getItem('cachedEvents');
        const cachedEventsTimestamp = localStorage.getItem('cachedEventsTimestamp');
        
        if (cachedEvents && cachedEventsTimestamp && (now - parseInt(cachedEventsTimestamp)) < 5 * 60 * 1000) {
          // Use cached events
          const eventsData = JSON.parse(cachedEvents);
          setCurrentEvent(eventsData.currentEvent);
          setNextEvent(eventsData.nextEvent);
          setUpcomingEvents(eventsData.upcomingEvents);
        } else {
          // Fetch events in sequence to reduce connection load
          try {
            // First fetch current event
            const eventResponse = await fetch('/api/events/current');
            let currentEventData = null;
            
            if (eventResponse.status === 404) {
              setCurrentEvent(null);
            } else if (eventResponse.ok) {
              currentEventData = await eventResponse.json();
              setCurrentEvent(currentEventData);
            } else {
              console.error('Error fetching current event:', await eventResponse.text());
            }
            
            // Then fetch next event
            const nextEventResponse = await fetch('/api/events/next');
            let nextEventData = null;
            
            if (nextEventResponse.ok) {
              nextEventData = await nextEventResponse.json();
              setNextEvent(nextEventData);
            } else if (nextEventResponse.status === 404) {
              // No upcoming events - this is a valid state
              setNextEvent(null);
              console.log('No upcoming events found');
            } else {
              console.error('Error fetching next event:', await nextEventResponse.text());
            }
            
            // Finally fetch all events
            const upcomingResponse = await fetch('/api/events');
            let upcomingEventsData = [];
            
            if (upcomingResponse.ok) {
              const eventsData = await upcomingResponse.json();
              const now = getCurrentDateTimeInPH();
              const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
              
              // Filter out past events and sort by start time
              const upcoming = eventsData.data
                .filter((event: DailyEvent) => {
                  if (event.day_number < (currentEventData?.day_number || 1)) return false;
                  if (event.day_number > (currentEventData?.day_number || 1)) return true;
                  return event.start_time > currentTime;
                })
                .sort((a: DailyEvent, b: DailyEvent) => {
                  if (a.day_number !== b.day_number) {
                    return a.day_number - b.day_number;
                  }
                  return a.start_time.localeCompare(b.start_time);
                });
              
              upcomingEventsData = upcoming;
              setUpcomingEvents(upcoming);
            } else {
              console.error('Error fetching upcoming events:', await upcomingResponse.text());
            }
            
            // Cache events
            localStorage.setItem('cachedEvents', JSON.stringify({
              currentEvent: currentEventData,
              nextEvent: nextEventData,
              upcomingEvents: upcomingEventsData
            }));
            localStorage.setItem('cachedEventsTimestamp', now.toString());
          } catch (error) {
            console.error('Error fetching events:', error);
          }
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up a timer to update the current date and time every second
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeInPH());
    }, 1000);
    
    // Set up a timer to refresh data every 15 minutes (increased from 10 minutes)
    const refreshTimer = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);
    
    // Clean up timers on component unmount
    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [router]);

  useEffect(() => {
    if (!nextEvent?.start_time) return;

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
        pt: { xs: '64px', sm: '80px' },
        pb: 10
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
              <Box 
                onClick={() => router.push(`/event-details/${currentEvent.event_id}`)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '8px'
                  }
                }}
              >
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
              </Box>
            ) : nextEvent ? (
              <Box 
                onClick={() => router.push(`/event-details/${nextEvent.event_id}`)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '8px'
                  }
                }}
              >
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
              </Box>
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
              onClick={() => router.push(`/my-group-members?group_id=${userInfo?.group_id}`)}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography sx={{ fontSize: '14px', color: '#0F172A' }}>
                {currentEvent?.day_number || nextEvent?.day_number || 1 ? `Day ${currentEvent?.day_number || nextEvent?.day_number || 1}` : ''}
              </Typography>
              {(() => {
                const attire = currentEvent?.participant_dress_attire || nextEvent?.participant_dress_attire;
                return attire ? (
                  <Typography sx={{ fontSize: '12px', color: '#666', mt: '-4px', textAlign: 'right' }}>
                    {attire}
                  </Typography>
                ) : null;
              })()}
            </Box>
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
                  onClick={() => router.push(`/event-details/${event.event_id}`)}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    p: 2,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateY(-1px)',
                      transition: 'transform 0.2s ease-in-out'
                    }
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