'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, Container, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  email: string;
  phone_number: string;
  password: string;
  retypePassword: string;
}

interface UserInfo {
  full_name: string;
  company_name: string;
  group_name: string;
  room_name: string;
}

const Profile = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileFormData>({
    email: '',
    phone_number: '',
    password: '',
    retypePassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userType, setUserType] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Set isClient to true once component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        console.log('User data from localStorage:', userData);
        
        // Set basic user data
        setFormData(prev => ({
          ...prev,
          email: userData.email || '',
          phone_number: userData.phone_number || ''
        }));
        setUserType(userData.type || '');

        // Fetch detailed user info
        const response = await fetch(`/api/user-info?userId=${userData.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user info');
        }
        
        setUserInfo(data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/');
      }
    };

    if (isClient) {
      fetchUserData();
    }
  }, [router, isClient]);

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
          phone_number: formData.phone_number || undefined,
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
        phone_number: formData.phone_number,
      }));

      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });

      // Only redirect to dashboard after a successful update
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

  const handleBack = () => {
    router.back();
  };

  // Don't render form until client-side hydration is complete
  if (!isClient) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '36px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={handleBack}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Profile
            </Typography>
          </Box>
          <Button
            onClick={() => {
              // Only remove user data, not saved credentials
              localStorage.removeItem('user');
              router.push('/');
            }}
            sx={{ 
              color: 'white',
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Sign Out
          </Button>
        </Box>
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
                value={userInfo?.full_name || ''}
                sx={{ bgcolor: '#F5F5F5' }}
                inputProps={{ autoComplete: 'name' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                User Role
              </Typography>
              <TextField
                fullWidth
                disabled
                value={userType}
                sx={{ bgcolor: '#F5F5F5' }}
                inputProps={{ autoComplete: 'organization-title' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Company
              </Typography>
              <TextField
                fullWidth
                disabled
                value={userInfo?.company_name || ''}
                sx={{ bgcolor: '#F5F5F5' }}
                inputProps={{ autoComplete: 'organization' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Group
              </Typography>
              <TextField
                fullWidth
                disabled
                value={userInfo?.group_name || ''}
                sx={{ bgcolor: '#F5F5F5' }}
                inputProps={{ autoComplete: 'organization' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Room
              </Typography>
              <TextField
                fullWidth
                disabled
                value={userInfo?.room_name || ''}
                sx={{ bgcolor: '#F5F5F5' }}
                inputProps={{ autoComplete: 'organization' }}
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
                inputProps={{ autoComplete: 'email' }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Phone Number
              </Typography>
              <TextField
                fullWidth
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter your phone number"
                inputProps={{ autoComplete: 'tel' }}
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
                mb: { xs: 14, sm: 16 },
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