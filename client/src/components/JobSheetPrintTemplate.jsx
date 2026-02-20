import React, { forwardRef } from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';

const JobSheetPrintTemplate = forwardRef(({ item }, ref) => {
  if (!item) return null;

  // Step 1: Date Formatting
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

  // Step 2: Status Color Mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'received': return '#64748b';
      case 'in progress': return '#f59e0b';
      case 'waiting': return '#ef4444';
      case 'ready': return '#10b981';
      case 'delivered': return '#3b82f6';
      default: return '#0f172a';
    }
  };

  // Step 3: Elegant Data Row
  const DataField = ({ label, value }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 1.2,
        borderBottom: '1px solid #f1f5f9'
      }}
    >
      <Typography
        sx={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b'
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#0f172a'
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  );

  return (
    <Box
      ref={ref}
      className="print-root"
      sx={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 18mm 15mm 18mm',
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", sans-serif',
        color: '#0f172a',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',

        // Premium top accent band
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5mm',
          backgroundColor: getStatusColor(item.status),
        }
      }}
    >

      {/* HEADER */}
      <Box sx={{ mb: 5, pt: 3 }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: '30px',
            letterSpacing: '-0.5px'
          }}
        >
          ADMIN INFO <span style={{ fontWeight: 600 }}>SOLUTION</span>
        </Typography>

        <Typography
          sx={{
            fontSize: '12px',
            color: '#475569',
            mt: 1
          }}
        >
          Harippad • Chip Level Service Excellence • +91 9020448019
        </Typography>

        <Divider sx={{ mt: 3, borderColor: '#e2e8f0' }} />
      </Box>

      {/* JOB META */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          Service Job Sheet
        </Typography>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '12px', color: '#475569' }}>
            Job No: <strong>#{item.jobNumber}</strong>
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#475569' }}>
            Date: {formatDate(item.createdAt)}
          </Typography>
        </Box>
      </Box>

      {/* MAIN DETAILS */}
      <Grid container spacing={6}>
        <Grid size={6}>
          <Box>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                mb: 2
              }}
            >
              Customer Details
            </Typography>

            <DataField label="Name" value={item.customerName} />
            <DataField label="Contact" value={item.phoneNumber} />
          </Box>
        </Grid>

        <Grid size={6}>
          <Box>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                mb: 2
              }}
            >
              Device Information
            </Typography>

            <DataField label="Brand / Model" value={item.brand} />

            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.6,
                  borderRadius: '50px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: getStatusColor(item.status),
                  color: '#fff',
                  letterSpacing: '1px'
                }}
              >
                {item.status?.toUpperCase()}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* REPAIR NOTES */}
      <Box sx={{ mt: 6 }}>
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            mb: 2
          }}
        >
          Repair Diagnosis
        </Typography>

        <Typography
          sx={{
            fontSize: '13px',
            lineHeight: 1.8,
            color: '#334155',
            border: '1px solid #e2e8f0',
            padding: '14px',
            borderRadius: '6px',
            minHeight: '100px'
          }}
        >
          {item.repairNotes || "No technician notes provided."}
        </Typography>
      </Box>

      {/* TERMS */}
      <Box sx={{ mt: 6 }}>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            mb: 2
          }}
        >
          Terms of Service
        </Typography>

        {[
          "30-day warranty applies only to the specific repair performed.",
          "Customer is responsible for data backup. Service center is not liable for data loss.",
          "Unclaimed devices may be disposed after 30 days of notification.",
          "Diagnostic charges apply if repair estimate is declined."
        ].map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: '10px',
              color: '#64748b',
              lineHeight: 1.6,
              mb: 1
            }}
          >
            {index + 1}. {text}
          </Typography>
        ))}
      </Box>

      {/* SIGNATURES */}
      <Box
        sx={{
          mt: 'auto',
          pt: 10,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {['Customer Signature', 'Authorized Signature'].map((label, i) => (
          <Box key={i} sx={{ width: '45%', textAlign: 'center' }}>
            <Box
              sx={{
                borderBottom: '1px solid #94a3b8',
                height: '45px',
                mb: 1
              }}
            />
            <Typography
              sx={{
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase'
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* FOOTER */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: '12mm',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          color: '#cbd5e1',
          fontWeight: 600
        }}
      >
        Generated by Admin Info Solution Digital Management System
      </Typography>
    </Box>
  );
});

export default JobSheetPrintTemplate;
