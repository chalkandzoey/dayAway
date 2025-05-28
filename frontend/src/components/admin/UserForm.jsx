// src/components/admin/UserForm.jsx
import React, { useState, useEffect } from 'react';
// ... (keep existing MUI imports and DatePicker import)
import Button from '@mui/material/Button';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// ... (keep formatDateForApi and parseDateFromApi helper functions) ...
function formatDateForApi(dateObject) {
  if (!dateObject || !(dateObject instanceof Date) || isNaN(dateObject.valueOf())) {
    return null;
  }
  const year = dateObject.getFullYear();
  const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObject.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function parseDateFromApi(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
        const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
        if (!isNaN(date.valueOf())) return date;
    }
    return null;
}


// Add apiError prop, rename local formError to clientFormError for clarity
function UserForm({ initialUser, onSubmit, onCancel, allUsers = [], isLoading = false, apiError }) {
  const isEditing = !!initialUser;

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employmentStartDate, setEmploymentStartDate] = useState(null);
  const [managerId, setManagerId] = useState('');
  const [annualLeaveAccrualRate, setAnnualLeaveAccrualRate] = useState('1.75');
  const [isAdmin, setIsAdmin] = useState(false);

  const [clientFormError, setClientFormError] = useState(''); // For client-side validation errors

  useEffect(() => {
    if (isEditing && initialUser) {
      setEmployeeId(initialUser.employeeId || '');
      setName(initialUser.name || '');
      setEmail(initialUser.email || '');
      setPassword('');
      setConfirmPassword('');
      setEmploymentStartDate(parseDateFromApi(initialUser.employmentStartDate));
      setManagerId(initialUser.managerId || '');
      setAnnualLeaveAccrualRate(initialUser.annualLeaveAccrualRate !== undefined ? String(initialUser.annualLeaveAccrualRate) : '1.75');
      setIsAdmin(!!initialUser.isAdmin);
    } else {
      setEmployeeId('');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setEmploymentStartDate(null);
      setManagerId('');
      setAnnualLeaveAccrualRate('1.75');
      setIsAdmin(false);
    }
    setClientFormError(''); // Clear client error when form re-initializes
  }, [initialUser, isEditing]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setClientFormError(''); // Clear previous client errors

    // Client-side validation
    if (!isEditing && (!employeeId || !password)) { setClientFormError('Employee ID and Password are required for new users.'); return; }
    if (!name || !email || !employmentStartDate || annualLeaveAccrualRate === '') { setClientFormError('Name, Email, Start Date, and Accrual Rate are required.'); return; }
    if (!isEditing && password !== confirmPassword) { setClientFormError('Passwords do not match.'); return; }
    if (!isEditing && password.length < 6) { setClientFormError('Password must be at least 6 characters long.'); return; }
    const accrualRateNum = parseFloat(annualLeaveAccrualRate);
    if (isNaN(accrualRateNum) || accrualRateNum < 0) { setClientFormError('Accrual rate must be a non-negative number.'); return; }

    const formattedEmploymentStartDate = formatDateForApi(employmentStartDate);
    if (!formattedEmploymentStartDate) { setClientFormError('Invalid Employment Start Date.'); return; }

    const userData = { /* ... (existing userData setup) ... */
        name, email, employmentStartDate: formattedEmploymentStartDate,
        managerId: managerId || null, annualLeaveAccrualRate: accrualRateNum, isAdmin,
    };
    if (!isEditing) { userData.employeeId = employeeId; userData.password = password; }

    onSubmit(userData, isEditing); // This now calls handleFormSubmit in AdminPage
  };

  // Determine which error to display (API error takes precedence)
  const displayError = apiError || clientFormError;

  return (
    <Dialog open={true} onClose={onCancel} aria-labelledby="user-form-dialog-title" fullWidth maxWidth="sm">
      <DialogTitle id="user-form-dialog-title">{isEditing ? 'Edit Employee' : 'Create New Employee'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* ... (Keep all TextField, Select, FormControlLabel components as they were) ... */}
          <TextField margin="normal" required={!isEditing} fullWidth id="employeeId" label="Employee ID" name="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={isEditing || isLoading} autoFocus={!isEditing} />
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} autoFocus={isEditing && !initialUser?.name} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          {!isEditing && ( <> <TextField margin="normal" required fullWidth name="password" label="Password (min 6 chars)" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} /> <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} /> </> )}
          <Box sx={{ my: 2 }}> <DatePicker label="Employment Start Date" value={employmentStartDate} onChange={(newValue) => setEmploymentStartDate(newValue)} disabled={isLoading} slotProps={{ textField: { fullWidth: true, required: true, margin: 'normal', error: (!employmentStartDate && !!clientFormError.includes('Start Date')), helperText: (!employmentStartDate && !!clientFormError.includes('Start Date')) ? 'Start date is required' : '' } }} /> </Box>
          <FormControl fullWidth margin="normal"> <InputLabel id="managerId-label">Manager</InputLabel> <Select labelId="managerId-label" id="managerId" value={managerId} label="Manager" onChange={(e) => setManagerId(e.target.value)} disabled={isLoading} > <MenuItem value=""><em>-- No Manager --</em></MenuItem> {allUsers .filter(u => !initialUser || u.employeeId !== initialUser.employeeId) .map(u => ( <MenuItem key={u.employeeId} value={u.employeeId}> {u.name} ({u.employeeId}) </MenuItem> ))} </Select> </FormControl>
          <TextField margin="normal" required fullWidth id="annualLeaveAccrualRate" label="Annual Leave Accrual Rate (days/month)" type="number" value={annualLeaveAccrualRate} onChange={(e) => setAnnualLeaveAccrualRate(e.target.value)} inputProps={{ step: "0.01", min: "0" }} disabled={isLoading} />
          <FormControlLabel control={ <Checkbox checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} disabled={isLoading} color="primary" /> } label="Is Administrator?" sx={{ mt:1, mb:1 }} />

          {/* Display error (API error or client-side error) */}
          {displayError && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {displayError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onCancel} disabled={isLoading} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null} >
          {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Employee' : 'Create Employee')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserForm;