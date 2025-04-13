'use client';

import React, { useState } from 'react';
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
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    password: false
  });

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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loginData = data as LoginResponse;
      
      if (formData.rememberMe) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: '#F5F5F5'
    }}>
      <Box sx={{ 
        width: { xs: '100%', sm: '400px' },
        mx: 'auto',
        p: { xs: 2, sm: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <Image
              src="/logo.png"
              alt="Look Unto Christ"
              width={90}
              height={90}
              priority
            />
          </Box>

          {/* Portal Text and Year */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 3
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
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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