// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getLeaveTypes,
  getMyBalances,
  getMyLeaveHistory,
  getPendingTeamRequests,
  decideRequest
} from '../services/apiService';
import ApplyLeaveForm from '../components/ApplyLeaveForm';

// Import MUI components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Helper function to format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`; // DD/MM/YYYY
  } catch (e) {
      return dateString;
  }
};

// Moved style objects outside the component
const tableCellStyle = {
    borderBottom: '1px solid rgba(224, 224, 224, 1)',
    padding: '8px 16px',
    textAlign: 'left'
};

const tableHeaderStyle = {
    ...tableCellStyle, // Inherit base styles
    fontWeight: 'bold',
    backgroundColor: 'action.hover' // Using theme's hover color
};


function DashboardPage() {
  const { user, logout } = useAuth(); // Get user from context

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [managerActionError, setManagerActionError] = useState('');
  const [managerLoading, setManagerLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // fetchDashboardData is memoized with an empty dependency array for stable reference.
  // It accesses the 'user' object from the component's scope via closure for the isManager check.
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    setManagerActionError('');
    console.log("--- DBD V4: Starting fetchDashboardData ---", user); // Renamed log slightly

    let fetchedLeaveTypesData = [];
    let fetchedBalancesData = [];
    let fetchedHistoryData = [];
    let fetchedPendingRequestsData = [];
    let currentError = null;

    try {
      console.log("--- DBD V4: 1. Attempting getLeaveTypes ---");
      fetchedLeaveTypesData = await getLeaveTypes();
      console.log("--- DBD V4: 1. getLeaveTypes SUCCESS:", fetchedLeaveTypesData);
      setLeaveTypes(fetchedLeaveTypesData || []);

      if (user && !currentError) {
          console.log("--- DBD V4: 2. Attempting getMyBalances ---");
          try {
              fetchedBalancesData = await getMyBalances();
              console.log("--- DBD V4: 2. getMyBalances SUCCESS (raw from API):", JSON.stringify(fetchedBalancesData, null, 2));
              setBalances(fetchedBalancesData || []);
          } catch (e) {
              console.error("--- DBD V4: 2. getMyBalances FAILED:", e);
              currentError = currentError || e.message || "Failed to load balances.";
              setBalances([]);
          }
      }

      if (user && !currentError) {
          console.log("--- DBD V4: 3. Attempting getMyLeaveHistory ---");
          try {
              fetchedHistoryData = await getMyLeaveHistory();
              console.log("--- DBD V4: 3. getMyLeaveHistory SUCCESS:", fetchedHistoryData);
              setHistory(fetchedHistoryData || []);
          } catch (e) {
              console.error("--- DBD V3: 3. getMyLeaveHistory FAILED:", e); // Corrected log prefix
              currentError = currentError || e.message || "Failed to load history.";
              setHistory([]);
          }
      }
      
      if (user?.isManager && !currentError) {
        console.log("--- DBD V4: 4. Attempting getPendingTeamRequests (as manager) ---");
        try {
          fetchedPendingRequestsData = await getPendingTeamRequests();
          console.log("--- DBD V4: 4. getPendingTeamRequests SUCCESS:", fetchedPendingRequestsData);
          setPendingRequests(fetchedPendingRequestsData || []);
        } catch (e) {
          console.error("--- DBD V4: 4. getPendingTeamRequests FAILED (as manager):", e);
          if (e.message && !e.message.toLowerCase().includes('forbidden')) {
              currentError = currentError || e.message || "Failed to load pending requests.";
          } else {
              console.log("--- DBD V4: Fetching pending team requests forbidden/errored (as manager):", e.message);
          }
          setPendingRequests([]);
        }
      } else if (!user?.isManager) {
          console.log("--- DBD V4: 4. Skipping getPendingTeamRequests (not a manager or user is null) ---");
          setPendingRequests([]);
      }

      if (currentError) {
        setPageError(currentError);
      }
      console.log("--- DBD V4: All API calls attempted, state updates done (or errors handled) ---");

    } catch (err) { 
      // This primary catch is if any of the awaits throws an error that bubbles up
      console.error("--- DBD V4: CRITICAL Error in fetchDashboardData (one of the awaits failed directly):", err);
      setPageError(err.message || 'Failed to load some dashboard data.');
      setLeaveTypes([]); setBalances([]); setHistory([]); setPendingRequests([]);
    } finally {
      // This finally block for fetchDashboardData itself MUST execute
      console.log("--- DBD V4: fetchDashboardData's OWN finally block reached ---");
      setLoading(false);
    }
  }, [user]); // Keep user as dependency as logic inside (user?.isManager) uses it

  // The useEffect that calls it
  useEffect(() => {
    if (user) {
      console.log("useEffect for [user, fetchDashboardData]: User available, calling fetchDashboardData...", user);
      fetchDashboardData(); // No need for .finally here as fetchDashboardData handles its own setLoading(false)
    } else {
      console.log("useEffect for [user, fetchDashboardData]: No user, clearing data, setLoading false.");
      setLeaveTypes([]); setBalances([]); setHistory([]); setPendingRequests([]);
      setPageError(''); setLoading(false);
    }
  }, [user, fetchDashboardData]);


  const handleLogout = async () => { try { await logout(); } catch (error) { console.error('Failed to log out:', error); setPageError('Logout failed. Please try again.'); } };
  const handleLeaveSubmitSuccess = (newRequest) => { if(user) fetchDashboardData(); };
  const handleDecision = async (requestId, approved) => { setManagerLoading(true); setManagerActionError(''); try { await decideRequest(requestId, { approved }); setPendingRequests(prevRequests => prevRequests.filter(req => req.requestId !== requestId)); if(user) fetchDashboardData(); } catch (err) { console.error(`Failed to ${approved ? 'approve' : 'deny'} request ${requestId}:`, err); setManagerActionError(err.message || `Failed to process decision for request ${requestId}.`); } finally { setManagerLoading(false); } };

  if (loading) { return ( <Container component="main" maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container> ); }
  
  if (!user) { 
    return <Typography variant="h6" align="center" sx={{ mt: 4 }}>Please log in.</Typography>; 
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" gutterBottom>Dashboard</Typography>
        <Box>
          <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={() => setShowApplyModal(true)} sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}>Apply for Leave</Button>
          <Button variant="outlined" onClick={handleLogout}>Logout ({user.name})</Button>
        </Box>
      </Box>

      {showApplyModal && ( <ApplyLeaveForm leaveTypes={leaveTypes} balances={balances} onClose={() => setShowApplyModal(false)} onSubmitSuccess={handleLeaveSubmitSuccess} /> )}
      
      {pageError && !loading && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}

      {user.isManager && (
        <Paper sx={{ mb: 3, p: 2 }} elevation={3}>
          <Typography variant="h5" component="h2" gutterBottom>Pending Team Requests</Typography>
          {managerActionError && <Alert severity="error" sx={{ mb: 1 }}>{managerActionError}</Alert>}
          {pendingRequests.length > 0 ? (
            <TableContainer>
              <Table size="small" aria-label="pending team requests table">
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={tableHeaderStyle}>Employee</TableCell>
                    <TableCell sx={tableHeaderStyle}>Type</TableCell>
                    <TableCell sx={tableHeaderStyle}>Start</TableCell>
                    <TableCell sx={tableHeaderStyle}>End</TableCell>
                    <TableCell sx={tableHeaderStyle} align="right">Days</TableCell>
                    <TableCell sx={tableHeaderStyle}>Submitted</TableCell>
                    <TableCell sx={tableHeaderStyle}>Notes</TableCell>
                    <TableCell sx={tableHeaderStyle} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map(request => (
                    <TableRow hover key={request.requestId}>
                      <TableCell sx={tableCellStyle}>{request.employeeName}</TableCell>
                      <TableCell sx={tableCellStyle}>{request.leaveTypeName}</TableCell>
                      <TableCell sx={tableCellStyle}>{formatDate(request.startDate)} {request.isStartHalfDay ? '(Half)' : ''}</TableCell>
                      <TableCell sx={tableCellStyle}>{formatDate(request.endDate)} {request.isEndHalfDay ? '(Half)' : ''}</TableCell>
                      <TableCell sx={tableCellStyle} align="right">{request.calculatedDurationDays}</TableCell>
                      <TableCell sx={tableCellStyle}>{formatDate(request.submissionDate)}</TableCell>
                      <TableCell sx={tableCellStyle} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.notes}</TableCell>
                      <TableCell sx={tableCellStyle} align="center">
                        <IconButton size="small" color="success" onClick={() => handleDecision(request.requestId, true)} disabled={managerLoading} title="Approve"><CheckCircleIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDecision(request.requestId, false)} disabled={managerLoading} title="Deny"><CancelIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
             !loading && <Typography variant="body1">No pending team requests to display.</Typography>
          )}
        </Paper>
      )}

      <Paper sx={{ mb: 3, p: 2 }} elevation={3}>
        <Typography variant="h5" component="h2" gutterBottom>Your Leave Balances</Typography>
        {balances.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {balances.map(balance => {
              console.log("Rendering balance item:", balance); // Log each item
              return (
                <Paper key={balance.leaveTypeId} sx={{ p: 2, minWidth: 180, textAlign: 'left' }} variant="outlined">
                  <Typography variant="subtitle1" sx={{ color: balance.colorCode || 'text.primary', fontWeight: 'bold' }}>
                    {balance.name}
                  </Typography>
                  <Typography variant="h5">
                    {balance.currentBalance} days
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        ) : ( !pageError && !loading && <Typography>No balance information available.</Typography> )}
      </Paper>

      <Paper sx={{ p: 2 }} elevation={3}>
        <Typography variant="h5" component="h2" gutterBottom>Your Leave History</Typography>
        {history.length > 0 ? (
          <TableContainer>
            <Table size="small" aria-label="leave history table">
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={tableHeaderStyle}>Type</TableCell>
                  <TableCell sx={tableHeaderStyle}>Start Date</TableCell>
                  <TableCell sx={tableHeaderStyle}>End Date</TableCell>
                  <TableCell sx={tableHeaderStyle} align="right">Days</TableCell>
                  <TableCell sx={tableHeaderStyle}>Status</TableCell>
                  <TableCell sx={tableHeaderStyle}>Submitted</TableCell>
                  <TableCell sx={tableHeaderStyle}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(request => (
                  <TableRow hover key={request.requestId}>
                    <TableCell sx={tableCellStyle}>{request.leaveTypeName}</TableCell>
                    <TableCell sx={tableCellStyle}>{formatDate(request.startDate)}</TableCell>
                    <TableCell sx={tableCellStyle}>{formatDate(request.endDate)}</TableCell>
                    <TableCell sx={tableCellStyle} align="right">{request.calculatedDurationDays}</TableCell>
                    <TableCell sx={tableCellStyle}>{request.status}</TableCell>
                    <TableCell sx={tableCellStyle}>{formatDate(request.submissionDate)}</TableCell>
                    <TableCell sx={tableCellStyle} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : ( !pageError && !loading && <Typography>You haven't submitted any leave requests yet.</Typography> )}
      </Paper>
    </Container>
  );
}

export default DashboardPage;