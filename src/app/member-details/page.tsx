'use client';

import { Suspense } from 'react';
import MemberDetails from '@/components/MemberDetails';
import { CircularProgress, Box } from '@mui/material';

export default function MemberDetailsPage() {
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
      <MemberDetails />
    </Suspense>
  );
} 