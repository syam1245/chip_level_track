import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Stack,
    TextField,
    CircularProgress,
    Alert,
    Button
} from "@mui/material";
import { CalendarMonth, RestartAlt } from "@mui/icons-material";
import { format, startOfMonth } from "date-fns";
import { searchItems } from "../services/items.api";
import { useAuth } from "../auth/AuthContext";

// Modular Components
import TechnicianList from "./admin/TechnicianList";
import AuditTrail from "./admin/AuditTrail";
import RevenueReport from "./admin/RevenueReport";
import ServiceHistoryDialog from "./admin/ServiceHistoryDialog";

const AdminDashboard = () => {
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

    useEffect(() => {
        loadBaseData();
    }, []);

    const loadBaseData = async () => {
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
    };

    const handleResetDates = () => {
        setDates({
            start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
            end: format(new Date(), "yyyy-MM-dd")
        });
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: "1600px", margin: "0 auto", p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="h3" fontWeight={900} className="text-gradient" sx={{ fontSize: { xs: '1.75rem', md: '3rem' }, lineHeight: 1.2 }}>
                    Administrative Management
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} className="glass-panel" sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 1.5 }, width: { xs: '100%', md: 'auto' } }}>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <CalendarMonth color="action" />
                    </Box>
                    <TextField
                        type="date"
                        size="small"
                        label="From"
                        fullWidth
                        value={dates.start}
                        onChange={(e) => setDates({ ...dates, start: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        type="date"
                        size="small"
                        label="To"
                        fullWidth
                        value={dates.end}
                        onChange={(e) => setDates({ ...dates, end: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button size="small" onClick={handleResetDates} startIcon={<RestartAlt />} sx={{ minWidth: { sm: 100 } }}>Reset</Button>
                </Stack>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 4 }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* Top Row: Removed Key Statistics */}

                {/* Middle Row: Revenue & Technicians */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <RevenueReport startDate={dates.start} endDate={dates.end} />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <TechnicianList technicians={technicians} onUpdate={loadBaseData} />
                </Grid>

                {/* Bottom Row: Audit Trail */}
                <Grid size={{ xs: 12 }}>
                    <AuditTrail initialLogs={auditLogs} onShowHistory={(item) => setHistoryItem(item)} />
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
