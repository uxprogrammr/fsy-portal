'use client';

import React from 'react';
import { Box, Typography, IconButton, Avatar, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import { useRouter, useSearchParams } from 'next/navigation';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';

interface MemberInfo {
  fsy_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
  company_name: string;
  group_name: string;
  room_name: string;
}

export default function MemberDetails() {
  const router = useRouter();
  const params = useSearchParams();
  const [memberInfo, setMemberInfo] = React.useState<MemberInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  const handleDownloadCertificate = async () => {
    if (!memberInfo) return;
    try {
      setDownloading(true);
      const certificateName = `${memberInfo.first_name} ${memberInfo.last_name}`;
      const certificateRef = ref(storage, `certificates/${certificateName}.pdf`);
      const downloadURL = await getDownloadURL(certificateRef);

      // Open the file in a new tab to avoid white screen and allow download
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again later.');
    } finally {
      setDownloading(false);
    }
  };

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
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        <IconButton 
          onClick={handleHomeClick}
          sx={{ color: 'white' }}
        >
          <HomeIcon />
        </IconButton>
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

      {/* Download Certificate Button */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadCertificate}
          disabled={downloading}
          sx={{
            bgcolor: '#00BCD4',
            '&:hover': {
              bgcolor: '#0097A7'
            }
          }}
        >
          {downloading ? 'Downloading...' : 'Download Certificate'}
        </Button>
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
          <DetailItem label="Company Name" value={memberInfo.company_name} />
          <DetailItem label="Group Name" value={memberInfo.group_name} />
          <DetailItem label="Room Name" value={memberInfo.room_name} />
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