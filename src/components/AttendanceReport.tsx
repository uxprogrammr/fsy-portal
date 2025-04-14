import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination
} from '@mui/material';
import { formatDateTimeInPH, formatTimeInPH } from '../utils/dateTimeUtils';

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  status: string;
}

export default function AttendanceReport() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);

  // Fetch attendance records from API
  React.useEffect(() => {
    // TODO: Implement API call to fetch attendance records
    // For now, using mock data
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        date: '2024-03-20',
        timeIn: '09:00:00',
        timeOut: '17:00:00',
        status: 'Present'
      },
      // Add more mock records as needed
    ];
    setRecords(mockRecords);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Report
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="attendance report table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="center">Time In</TableCell>
              <TableCell align="center">Time Out</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((record) => (
                <TableRow key={record.id}>
                  <TableCell component="th" scope="row">
                    {formatDateTimeInPH(new Date(record.date), { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell align="center">{formatTimeInPH(record.timeIn)}</TableCell>
                  <TableCell align="center">{formatTimeInPH(record.timeOut)}</TableCell>
                  <TableCell align="center">{record.status}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={records.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
} 