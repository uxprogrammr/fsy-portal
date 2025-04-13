'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, Container, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  email: string;
  phone: string;
  password: string;
  retypePassword: string;
}

const Profile = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileFormData>({
    email: '',
    phone: '',
    password: '',
    retypePassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        setFormData(prev => ({
          ...prev,
          email: userData.email || '',
          phone: userData.phone || ''
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/');
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get user data from localStorage
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        throw new Error('User not found');
      }
      const userData = JSON.parse(savedUser);

      // Validate passwords match if being updated
      if (formData.password || formData.retypePassword) {
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (formData.password !== formData.retypePassword) {
          throw new Error('Passwords do not match');
        }
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          password: formData.password || undefined,
          userId: userData.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        email: formData.email,
        phone: formData.phone,
      }));

      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });

      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
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
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        zIndex: 1000
      }}>
        <IconButton 
          onClick={() => router.back()}
          sx={{ color: 'white' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Profile
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        height: '100%',
        overflow: 'auto',
        pt: { xs: '64px', sm: '80px' },
        bgcolor: '#F5F5F5'
      }}>
        <Container maxWidth="sm" sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Full Name
              </Typography>
              <TextField
                fullWidth
                disabled
                value="Shawn Henry Solomon Cepeda"
                sx={{ bgcolor: '#F5F5F5' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                User Role
              </Typography>
              <TextField
                fullWidth
                disabled
                value="Counselor"
                sx={{ bgcolor: '#F5F5F5' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Phone Number
              </Typography>
              <TextField
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Update Password
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  helperText="Password must be at least 6 characters"
                  error={formData.password.length > 0 && formData.password.length < 6}
                  autoComplete="new-password"
                  inputProps={{
                    autoComplete: 'new-password'
                  }}
                />
              </Box>
              <TextField
                fullWidth
                name="retypePassword"
                type="password"
                value={formData.retypePassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                error={formData.retypePassword.length > 0 && formData.password !== formData.retypePassword}
                helperText={formData.retypePassword.length > 0 && formData.password !== formData.retypePassword ? "Passwords do not match" : ""}
                autoComplete="new-password"
                inputProps={{
                  autoComplete: 'new-password'
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                bgcolor: '#006D91',
                color: 'white',
                py: { xs: 1.5, sm: 2 },
                '&:hover': {
                  bgcolor: '#005d7a'
                }
              }}
            >
              Save Changes
            </Button>
          </form>
        </Container>
      </Box>

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

export default Profile; 