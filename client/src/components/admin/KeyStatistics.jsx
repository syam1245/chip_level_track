import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Avatar
} from "@mui/material";
import { BrandingWatermark, ReportProblem, Speed } from "@mui/icons-material";
import { authFetch } from "../../api";

const KeyStatistics = ({ startDate, endDate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await authFetch(`/api/stats/summary?${params.toString()}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                setError("Failed to fetch statistics");
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    const StatItem = ({ icon: Icon, label, value, color }) => (
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5, bgcolor: `${color}.soft`, borderRadius: 4, height: '100%' }}>
            <Avatar sx={{ bgcolor: `${color}.main`, color: 'primary.contrastText', width: 56, height: 56 }}>
                <Icon fontSize="large" />
            </Avatar>
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>{label}</Typography>
                <Typography variant="h4" fontWeight={900}>{value}</Typography>
            </Box>
        </Box>
    );

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed color="primary" /> Key Statistics
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem
                        icon={BrandingWatermark}
                        label="TOP BRAND"
                        value={data.mostProcessedBrand}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem
                        icon={ReportProblem}
                        label="COMMON ISSUE"
                        value={data.mostCommonIssue}
                        color="error"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem
                        icon={Speed}
                        label="TOTAL DEVICES"
                        value={data.totalDevices}
                        color="info"
                    />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default KeyStatistics;
