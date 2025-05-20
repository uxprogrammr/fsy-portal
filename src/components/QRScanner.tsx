import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  IconButton, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  SelectChangeEvent,
  AppBar,
  Toolbar
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Event {
  event_id: number;
  event_name: string;
  day_number: number;
  start_time: string;
  end_time: string;
  description: string | null;
  attendance_required: string;
  status: 'past' | 'ongoing' | 'upcoming';
}

interface Participant {
  fsy_id: number;
  name: string;
  stake: string;
  unit: string;
  attendance_status: string;
}

const QRScanner = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    participant: Participant | null;
  }>({
    open: false,
    participant: null
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const [permissionDialog, setPermissionDialog] = useState({
    open: false,
    message: 'This app needs camera access to scan QR codes. Would you like to allow camera access?'
  });
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }
      
      setEvents(data.data);
      
      // Set default event to current event
      const currentEvent = data.data.find((event: Event) => event.status === 'ongoing');
      if (currentEvent) {
        setSelectedEvent(currentEvent);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch events',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (eventId: number) => {
    const event = events.find(e => e.event_id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedEvent) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search-participants?query=${encodeURIComponent(searchQuery)}&event_id=${selectedEvent.event_id}`,
        {
          credentials: 'include'
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search participants');
      }
      
      const results = data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching participants:', error);
      setSnackbar({
        open: true,
        message: 'Failed to search participants',
        severity: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAttendance = async (participant: Participant) => {
    if (!selectedEvent) {
      setSnackbar({
        open: true,
        message: 'Please select an event first',
        severity: 'warning'
      });
      return;
    }

    setConfirmDialog({
      open: true,
      participant
    });
  };

  const handleConfirmAttendance = async () => {
    if (!confirmDialog.participant || !selectedEvent) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: selectedEvent.event_id,
          fsy_id: confirmDialog.participant.fsy_id,
          attendance_status: 'Present'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add attendance');
      }
      
      setSnackbar({
        open: true,
        message: 'Attendance recorded successfully',
        severity: 'success'
      });
      
      // Clear search results and close dialog
      setSearchResults([]);
      setSearchQuery('');
      setConfirmDialog({ open: false, participant: null });
    } catch (error) {
      console.error('Error adding attendance:', error);
      setSnackbar({
        open: true,
        message: 'Failed to record attendance',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const checkMediaDevicesSupport = () => {
    // Check if we're in a secure context
    if (!window.isSecureContext) {
      setSnackbar({
        open: true,
        message: 'Camera access requires a secure context (HTTPS or localhost). Please access the app via localhost.',
        severity: 'error'
      });
      return false;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices) {
      setSnackbar({
        open: true,
        message: 'MediaDevices API is not supported in this browser. Please use a modern browser.',
        severity: 'error'
      });
      return false;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices.getUserMedia) {
      setSnackbar({
        open: true,
        message: 'getUserMedia is not supported in this browser. Please use a modern browser.',
        severity: 'error'
      });
      return false;
    }

    return true;
  };

  const getCameras = async () => {
    try {
      if (!checkMediaDevicesSupport()) {
        setIsScanning(false);
        return;
      }

      // First request camera permission with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true  // Start with basic video constraints
      });

      // Now enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras found');
      }
      
      setCameras(videoDevices);
      
      // Select the back camera by default if available
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId || '';
      setSelectedCamera(selectedDeviceId);

      // Stop the initial permission stream
      stream.getTracks().forEach(track => track.stop());
      
      // Close permission dialog if it was open
      setPermissionDialog(prev => ({ ...prev, open: false }));
      
      // Set camera permission as granted
      setHasCameraPermission(true);

      // Initialize QR code scanner
      if (qrReaderRef.current) {
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        };

        try {
          await html5QrCode.start(
            { facingMode: "environment" },  // Try to use the back camera
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (err) {
          console.error('Error starting QR scanner:', err);
          throw err;
        }
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            setPermissionDialog({
              open: true,
              message: 'Camera access was denied. Please allow camera access in your browser settings to use the QR scanner.'
            });
            break;
          case 'NotFoundError':
            setSnackbar({
              open: true,
              message: 'No camera found. Please connect a camera and try again.',
              severity: 'error'
            });
            break;
          case 'NotReadableError':
            setSnackbar({
              open: true,
              message: 'Camera is in use by another application. Please close other apps using the camera and try again.',
              severity: 'error'
            });
            break;
          default:
            setSnackbar({
              open: true,
              message: `Camera error: ${error.message}. Please try again.`,
              severity: 'error'
            });
        }
      } else if (error instanceof Error && error.message === 'No cameras found') {
        setSnackbar({
          open: true,
          message: 'No cameras found. Please connect a camera and try again.',
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to access camera. Please check your camera connection and try again.',
          severity: 'error'
        });
      }
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    if (!selectedEvent) {
      setSnackbar({
        open: true,
        message: 'Please select an event first',
        severity: 'warning'
      });
      return;
    }

    setIsScanning(true);
    
    // Only show permission dialog if we haven't gotten permission yet
    if (!hasCameraPermission) {
      setPermissionDialog({
        open: true,
        message: 'This app needs camera access to scan QR codes. Would you like to allow camera access?'
      });
    } else {
      // If we already have permission, start the scanner directly
      await getCameras();
    }
  };

  const handlePermissionResponse = async (allowed: boolean) => {
    setPermissionDialog(prev => ({ ...prev, open: false }));
    
    if (allowed) {
      try {
        await getCameras();
      } catch (error) {
        console.error('Error starting scanner:', error);
        setSnackbar({
          open: true,
          message: 'Failed to start scanner. Please try again.',
          severity: 'error'
        });
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
      setSnackbar({
        open: true,
        message: 'Camera access is required to use the QR scanner',
        severity: 'warning'
      });
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      // Parse the QR code data
      const qrData = JSON.parse(decodedText);
      
      // Validate the QR code data structure
      if (!qrData.fsy_id || !qrData.name) {
        throw new Error('Invalid QR code data');
      }

      // Stop the scanner
      await stopScanner();

      // Check if participant already has attendance for this event
      const response = await fetch(
        `/api/search-participants?query=${encodeURIComponent(qrData.name)}&event_id=${selectedEvent?.event_id}`,
        {
          credentials: 'include'
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check attendance');
      }

      const results = data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
      const existingAttendance = results.find((p: Participant) => p.fsy_id === qrData.fsy_id);

      if (existingAttendance && existingAttendance.attendance_status !== 'Not Set') {
        setSnackbar({
          open: true,
          message: `${qrData.name} is already marked as ${existingAttendance.attendance_status} for this event`,
          severity: 'info'
        });
        return;
      }

      // Add attendance for the scanned participant
      await handleAddAttendance({
        fsy_id: qrData.fsy_id,
        name: qrData.name,
        stake: qrData.stake,
        unit: qrData.unit,
        attendance_status: 'Not Set' // This will be updated by the API
      });

    } catch (error) {
      console.error('Error processing QR code:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Invalid QR code data',
        severity: 'error'
      });
      await stopScanner();
    }
  };

  const onScanFailure = (error: string) => {
    // Only show error for actual errors, not for "no QR code found" messages
    if (!error.includes('NotFoundException')) {
      console.warn(`QR Code scan failed: ${error}`);
      setSnackbar({
        open: true,
        message: 'Failed to scan QR code. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCameraChange = async (event: SelectChangeEvent<string>) => {
    const newCameraId = event.target.value;
    setSelectedCamera(newCameraId);
    
    // Stop current scanner
    await stopScanner();
    
    // Start new scanner with selected camera
    if (qrReaderRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      };

      try {
        await html5QrCode.start(
          { deviceId: newCameraId },
          config,
          onScanSuccess,
          onScanFailure
        );
      } catch (error) {
        console.error('Error starting QR scanner:', error);
        setSnackbar({
          open: true,
          message: 'Failed to switch camera. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F5F5F5'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#F5F5F5'
    }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#00BCD4',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <IconButton
            edge="start"
            onClick={() => router.push('/dashboard')}
            sx={{ 
              color: 'white',
              mr: 2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'white',
              fontWeight: 500,
              fontSize: '1.25rem'
            }}
          >
            QR Code Scanner
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        py: 4
      }}>
        <Container maxWidth="sm">
          {/* Event Selection */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Event</InputLabel>
              <Select
                value={selectedEvent?.event_id || ''}
                onChange={(e) => handleEventChange(Number(e.target.value))}
                label="Select Event"
              >
                {events.map((event) => (
                  <MenuItem key={event.event_id} value={event.event_id}>
                    {event.event_name} ({event.start_time} - {event.end_time})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* QR Scanner Section */}
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Scan QR Code
            </Typography>
            {!isScanning ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <IconButton
                  color="primary"
                  sx={{ fontSize: 48 }}
                  onClick={startScanner}
                >
                  <QrCodeScannerIcon sx={{ fontSize: 48 }} />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
                {cameras.length > 0 && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                      value={selectedCamera}
                      onChange={handleCameraChange}
                      size="small"
                    >
                      {cameras.map((camera) => (
                        <MenuItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <div ref={qrReaderRef} id="qr-reader" style={{ width: '100%' }}></div>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={stopScanner}
                  sx={{ mt: 2 }}
                >
                  Stop Scanner
                </Button>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              {isScanning ? 'Scanning for QR code...' : 'Click to scan participant\'s QR code'}
            </Typography>
          </Paper>

          {/* Search Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Participant
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                disabled={isSearching}
              />
              <IconButton
                color="primary"
                onClick={handleSearch}
                disabled={isSearching}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                {isSearching ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SearchIcon />
                )}
              </IconButton>
            </Box>

            {/* Search Results */}
            {searchQuery && !isSearching && (
              <Paper 
                sx={{ 
                  mt: 2, 
                  p: 2
                }}
              >
                {searchResults.length > 0 ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Search Results
                    </Typography>
                    <List>
                      {searchResults.map((participant) => (
                        <ListItem
                          key={participant.fsy_id}
                          divider
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1
                          }}
                        >
                          <Typography variant="subtitle1">
                            {participant.name}
                          </Typography>
                          {participant.attendance_status === 'Not Set' ? (
                            <IconButton
                              color="primary"
                              onClick={() => handleAddAttendance(participant)}
                              disabled={isSaving}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: 'action.disabledBackground',
                                  color: 'action.disabled'
                                }
                              }}
                            >
                              {isSaving ? (
                                <CircularProgress size={24} color="inherit" />
                              ) : (
                                <AddIcon />
                              )}
                            </IconButton>
                          ) : (
                            <Chip
                              label={participant.attendance_status}
                              color={
                                participant.attendance_status === 'Present' ? 'success' :
                                participant.attendance_status === 'Absent' ? 'error' :
                                'default'
                              }
                              size="small"
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 3,
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body1" gutterBottom>
                      No participants found
                    </Typography>
                    <Typography variant="body2">
                      Try searching with a different name
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, participant: null })}
      >
        <DialogTitle>Confirm Attendance</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark attendance for{' '}
            <strong>{confirmDialog.participant?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Event: {selectedEvent?.event_name}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, participant: null })}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAttendance}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Camera Permission Dialog */}
      <Dialog
        open={permissionDialog.open}
        onClose={() => handlePermissionResponse(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CameraAltIcon color="primary" />
            Camera Access Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {permissionDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handlePermissionResponse(false)}>
            Deny
          </Button>
          <Button 
            onClick={() => handlePermissionResponse(true)}
            variant="contained"
            color="primary"
          >
            Allow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default QRScanner; 