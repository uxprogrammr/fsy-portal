'use client';

import { Suspense } from 'react';
import MyGroupMembers from '@/components/MyGroupMembers';
import { CircularProgress, Box } from '@mui/material';

export default function MyGroupMembersPage() {
  return (
    <Suspense fallback={
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    }>
      <MyGroupMembers />
    </Suspense>
  );
} 