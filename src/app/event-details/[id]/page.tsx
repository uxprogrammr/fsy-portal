'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface EventDetails {
  event_id: number;
  event_name: string;
  day_number: number;
  start_time: string;
  end_time: string;
  description: string | null;
  attendance_required: string;
  venue: string | null;
  created_at: string;
}

function formatDateTime(dateString: string): string {
  try {
    // First try to parse as ISO string
    const date = parseISO(dateString);
    return format(date, 'PPp');
  } catch (error) {
    try {
      // If that fails, try to parse as a regular date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if still invalid
      }
      return format(date, 'PPp');
    } catch (error) {
      return dateString; // Return original string if all parsing fails
    }
  }
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!params?.id) return;
      
      try {
        const response = await fetch(`/api/event/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch event details');
        }

        setEvent(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [params?.id]);

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F5F5F5'
      }}>
        <Box className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F5F5F5'
      }}>
        <Box className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <Typography variant="h5" color="error" gutterBottom>Error</Typography>
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#F5F5F5'
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          maxWidth: '1200px',
          mx: 'auto'
        }}>
          <IconButton 
            onClick={() => router.back()} 
            sx={{ 
              color: 'white',
              mr: 2
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: 'white'
            }}
          >
            Event Details
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        pt: { xs: '64px', sm: '80px' },
        pb: 3
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          mx: 'auto',
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ 
            bgcolor: 'white',
            borderRadius: '10px',
            p: 3,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 600,
                color: '#0F172A',
                mb: 3
              }}
            >
              {event.event_name}
            </Typography>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3
            }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Day Number
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {event.day_number}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Start
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(event.start_time)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      End
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(event.end_time)}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Venue
                </Typography>
                <Typography variant="body1">
                  {event.venue || 'Not specified'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Attendance Required
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {event.attendance_required}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {event.description || 'No description available'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 