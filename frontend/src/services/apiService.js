// src/services/apiService.js

export async function loginUser(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data.user;
  } catch (error) {
    console.error("Error in loginUser API call:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (response.status === 401) return null;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error in getCurrentUser API call:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    console.log("Logout API call successful");
  } catch (error) {
    console.error("Error in logoutUser API call:", error);
    throw error;
  }
}

export async function getLeaveTypes() {
  try {
    const response = await fetch('/api/leave/types', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getLeaveTypes API call:", error);
    throw error;
  }
}

export async function getMyBalances() {
  try {
    const response = await fetch('/api/leave/balances/me', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getMyBalances API call:", error);
    throw error;
  }
}

export async function getMyLeaveHistory() {
  try {
    const response = await fetch('/api/leave/history/me', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getMyLeaveHistory API call:", error);
    throw error;
  }
}

export async function applyLeave(leaveData) {
  try {
    const response = await fetch('/api/leave/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveData),
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error("Error in applyLeave API call:", error);
    throw error;
  }
}

export async function getPendingTeamRequests() {
  try {
    const response = await fetch('/api/leave/requests/pending/my-team', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getPendingTeamRequests API call:", error);
    throw error;
  }
}

export async function decideRequest(requestId, decisionData) {
  if (!requestId || typeof decisionData?.approved !== 'boolean') {
    throw new Error("Request ID and approval status (true/false) are required.");
  }
  try {
    const response = await fetch(`/api/leave/requests/${requestId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decisionData),
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Error deciding on request ${requestId}:`, error);
    throw error;
  }
}

export async function adminListUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in adminListUsers API call:", error);
    throw error;
  }
}

export async function adminCreateUser(userData) {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error("Error in adminCreateUser API call:", error);
    throw error;
  }
}

export async function adminGetUserDetails(employeeId) {
  try {
    const response = await fetch(`/api/admin/users/${employeeId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include', // <<< ADDED
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error in adminGetUserDetails API call for ${employeeId}:`, error);
    throw error;
  }
}

export async function adminUpdateUser(employeeId, updateData) {
  try {
    const response = await fetch(`/api/admin/users/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Error in adminUpdateUser API call for ${employeeId}:`, error);
    throw error;
  }
}

export async function adminImportHolidaysCsv(formData) {
  try {
    const response = await fetch('/api/admin/holidays/import/csv', {
      method: 'POST',
      body: formData,
      credentials: 'include', // <<< ADDED
    });
    const data = await response.json();
    if (!response.ok && response.status !== 207) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error("Error in adminImportHolidaysCsv API call:", error);
    if (error.message) throw error;
    throw new Error('Failed to upload or process holiday CSV file.');
  }
}