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
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 2, sm: 3 }, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress />
        </Paper>
    );
    if (error) return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;

    const totalRevenue = data?.total ?? 0;
    const breakdown = data?.breakdown ?? [];

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
            <Typography
                variant="h6"
                fontWeight={800}
                mb={{ xs: 2, sm: 3 }}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
            >
                <TrendingUp color="primary" /> Revenue Reporting
            </Typography>

            {/* KPI Summary Cards */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 6, sm: 6 }}>
                    <Box sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: { xs: "12px", sm: "16px" },
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1, sm: 2 },
                        minWidth: 0
                    }}>
                        <Box sx={{
                            p: { xs: 1, sm: 1.5 },
                            borderRadius: { xs: "10px", sm: "12px" },
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main",
                            display: "flex",
                            flexShrink: 0
                        }}>
                            <AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 28 } }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    fontSize: { xs: "0.55rem", sm: "0.65rem" },
                                    display: 'block',
                                    lineHeight: 1.3
                                }}
                            >
                                Total Revenue
                            </Typography>
                            <Typography
                                variant="h4"
                                fontWeight={900}
                                color="primary.main"
                                sx={{
                                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                                    lineHeight: 1.2
                                }}
                            >
                                ₹{totalRevenue.toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 6 }}>
                    <Box sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: { xs: "12px", sm: "16px" },
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1, sm: 2 },
                        minWidth: 0
                    }}>
                        <Box sx={{
                            p: { xs: 1, sm: 1.5 },
                            borderRadius: { xs: "10px", sm: "12px" },
                            bgcolor: alpha(theme.palette.secondary.main, 0.12),
                            color: "secondary.main",
                            display: "flex",
                            flexShrink: 0
                        }}>
                            <People sx={{ fontSize: { xs: 20, sm: 28 } }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    fontSize: { xs: "0.55rem", sm: "0.65rem" },
                                    display: 'block',
                                    lineHeight: 1.3
                                }}
                            >
                                Contributing Users
                            </Typography>
                            <Typography
                                variant="h4"
                                fontWeight={900}
                                color="secondary.main"
                                sx={{
                                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                                    lineHeight: 1.2
                                }}
                            >
                                {breakdown.length}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

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
