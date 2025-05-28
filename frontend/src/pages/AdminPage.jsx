// src/pages/AdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminListUsers, adminCreateUser, adminUpdateUser } from '../services/apiService';
import UserList from '../components/admin/UserList';
import UserForm from '../components/admin/UserForm';
import HolidayImportForm from '../components/admin/HolidayImportForm'; // <<<--- IMPORT HolidayImportForm

// Import MUI components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import Paper from '@mui/material/Paper'; // For distinct sections
import Divider from '@mui/material/Divider'; // For separating sections

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [pageError, setPageError] = useState('');

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [userFormApiError, setUserFormApiError] = useState('');

  const fetchUsers = useCallback(async () => {
    // ... (keep existing fetchUsers function) ...
    setIsLoadingUsers(true);
    setPageError('');
    try {
      const data = await adminListUsers();
      setUsers(data);
    } catch (err) {
      setPageError(err.message || 'Failed to fetch users.');
      console.error("AdminPage fetchUsers error:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleCreateUser = () => {
    // ... (keep existing handleCreateUser function) ...
    setEditingUser(null);
    setUserFormApiError('');
    setShowUserForm(true);
  };

  const handleEditUser = (userToEdit) => {
    // ... (keep existing handleEditUser function) ...
    setEditingUser(userToEdit);
    setUserFormApiError('');
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    // ... (keep existing handleCloseForm function) ...
    setShowUserForm(false);
    setEditingUser(null);
    setUserFormApiError('');
  };

  const handleFormSubmit = async (formData, isEditingMode) => {
    // ... (keep existing handleFormSubmit function) ...
    setIsFormSubmitting(true);
    setUserFormApiError('');
    try {
      let successMessage = '';
      if (isEditingMode && editingUser) {
        await adminUpdateUser(editingUser.employeeId, formData);
        successMessage = 'User updated successfully!';
      } else {
        await adminCreateUser(formData);
        successMessage = 'User created successfully!';
      }
      handleCloseForm();
      fetchUsers();
      alert(successMessage);
    } catch (err) {
      setUserFormApiError(err.message || `Failed to ${isEditingMode ? 'update' : 'create'} user.`);
      console.error("AdminPage handleFormSubmit error:", err);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  if (!user?.isAdmin) {
    return ( <Container maxWidth="sm" sx={{mt: 4, textAlign: 'center'}}> <Alert severity="error">You do not have permission to view this page.</Alert> </Container> );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Administrator Panel
      </Typography>

      {/* User Management Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Create New User
          </Button>
        </Box>
        {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}
        {isLoadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <UserList users={users} onEditUser={handleEditUser} />
        )}
      </Paper>

      {/* Separator */}
      <Divider sx={{ my: 4 }} />

      {/* --- Public Holiday Management Section --- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Public Holiday Management
        </Typography>
        <HolidayImportForm /> {/* <<<--- RENDER THE HOLIDAY IMPORT FORM */}
        {/* TODO: Add a way to view/delete existing holidays later */}
      </Paper>
      {/* --- END OF HOLIDAY SECTION --- */}


      {/* UserForm Dialog (Modal) */}
      {showUserForm && (
        <UserForm
          initialUser={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
          allUsers={users}
          isLoading={isFormSubmitting}
          apiError={userFormApiError}
        />
      )}

      {/* Add more admin sections here later (e.g., Leave Type Config, System Settings) */}

    </Container>
  );
}

export default AdminPage;