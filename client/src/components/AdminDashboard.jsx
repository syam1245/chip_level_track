import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Stack,
    TextField,
    CircularProgress,
    Alert,
    Button,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CalendarMonth, RestartAlt } from "@mui/icons-material";
import { format, startOfMonth } from "date-fns";
import { searchItems } from "../services/items.api";
import { fetchRevenue as fetchRevenueApi } from "../services/stats.api";
import { useAuth } from "../auth/AuthContext";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Modular Components
import TechnicianList from "./admin/TechnicianList";
import AuditTrail from "./admin/AuditTrail";
import RevenueReport from "./admin/RevenueReport";
import ServiceHistoryDialog from "./admin/ServiceHistoryDialog";

const AdminDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { fetchTechnicians } = useAuth();
    const [technicians, setTechnicians] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "success" });

    // Date Filtering
    const [dates, setDates] = useState({
        start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd")
    });

    // History Modal
    const [historyItem, setHistoryItem] = useState(null);

    // Revenue/Stats Data
    const [revenueData, setRevenueData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        loadBaseData();
    }, []);

    const loadStats = React.useCallback(async () => {
        setStatsLoading(true);
        try {
            const result = await fetchRevenueApi(dates.start, dates.end);
            if (result.ok) {
                setRevenueData(result.data);
            } else {
                setMessage({ text: result.error || "Failed to fetch stats", type: "error" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStatsLoading(false);
        }
    }, [dates.start, dates.end]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const loadBaseData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [techs, itemsData] = await Promise.all([
                fetchTechnicians(),
                searchItems("", 5)
            ]);

            setTechnicians(techs);
            setAuditLogs(itemsData.items || []);
        } catch (err) {
            setMessage({ text: "Failed to load admin data", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [fetchTechnicians]);

    useEffect(() => {
        loadBaseData();
    }, [loadBaseData]);

    const handleResetDates = () => {
        setDates({
            start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
            end: format(new Date(), "yyyy-MM-dd")
        });
    };

    const handleShowHistory = React.useCallback((item) => setHistoryItem(item), []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: "1600px", margin: "0 auto", p: { xs: 1, sm: 1.5, md: 3 } }}>
            {/* Header Section - fully responsive */}
            <Box sx={{
                mb: { xs: 2, md: 3 },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, md: 2 }
            }}>
                <Typography
                    variant="h3"
                    fontWeight={900}
                    className="text-gradient"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '3rem' },
                        lineHeight: 1.2,
                        textAlign: { xs: 'left', md: 'left' }
                    }}
                >
                    Administrative Management
                </Typography>

                {/* Date Picker Bar */}
                <Box
                    className="glass-panel"
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: { xs: 1.5, sm: 1.5 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: { xs: 1.5, sm: 2 },
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth sx={{ color: 'text.secondary', fontSize: { xs: 20, sm: 24 } }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ display: { xs: 'block', sm: 'none' } }}>
                            Filter by Date
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'row', sm: 'row' },
                        gap: { xs: 1, sm: 2 },
                        flex: 1,
                        alignItems: 'center'
                    }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="From"
                                format="dd/MM/yyyy"
                                value={new Date(dates.start)}
                                onChange={(newValue) => setDates({ ...dates, start: format(newValue, "yyyy-MM-dd") })}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        sx: { '& .MuiInputBase-root': { fontSize: { xs: '0.8rem', sm: '0.875rem' } } },
                                    }
                                }}
                            />
                            <DatePicker
                                label="To"
                                format="dd/MM/yyyy"
                                value={new Date(dates.end)}
                                onChange={(newValue) => setDates({ ...dates, end: format(newValue, "yyyy-MM-dd") })}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        sx: { '& .MuiInputBase-root': { fontSize: { xs: '0.8rem', sm: '0.875rem' } } },
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Box>

                    <Button
                        size="small"
                        onClick={handleResetDates}
                        startIcon={<RestartAlt />}
                        sx={{
                            minWidth: { xs: '100%', sm: 100 },
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Reset
                    </Button>
                </Box>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: { xs: 2, md: 3 } }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                {/* Revenue Report */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <RevenueReport data={revenueData} loading={statsLoading} />
                </Grid>

                {/* Technicians */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <TechnicianList technicians={technicians} revenueData={revenueData} onUpdate={loadBaseData} />
                </Grid>

                {/* Audit Trail */}
                <Grid size={{ xs: 12 }}>
                    <AuditTrail initialLogs={auditLogs} onShowHistory={handleShowHistory} />
                </Grid>
            </Grid>

            <ServiceHistoryDialog
                open={!!historyItem}
                onClose={() => setHistoryItem(null)}
                item={historyItem}
            />
        </Box>
    );
};

export default AdminDashboard;
