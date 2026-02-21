import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Divider
} from "@mui/material";
import { TrendingUp, AccountBalanceWallet, People } from "@mui/icons-material";
import { authFetch } from "../../api";

const RevenueReport = ({ startDate, endDate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRevenue();
    }, [startDate, endDate]);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await authFetch(`/api/stats/revenue?${params.toString()}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                setError("Failed to fetch revenue data");
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" /> Revenue Reporting
            </Typography>

            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'primary.soft', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL REVENUE</Typography>
                            <Typography variant="h4" fontWeight={900}>₹{data.total.toLocaleString()}</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'secondary.soft', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <People color="secondary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>CONTRIBUTING USERS</Typography>
                            <Typography variant="h4" fontWeight={900}>{data.breakdown.length}</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" fontWeight={800} mb={2}>User Breakdown</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Technician</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Devices</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Revenue</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.breakdown.map((row) => (
                            <TableRow key={row._id}>
                                <TableCell sx={{ fontWeight: 700 }}>{row._id}</TableCell>
                                <TableCell align="right">{row.deviceCount}</TableCell>
                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 800 }}>
                                    ₹{row.totalRevenue.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default RevenueReport;
