'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, TextField, Typography, Button, Checkbox, FormControlLabel } from '@mui/material';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
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
            mb: 3
          }}>
            <Typography sx={{
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: { xs: '44px', sm: '48px' },
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
              fontSize: { xs: '28px', sm: '32px' },
              lineHeight: 1.2,
              letterSpacing: '-0.012em',
              color: '#006184',
              textAlign: 'center'
            }}>
              2025
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Username Field */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Username
              </Typography>
              <TextField
                fullWidth
                name="username"
                placeholder="Email or Phone Number"
                value={formData.username}
                onChange={handleChange}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Enter your username
              </Typography>
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Enter your password
              </Typography>
            </Box>

            {/* Remember Me */}
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  size="small"
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
              Login
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 