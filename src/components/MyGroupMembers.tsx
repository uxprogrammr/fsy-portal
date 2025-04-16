import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress, Container, Avatar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentDateTimeInPH, formatDateTimeInPH } from '../utils/dateTimeUtils';

interface Participant {
  fsy_id: number;
  first_name: string;
  last_name: string;
  stake_name: string;
  unit_name: string;
  company_name: string;
  group_name: string;
}

interface UserInfo {
  data: {
    id: number;
    full_name: string;
    stake_name: string;
    unit_name: string;
    company_id: number;
    company_name: string;
    group_name: string;
  };
}

export default function MyGroupMembers() {
  const router = useRouter();
  const params = useSearchParams();
  const [currentDateTime, setCurrentDateTime] = useState<Date>(getCurrentDateTimeInPH());
  const [members, setMembers] = useState<Participant[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeInPH());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!params) {
      router.push('/dashboard');
      return;
    }

    const fetchMembers = async () => {
      try {
        const groupId = params.get('group_id');
        if (!groupId) {
          console.error('No group ID provided');
          router.push('/dashboard');
          return;
        }

        // Get user info from localStorage
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(savedUser);
        
        // Fetch user info to get company_id
        const userResponse = await fetch(`/api/user-info?userId=${userData.id}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user info');
        }
        const userInfoData = await userResponse.json();
        setUserInfo(userInfoData);

        // Fetch all members for the company and group using event_id=0
        const response = await fetch(
          `/api/participants?event_id=0&company_id=${userInfoData.data.company_id}&group_id=${groupId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch group members');
        }

        const data = await response.json();
        console.log('Fetched members data:', data);  // Debug log
        setMembers(data.participants || []);
      } catch (error) {
        console.error('Error fetching group members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [router, params]);

  const getInitials = (first_name: string, last_name: string) => {
    if (!first_name || !last_name) return '';  // Return empty string if name is undefined or null
    return (first_name[0] + last_name[0]).toUpperCase(); // Return the first letter of first name and last name combined
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      overflow: 'auto',
      bgcolor: '#F8F9FA',
      pb: 10
    }}>
      {/* Header */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: 'inherit'
      }}>
        {/* Title Section */}
        <Box sx={{ 
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
            My Group
          </Typography>
        </Box>
      </Box>
        
      {/* Company and Group Info */}
      <Box sx={{ 
        p: 2,
        display: 'flex', 
        justifyContent: 'space-between',
        bgcolor: 'white'
      }}>
        <Typography color="text.secondary" sx={{ textAlign: 'left' }}>
          {userInfo?.data.company_name || 'No Company'}
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'right' }}>
          {userInfo?.data.group_name || 'No Group'}
        </Typography>
      </Box>

      {/* Members Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Members
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {members.map((member) => (
            <Box
              key={member.fsy_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                bgcolor: 'white',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#f5f5f5'
                }
              }}
              onClick={() => router.push(`/member-details?fsyId=${member.fsy_id}`)}
            >
              <Avatar sx={{ bgcolor: '#E2E8F0', color: '#64748B', width: 40, height: 40 }}>
                {getInitials(member.first_name, member.last_name)}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                  {member.first_name + ' ' + member.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {member.stake_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {member.unit_name}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 