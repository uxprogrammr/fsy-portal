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
  ListItem
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

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

  const startScanner = () => {
    if (!selectedEvent) {
      setSnackbar({
        open: true,
        message: 'Please select an event first',
        severity: 'warning'
      });
      return;
    }

    setIsScanning(true);

    // Wait for the next render cycle to ensure the element exists
    setTimeout(() => {
      if (qrReaderRef.current) {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scannerRef.current = scanner;
        scanner.render(onScanSuccess, onScanFailure);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
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
      stopScanner();

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
        message: 'Invalid QR code data',
        severity: 'error'
      });
      stopScanner();
    }
  };

  const onScanFailure = (error: string) => {
    // Handle scan failure silently
    console.warn(`QR Code scan failed: ${error}`);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5', py: 4 }}>
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
          {searchResults.length > 0 && (
            <Paper 
              sx={{ 
                mt: 2, 
                p: 2,
                maxHeight: '400px',
                overflow: 'auto'
              }}
            >
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
            </Paper>
          )}
        </Paper>
      </Container>

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