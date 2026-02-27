import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Stack,
    Chip,
    Divider,
    Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_COLORS } from '../constants/status';
import { formatDate } from '../utils/date';
import API_BASE_URL from '../api';

const TrackJob = () => {
    const [jobNumber, setJobNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!jobNumber || !phoneNumber) {
            setError('Please enter both Job Number and Phone Number');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/items/track?jobNumber=${encodeURIComponent(jobNumber)}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
            const data = await res.json();

            if (res.ok) {
                setResult(data);
            } else {
                setError(data.error || 'Failed to find repair job.');
            }
        } catch (err) {
            setError('Network error connecting to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'background.default'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ width: '100%', maxWidth: '500px' }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: '24px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)'
                    }}
                >
                    <Box textAlign="center" mb={4}>
                        <Typography variant="h4" fontWeight="900" className="text-gradient" mb={1}>
                            Track Repair
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            Enter your details to check the live status of your device.
                        </Typography>
                    </Box>

                    <form onSubmit={handleSearch}>
                        <Stack spacing={3}>
                            <TextField
                                label="Job Number"
                                variant="outlined"
                                fullWidth
                                value={jobNumber}
                                onChange={(e) => setJobNumber(e.target.value)}
                                placeholder="e.g. 1234"
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />

                            <TextField
                                label="Phone Number"
                                variant="outlined"
                                fullWidth
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Registered mobile number"
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    borderRadius: '12px',
                                    py: 1.5,
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    background: 'var(--color-primary)',
                                    '&:hover': { background: 'var(--color-primary-dark)' }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Check Status'}
                            </Button>
                        </Stack>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: '20px' }}
                            >
                                <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
                            </motion.div>
                        )}

                        {result && !error && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '24px' }}
                            >
                                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: 'background.paper', border: '1px solid var(--border)' }}>
                                    <Stack spacing={2}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                                                CURRENT STATUS
                                            </Typography>
                                            <Chip
                                                label={result.status || 'Received'}
                                                sx={{
                                                    bgcolor: STATUS_COLORS[result.status] ? `${STATUS_COLORS[result.status]}.light` : 'default',
                                                    color: STATUS_COLORS[result.status] ? `${STATUS_COLORS[result.status]}.dark` : 'default',
                                                    fontWeight: 800,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </Box>

                                        <Divider sx={{ my: 1 }} />

                                        <Box>
                                            <Typography variant="h6" fontWeight="800">
                                                {result.brand}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                {result.issue}
                                            </Typography>
                                        </Box>

                                        {result.finalCost > 0 ? (
                                            <Box mt={1}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                                    FINAL AMOUNT
                                                </Typography>
                                                <Typography variant="h5" color="success.main" fontWeight={900}>
                                                    ₹{result.finalCost}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box mt={1}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                                    ESTIMATED COST
                                                </Typography>
                                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                                    {result.cost > 0 ? `₹${result.cost}` : 'TBD'}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Typography variant="caption" color="text.disabled" sx={{ pt: 1, borderTop: '1px dashed var(--border)' }}>
                                            Last Updated: {formatDate(result.updatedAt)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </Paper>
            </motion.div>
        </Box>
    );
};

export default TrackJob;
