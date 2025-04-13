'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, TextField, Typography, Button, Checkbox, FormControlLabel, Alert } from '@mui/material';
import Image from 'next/image';

interface LoginResponse {
  message: string;
  user: {
    id: number;
    name: string;
    type: string;
    email: string;
    phone: string;
    birthDate: string;
  };
}

export default function Login() {
  console.log('Login component rendering');
  
  // Direct check for localStorage
  try {
    const testKey = 'test_' + Date.now();
    localStorage.setItem(testKey, 'test');
    const testValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    console.log('localStorage test successful:', testValue === 'test');
  } catch (e) {
    console.error('localStorage test failed:', e);
  }
  
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [touched, setTouched] = useState({
    username: false,
    password: false
  });

  // Load saved credentials when component mounts
  useEffect(() => {
    console.log('Login component mounted');
    
    try {
      // Test localStorage access
      console.log('Testing localStorage access');
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('localStorage access successful');
    } catch (e) {
      console.error('localStorage access error:', e);
    }
    
    const loadSavedCredentials = () => {
      console.log('loadSavedCredentials function called');
      try {
        // Check for saved user session
        const savedUser = localStorage.getItem('user');
        console.log('Saved user from localStorage:', savedUser);
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData.id && userData.type) {
            console.log('Valid user session found, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
        }

        // Check for saved credentials
        const savedCredentials = localStorage.getItem('savedCredentials');
        console.log('Checking for saved credentials...');
        console.log('Raw savedCredentials from localStorage:', savedCredentials);
        
        if (savedCredentials) {
          try {
            const { username, password, rememberMe } = JSON.parse(savedCredentials);
            console.log('Found saved credentials:', { username, rememberMe });
            
            // Always set the form data if we have saved credentials
            console.log('Setting form data with saved credentials');
            setFormData({
              username,
              password,
              rememberMe: true
            });
            console.log('Form data updated with saved credentials');
          } catch (parseError) {
            console.error('Error parsing saved credentials:', parseError);
            localStorage.removeItem('savedCredentials');
          }
        } else {
          console.log('No saved credentials found in localStorage');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    loadSavedCredentials();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      setTouched({ username: true, password: true });
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Submitting login form with data:', {
        username: formData.username,
        rememberMe: formData.rememberMe
      });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loginData = data as LoginResponse;
      console.log('Login successful, user data:', loginData.user);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(loginData.user));
      console.log('User data saved to localStorage');

      // Only store credentials after successful login if Remember Me is checked
      if (formData.rememberMe) {
        // Store credentials in localStorage
        const credentialsToSave = {
          username: formData.username,
          password: formData.password,
          rememberMe: true
        };
        console.log('Saving credentials to localStorage:', credentialsToSave);
        localStorage.setItem('savedCredentials', JSON.stringify(credentialsToSave));
        console.log('Credentials saved to localStorage');
        sessionStorage.removeItem('isTemporarySession');
      } else {
        // Clear any existing saved credentials if Remember Me is unchecked
        console.log('Remember Me not checked, clearing saved credentials');
        localStorage.removeItem('savedCredentials');
        sessionStorage.setItem('isTemporarySession', 'true');
      }

      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      // Clear any existing saved credentials on login failure
      localStorage.removeItem('savedCredentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    
    // If Remember Me is unchecked, clear saved credentials
    if (name === 'rememberMe' && !checked) {
      localStorage.removeItem('savedCredentials');
    }
    
    // Mark field as touched when user types
    if (name !== 'rememberMe') {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  };

  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  if (isChecking) {
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
    <Box sx={{
      minHeight: '100vh',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: '#F5F5F5',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
      pt: { xs: 0, sm: 0 }
    }}>
      <Box sx={{ 
        width: { xs: '100%', sm: '400px' },
        mx: 'auto',
        p: { xs: 1, sm: 2 },
        px: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        mt: { xs: -4, sm: 0 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Logo */}
          <Box sx={{ mb: 1 }}>
            <Image
              src="/logo.png"
              alt="Look Unto Christ"
              width={120}
              height={120}
              priority
            />
          </Box>

          {/* Portal Text and Year */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 2
          }}>
            <Typography sx={{
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: { xs: '48px', sm: '56px' },
              lineHeight: 1,
              letterSpacing: '0.012em',
              color: '#006184',
              mb: 1,
              textAlign: 'center'
            }}>
              fsy portal
            </Typography>

            <Typography sx={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: { xs: '32px', sm: '40px' },
              lineHeight: 1.2,
              letterSpacing: '-0.012em',
              color: '#006184',
              textAlign: 'center'
            }}>
              2025
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', height: '100%', marginBottom: '50px' }}>
            {/* Username Field */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Username *
              </Typography>
              <TextField
                required
                fullWidth
                name="username"
                placeholder="Email or Phone Number"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={touched.username && !formData.username}
                helperText={touched.username && !formData.username ? 'Username is required' : 'Enter your email or phone number'}
                variant="outlined"
                size="small"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Password *
              </Typography>
              <TextField
                required
                fullWidth
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={touched.password && !formData.password}
                helperText={touched.password && !formData.password ? 'Password is required' : 'Enter your password'}
                variant="outlined"
                size="small"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />
            </Box>

            {/* Remember Me */}
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  size="small"
                  disabled={isLoading}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.875rem' }}>
                  Remember Me
                </Typography>
              }
              sx={{ mb: 2 }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                bgcolor: '#006D91',
                color: 'white',
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: '#005d7a'
                }
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 