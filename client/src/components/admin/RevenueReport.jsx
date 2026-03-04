import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert, Divider
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { TrendingUp, AccountBalanceWallet, People } from "@mui/icons-material";
import { fetchRevenue as fetchRevenueApi } from "../../services/stats.api";
import RevenueChart from "./RevenueChart";

const RevenueReport = ({ startDate, endDate }) => {
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRevenue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchRevenueApi(startDate, endDate);
            if (result.ok) {
                setData(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    if (loading) return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress />
        </Paper>
    );
    if (error) return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;

    const totalRevenue = data?.total ?? 0;
    const breakdown = data?.breakdown ?? [];

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp color="primary" /> Revenue Reporting
            </Typography>

            {/* KPI Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                        p: 2, borderRadius: "16px",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        display: "flex", alignItems: "center", gap: 2
                    }}>
                        <Box sx={{
                            p: 1.5, borderRadius: "12px",
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main", display: "flex"
                        }}>
                            <AccountBalanceWallet sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>
                                Total Revenue
                            </Typography>
                            <Typography variant="h4" fontWeight={900} color="primary.main">
                                ₹{totalRevenue.toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                        p: 2, borderRadius: "16px",
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                        display: "flex", alignItems: "center", gap: 2
                    }}>
                        <Box sx={{
                            p: 1.5, borderRadius: "12px",
                            bgcolor: alpha(theme.palette.secondary.main, 0.12),
                            color: "secondary.main", display: "flex"
                        }}>
                            <People sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>
                                Contributing Users
                            </Typography>
                            <Typography variant="h4" fontWeight={900} color="secondary.main">
                                {breakdown.length}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Bar Chart */}
            {breakdown.length > 0 ? (
                <RevenueChart breakdown={breakdown} />
            ) : (
                <Typography color="text.secondary" textAlign="center" py={3}>
                    No revenue data for this period.
                </Typography>
            )}
        </Paper>
    );
};

export default RevenueReport;
