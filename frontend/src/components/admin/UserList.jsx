// src/components/admin/UserList.jsx
import React from 'react';

// Import MUI components
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography'; // For "No users found" message

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

function UserList({ users = [], onEditUser }) {
  if (!users.length) {
    return <Typography sx={{ mt: 2, textAlign: 'center' }}>No users found.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }} elevation={3}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Manager Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Admin</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Accrual Rate</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.employeeId}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {user.employeeId}
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.managerName || 'N/A'}</TableCell>
              <TableCell align="center">{user.isAdmin ? 'Yes' : 'No'}</TableCell>
              <TableCell align="right">{user.annualLeaveAccrualRate}</TableCell>
              <TableCell>{formatDate(user.employmentStartDate)}</TableCell>
              <TableCell align="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onEditUser(user)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default UserList;