import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { getCurrentDateTimeInPH } from '@/utils/dateTimeUtils';

interface UserInfo {
  id: number;
  name: string;
  type: string;
}

const CoordinatorDashboard = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(getCurrentDateTimeInPH());

  useEffect(() => {
    // Get user info from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUserInfo(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDateTimeInPH());
    }, 1000);

    setIsLoading(false);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Coordinator Dashboard
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Welcome, {userInfo?.name || 'Coordinator'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                Current Time: {currentTime.toLocaleTimeString()}
              </Typography>
              <Typography variant="body1">
                Current Date: {currentTime.toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Coordinator Tools
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                This dashboard is under development. More features will be added soon.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CoordinatorDashboard; 