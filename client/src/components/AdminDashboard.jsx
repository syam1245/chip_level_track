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
import { authFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

// Modular Components
import TechnicianList from "./admin/TechnicianList";
import AuditTrail from "./admin/AuditTrail";
import RevenueReport from "./admin/RevenueReport";
import KeyStatistics from "./admin/KeyStatistics";
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
            const [techs, itemsRes] = await Promise.all([
                fetchTechnicians(),
                authFetch("/api/items?limit=5&includeMetadata=true")
            ]);

            setTechnicians(techs);
            if (itemsRes.ok) {
                const data = await itemsRes.json();
                setAuditLogs(data.items);
            }
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
                <Typography variant="h3" fontWeight={900} className="text-gradient" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                    Administrative Management
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" className="glass-panel" sx={{ px: 2, py: 1 }}>
                    <CalendarMonth color="action" />
                    <TextField
                        type="date"
                        size="small"
                        label="From"
                        value={dates.start}
                        onChange={(e) => setDates({ ...dates, start: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        type="date"
                        size="small"
                        label="To"
                        value={dates.end}
                        onChange={(e) => setDates({ ...dates, end: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button size="small" onClick={handleResetDates} startIcon={<RestartAlt />}>Reset</Button>
                </Stack>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 4 }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* Top Row: Key Statistics */}
                <Grid size={{ xs: 12 }}>
                    <KeyStatistics startDate={dates.start} endDate={dates.end} />
                </Grid>

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
