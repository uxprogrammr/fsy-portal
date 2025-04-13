'use client';

import React from 'react';
import { Box, Typography, Button, Container, Paper, IconButton, useTheme, useMediaQuery, Grid, Badge } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Fab from '@mui/material/Fab';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const events = [
    { name: 'Room Checks (if applicable)', time: '1:15pm - 1:30pm', status: 'cancelled' },
    { name: 'Meet Your Counselor', time: '1:30pm - 2:20pm', status: 'ongoing' },
    { name: 'Meet Your Company', time: '2:30pm - 3:05pm', status: 'upcoming' },
    { name: 'Company Name and Chant', time: '3:05pm - 3:15pm', status: 'upcoming' },
    { name: 'Orientation', time: '3:30pm - 4:30pm', status: 'upcoming' },
    { name: 'Dinner', time: '4:45pm - 5:45pm', status: 'upcoming' },
  ];

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Dashboard
          </Typography>
          <IconButton sx={{ color: 'white' }}>
            <AccountCircleIcon fontSize={isMobile ? "medium" : "large"} />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          pt: { xs: '64px', sm: '80px' },
          pb: { xs: 3, sm: 4 },
          bgcolor: '#f5f5f5'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* User Info */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography color="text.secondary" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'right',
                mt: 1 // Added small top margin
              }}>
                {new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
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
              Juan Dela Cruz
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
                  Company 1
                </Typography>
                <Typography color="text.secondary" sx={{ textAlign: 'right' }}>
                  Group 1
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
                10
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
                2
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
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: { xs: 1.5, sm: 2 } 
            }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
              >
                Events
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Day 1
              </Typography>
            </Box>

            {events.map((event, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: 'white',
                  p: { xs: 1.5, sm: 2 },
                  mb: 1,
                  borderRadius: 2,
                  position: 'relative',
                  textDecoration: event.status === 'cancelled' ? 'line-through' : 'none',
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
                  {event.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  {event.time}
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
    </Box>
  );
};

export default Dashboard;