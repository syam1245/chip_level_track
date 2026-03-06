import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert, Divider, Button
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { TrendingUp, AccountBalanceWallet, People, Build, PendingActions, Star, Download as DownloadIcon } from "@mui/icons-material";
import RevenueChart from "./RevenueChart";

const RevenueReport = ({ data, loading }) => {
    const theme = useTheme();

    if (loading) return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 2, sm: 3 }, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress />
        </Paper>
    );
    if (!data) return <Alert severity="warning" sx={{ borderRadius: 3 }}>No data available</Alert>;
    const totalRevenue = data?.total ?? 0;
    const totalJobs = data?.totalJobs ?? 0;
    const pendingJobs = data?.pendingJobs ?? 0;
    const topTechnician = data?.topTechnician ?? "N/A";
    const breakdown = data?.breakdown ?? [];

    const handleExportCSV = () => {
        if (!breakdown || breakdown.length === 0) return;

        const headers = ["Technician", "Jobs Completed", "Revenue Generated"];
        const csvRows = [headers.join(",")];

        for (const tech of breakdown) {
            const row = [
                `"${tech._id || 'Unknown'}"`,
                `"${tech.deviceCount || 0}"`,
                `"${tech.totalRevenue || 0}"`
            ];
            csvRows.push(row.join(","));
        }

        // Add a totals row at the bottom
        csvRows.push(`"TOTAL","${totalJobs}","${totalRevenue}"`);

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const kpis = [
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            icon: <AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 28 } }} />,
            color: theme.palette.primary.main
        },
        {
            title: "Total Jobs",
            value: totalJobs,
            icon: <Build sx={{ fontSize: { xs: 20, sm: 28 } }} />,
            color: theme.palette.secondary.main
        },
        {
            title: "Pending Jobs",
            value: pendingJobs,
            icon: <PendingActions sx={{ fontSize: { xs: 20, sm: 28 } }} />,
            color: theme.palette.warning?.main || "#ed6c02" // fallback for warning
        },
        {
            title: "Top Technician",
            value: topTechnician,
            icon: <Star sx={{ fontSize: { xs: 20, sm: 28 } }} />,
            color: theme.palette.success?.main || "#2e7d32" // fallback for success
        }
    ];

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
                <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                >
                    <TrendingUp color="primary" /> Revenue Reporting
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={breakdown.length === 0}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
                >
                    Export CSV
                </Button>
                {/* Mobile version icon only */}
                <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleExportCSV}
                    disabled={breakdown.length === 0}
                    sx={{ minWidth: 'auto', p: 1, borderRadius: 2, display: { xs: 'flex', sm: 'none' } }}
                >
                    <DownloadIcon fontSize="small" />
                </Button>
            </Box>

            {/* KPI Summary Cards */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={{ xs: 2, sm: 3 }}>
                {kpis.map((kpi, index) => (
                    <Grid size={{ xs: 6, sm: 6, md: 3 }} key={index}>
                        <Box sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: { xs: "12px", sm: "16px" },
                            bgcolor: alpha(kpi.color, 0.08),
                            border: `1px solid ${alpha(kpi.color, 0.15)}`,
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 1, sm: 2 },
                            minWidth: 0,
                            height: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Box sx={{
                                p: { xs: 1, sm: 1.5 },
                                borderRadius: { xs: "10px", sm: "12px" },
                                bgcolor: alpha(kpi.color, 0.12),
                                color: kpi.color,
                                display: "flex",
                                flexShrink: 0
                            }}>
                                {kpi.icon}
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                    sx={{
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        fontSize: { xs: "0.55rem", sm: "0.65rem" },
                                        display: 'block',
                                        lineHeight: 1.3,
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {kpi.title}
                                </Typography>
                                <Typography
                                    variant="h4"
                                    fontWeight={900}
                                    sx={{
                                        color: kpi.color,
                                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem', lg: '1.75rem' },
                                        lineHeight: 1.2,
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {kpi.value}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                ))}
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
