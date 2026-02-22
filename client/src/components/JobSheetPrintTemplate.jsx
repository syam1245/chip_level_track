import React, { forwardRef } from 'react';
import { Box, Typography, Divider, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const JobSheetPrintTemplate = forwardRef(({ item }, ref) => {
  if (!item) return null;

  // 1. Date Formatting (dd-mm-yy)
  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  // 2. Status Color Mapping (Deepened for better contrast/printability)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'received': return '#475569';
      case 'in progress': return '#d97706';
      case 'waiting': return '#dc2626';
      case 'ready': return '#059669';
      case 'delivered': return '#2563eb';
      case 'return':
      case 'pending': return '#7e22ce';
      default: return '#0f172a';
    }
  };

  const accentColor = getStatusColor(item.status);

  // 3. Reusable Info Block
  const InfoBlock = ({ title, data }) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1, letterSpacing: '0.5px' }}>
        {title}
      </Typography>
      {data.map((row, i) => (
        <Box key={i} sx={{ display: 'flex', mb: 0.5 }}>
          <Typography sx={{ width: '120px', fontSize: '15px', color: '#475569', fontWeight: 500 }}>{row.label}:</Typography>
          <Typography sx={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>{row.value || '—'}</Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
        `}
      </style>
      <Box
        ref={ref}
        className="print-root"
        sx={{
          width: '100%',
          minHeight: '100%',
          maxHeight: '295mm',
          padding: '15mm',
          backgroundColor: '#ffffff',
          fontFamily: '"Inter", "Roboto", sans-serif',
          color: '#0f172a',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '@media print': {
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            height: '296mm',
          },
          // Premium top accent band
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6mm',
            backgroundColor: accentColor,
          }
        }}
      >
        {/* --- HEADER --- */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, pt: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '32px', letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1.1 }}>
              ADMIN INFO <br />
              <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '32px' }}>SOLUTION</span>
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#475569', mt: 1.5, fontWeight: 500 }}>
              Harippad • Laptop Service<br />
              Phone: +91 9020448019
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: accentColor, letterSpacing: '1px', textTransform: 'uppercase' }}>
              JOB SHEET
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: '15px', color: '#475569', mb: 0.5 }}>
                Job No: <strong style={{ color: '#0f172a' }}>#{item.jobNumber || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ fontSize: '15px', color: '#475569', mb: 0.5 }}>
                Date: <strong style={{ color: '#0f172a' }}>{formatDate(item.createdAt)}</strong>
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  mt: 1,
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: accentColor,
                  color: '#fff',
                  letterSpacing: '1px'
                }}
              >
                {item.status?.toUpperCase() || 'UNKNOWN'}
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 4, borderColor: '#cbd5e1' }} />

        {/* --- CUSTOMER & DEVICE DETAILS --- */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid size={6}>
            <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: '8px', height: '100%' }}>
              <InfoBlock
                title="Customer Details"
                data={[
                  { label: 'Name', value: item.customerName },
                  { label: 'Contact', value: item.phoneNumber }
                ]}
              />
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: '8px', height: '100%' }}>
              <InfoBlock
                title="Device Information"
                data={[
                  { label: 'Brand/Model', value: item.brand },
                  { label: 'Fault/Issue', value: item.issue || 'Not specified' }
                ]}
              />
            </Box>
          </Grid>
        </Grid>

        {/* --- INVOICE TABLE / REPAIR DIAGNOSIS --- */}
        <Box sx={{ mb: 4 }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'transparent !important', borderBottom: `2px solid ${accentColor}`, fontSize: '15px', fontWeight: 700, color: '#0f172a !important', py: 1.5, pl: 0 }}>Description / Repair Notes</TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'transparent !important', borderBottom: `2px solid ${accentColor}`, fontSize: '15px', fontWeight: 700, color: '#0f172a !important', py: 1.5 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Primary Note Row */}
              <TableRow>
                <TableCell sx={{ py: 3, pl: 0, verticalAlign: 'top', borderBottom: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', mb: 1 }}>
                    Diagnostic & Service Notes
                  </Typography>
                  <Typography sx={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.repairNotes || "Standard diagnosis and repair service. No special technical notes provided at this time."}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 3, verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontSize: '16px', fontWeight: 600 }}>
                  {/* Replace with item.totalCost or similar if you have it in your database */}
                  {item.cost ? `₹${item.cost}` : 'TBD'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Total Section */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Box sx={{ width: '250px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '15px', color: '#475569' }}>Subtotal:</Typography>
                <Typography sx={{ fontSize: '15px', color: '#0f172a' }}>{item.cost ? `₹${item.cost}` : '—'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: '15px', color: '#475569' }}>Tax:</Typography>
                <Typography sx={{ fontSize: '15px', color: '#0f172a' }}>—</Typography>
              </Box>
              <Divider sx={{ mb: 1, borderColor: '#cbd5e1' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>TOTAL:</Typography>
                <Typography sx={{ fontSize: '20px', fontWeight: 800, color: accentColor }}>
                  {item.cost ? `₹${item.cost}` : 'TBD'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* --- TERMS & CONDITIONS --- */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1 }}>
            Terms & Conditions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              "30-day warranty applies only to the specific repair performed.",
              "Customer is responsible for data backup; we are not liable for data loss.",
              "Unclaimed devices may be disposed of after 30 days of notification.",
              "Diagnostic charges apply if the repair estimate is declined."
            ].map((text, index) => (
              <Typography key={index} sx={{ fontSize: '12px', color: '#64748b', width: '48%' }}>
                • {text}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* --- SIGNATURES --- */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          {['Customer Signature', 'Authorized Signatory'].map((label, i) => (
            <Box key={i} sx={{ width: '220px', textAlign: 'center' }}>
              <Box sx={{ borderBottom: '1px solid #94a3b8', height: '40px', mb: 1 }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* --- FOOTER --- */}
        <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
          Generated by Admin Info Solution Digital Management System
        </Typography>
      </Box>
    </>
  );
});

export default JobSheetPrintTemplate;