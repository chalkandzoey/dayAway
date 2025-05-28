// src/components/admin/HolidayImportForm.jsx
import React, { useState } from 'react';
import { adminImportHolidaysCsv } from '../../services/apiService';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'; // Though not directly used, common to have TextFields in forms
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function HolidayImportForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // Stores { message, imported, updated, processingErrors, databaseErrors }
  const [uploadError, setUploadError] = useState(''); // For general API call errors

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadResult(null); // Clear previous results
    setUploadError('');    // Clear previous errors
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    setUploadError('');

    const formData = new FormData();
    formData.append('holidayCsv', selectedFile); // 'holidayCsv' must match backend multer fieldname

    try {
      const result = await adminImportHolidaysCsv(formData);
      setUploadResult(result);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'An unknown error occurred during upload.');
    } finally {
      setIsUploading(false);
      // Optionally clear the file input after upload:
      // if (document.getElementById('holiday-csv-upload')) {
      //   document.getElementById('holiday-csv-upload').value = null;
      // }
      // setSelectedFile(null); // Or clear selectedFile state
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom component="div">
        Import Public Holidays from CSV
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        CSV format: First row as headers "Date,Name" (case-insensitive). Dates in "dd-mm-yyyy" format.
      </Typography>
      <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="holiday-csv-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="holiday-csv-upload">
          <Button variant="outlined" component="span" disabled={isUploading} sx={{mr: 1}}>
            Choose File
          </Button>
        </label>
        {selectedFile && <Typography component="span" variant="body2" sx={{ mr: 1 }}>{selectedFile.name}</Typography>}
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} color="inherit"/> : <CloudUploadIcon />}
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </Button>
      </Box>

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}

      {uploadResult && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={uploadResult.processingErrors?.length > 0 || uploadResult.databaseErrors?.length > 0 ? "warning" : "success"}>
            {uploadResult.message}
            {uploadResult.imported !== undefined && <p>Newly Imported: {uploadResult.imported}</p>}
            {uploadResult.updated !== undefined && <p>Updated Existing: {uploadResult.updated}</p>}
          </Alert>
          {(uploadResult.processingErrors?.length > 0) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="error">Processing Errors in CSV:</Typography>
              <ul>
                {uploadResult.processingErrors.map((err, index) => (
                  <li key={`proc-err-${index}`}><Typography variant="caption" color="error">{err}</Typography></li>
                ))}
              </ul>
            </Box>
          )}
           {(uploadResult.databaseErrors?.length > 0) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="error">Database Errors during import:</Typography>
              <ul>
                {uploadResult.databaseErrors.map((err, index) => (
                  <li key={`db-err-${index}`}><Typography variant="caption" color="error">{err}</Typography></li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default HolidayImportForm;