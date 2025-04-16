'use client';

import React from 'react';
import { Box, Typography, IconButton, Avatar, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter, useSearchParams } from 'next/navigation';

interface MemberInfo {
  fsy_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
}

export default function MemberDetails() {
  const router = useRouter();
  const params = useSearchParams();
  const [memberInfo, setMemberInfo] = React.useState<MemberInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        if (!params) {
          router.back();
          return;
        }

        const fsyId = params.get('fsyId');
        if (!fsyId) {
          router.back();
          return;
        }

        const response = await fetch(`/api/member/info?fsyId=${fsyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch member info');
        }

        const data = await response.json();
        setMemberInfo(data);
      } catch (error) {
        console.error('Error fetching member info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberInfo();
  }, [params, router]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!memberInfo) {
    return null;
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'auto', bgcolor: '#F8F9FA', pb: 10 }}>
      {/* Header */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: '#00BCD4',
        color: 'white',
        p: 1,
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconButton 
          onClick={() => router.back()}
          sx={{ color: 'white', mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">
          Member Details
        </Typography>
      </Box>

      {/* Profile Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
        bgcolor: 'white'
      }}>
        <Avatar 
          sx={{ 
            width: 120, 
            height: 120, 
            mb: 2,
            bgcolor: '#E2E8F0'
          }}
        >
          <PersonIcon sx={{ fontSize: 80 }} />
        </Avatar>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {memberInfo.first_name} {memberInfo.last_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {memberInfo.participant_type}
        </Typography>
      </Box>

      {/* Details Section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 1, overflow: 'hidden' }}>
          <DetailItem label="First Name" value={memberInfo.first_name} />
          <DetailItem label="Last Name" value={memberInfo.last_name} />
          <DetailItem label="Mobile Number" value={memberInfo.phone_number} />
          <DetailItem label="Email" value={memberInfo.email} />
          <DetailItem label="Stake Name" value={memberInfo.stake_name} />
          <DetailItem label="Unit Name" value={memberInfo.unit_name} />
        </Box>
      </Box>
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ 
      p: 2, 
      borderBottom: '1px solid #eee',
      '&:last-child': { borderBottom: 'none' }
    }}>
      <Typography color="text.secondary" variant="body2" gutterBottom>
        {label}
      </Typography>
      <Typography>
        {value || '-'}
      </Typography>
    </Box>
  );
} 