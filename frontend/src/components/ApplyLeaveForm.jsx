// src/components/ApplyLeaveForm.jsx
import React, { useState, useEffect } from 'react';
import { applyLeave } from '../services/apiService';

// Import MUI components
import Button from '@mui/material/Button';
// TextField is still used by DatePicker under the hood for input display
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Import MUI X Date Picker
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Helper function to format Date object to 'YYYY-MM-DD' for API
function formatDateForApi(dateObject) {
    if (!dateObject || !(dateObject instanceof Date) || isNaN(dateObject.valueOf())) {
      return null; // Return null if date is invalid/null
    }
    const year = dateObject.getFullYear();
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = dateObject.getDate().toString().padStart(2, '0');
    // This is the truly corrected return statement:
    return `${year}-${month}-${day}`;
  }


function ApplyLeaveForm({ leaveTypes = [], balances = [], onClose, onSubmitSuccess }) {
  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(null); // Store as Date object or null
  const [endDate, setEndDate] = useState(null);   // Store as Date object or null
  const [isStartHalfDay, setIsStartHalfDay] = useState(false);
  const [isEndHalfDay, setIsEndHalfDay] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentBalance, setCurrentBalance] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leaveTypeId) {
      const selectedBalance = balances.find(b => b.leaveTypeId === parseInt(leaveTypeId, 10));
      setCurrentBalance(selectedBalance ? selectedBalance.currentBalance : 'N/A');
    } else {
      setCurrentBalance(null);
    }
  }, [leaveTypeId, balances]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!leaveTypeId) { setError('Please select a leave type.'); return; }
    if (!startDate || !endDate) { setError('Please select both a start and end date.'); return; }
    if (endDate < startDate) { setError('End date cannot be before start date.'); return; }

    setLoading(true);

    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);

    if (!formattedStartDate || !formattedEndDate) {
        setError('Invalid date selected.');
        setLoading(false);
        return;
    }

    const leaveData = {
      leaveTypeId: parseInt(leaveTypeId, 10),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isStartHalfDay,
      isEndHalfDay,
      notes,
    };

    try {
      const newRequest = await applyLeave(leaveData);
      console.log('Leave applied successfully:', newRequest);
      if (onSubmitSuccess) {
        onSubmitSuccess(newRequest);
      }
      onClose();
    } catch (err) {
      console.error('Failed to apply for leave:', err);
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} aria-labelledby="apply-leave-dialog-title" fullWidth maxWidth="sm">
      <DialogTitle id="apply-leave-dialog-title">Apply for Leave</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControl fullWidth margin="normal" required error={!leaveTypeId && !!error}>
            {/* ... (Leave Type Select - no changes needed) ... */}
            <InputLabel id="leaveType-label">Leave Type</InputLabel>
            <Select
              labelId="leaveType-label" id="leaveType" value={leaveTypeId} label="Leave Type"
              onChange={(e) => setLeaveTypeId(e.target.value)} disabled={loading}
            >
              <MenuItem value=""><em>-- Select Type --</em></MenuItem>
              {leaveTypes.map(lt => (
                <MenuItem key={lt.leaveTypeId} value={lt.leaveTypeId}>{lt.name}</MenuItem>
              ))}
            </Select>
            {currentBalance !== null && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    (Balance: {currentBalance} days)
                </Typography>
            )}
          </FormControl>

          {/* Start Date - Using MUI DatePicker */}
          <Box sx={{my: 2}}> {/* Add some margin for DatePicker */}
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              disabled={loading}
              slotProps={{ textField: { fullWidth: true, required: true, error: (!startDate && !!error) } }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox checked={isStartHalfDay} onChange={(e) => setIsStartHalfDay(e.target.checked)}
                disabled={loading} color="primary" />
            }
            label="Start as Half Day" sx={{ display: 'block', mb: 1 }}
          />

          {/* End Date - Using MUI DatePicker */}
           <Box sx={{my: 2}}> {/* Add some margin for DatePicker */}
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              disabled={loading}
              minDate={startDate || undefined} // Prevent selecting end date before start date
              slotProps={{ textField: { fullWidth: true, required: true, error: (!endDate && !!error) } }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox checked={isEndHalfDay} onChange={(e) => setIsEndHalfDay(e.target.checked)}
                disabled={loading} color="primary" />
            }
            label="End as Half Day" sx={{ display: 'block', mb: 1 }}
          />

          {/* Notes */}
          <TextField
            margin="normal" fullWidth id="notes" label="Notes (Optional)"
            multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
            onClick={handleSubmit} variant="contained" color="primary" disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ApplyLeaveForm;