import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Stack,
    Avatar,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    Divider
} from "@mui/material";
import {
    Engineering,
    History,
    VpnKey,
    Devices,
    Language,
    Search,
    AccountCircle
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { authFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

const AdminDashboard = () => {
    const { fetchTechnicians } = useAuth();
    const [technicians, setTechnicians] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState({ text: "", type: "success" });

    useEffect(() => {
        loadData();
    }, []);

    // Debounced real-time search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else if (searchQuery === "" && !loading) {
                loadData();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadData = async () => {
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

    const performSearch = async (query) => {
        setSearching(true);
        try {
            const res = await authFetch(`/api/items?search=${encodeURIComponent(query)}&includeMetadata=true&limit=15`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.items);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 4) return;
        try {
            const res = await authFetch(`/api/auth/users/${resetUser.username}/password`, {
                method: "PUT",
                body: JSON.stringify({ newPassword })
            });
            if (res.ok) {
                setMessage({ text: `Password reset for ${resetUser.displayName}`, type: "success" });
                setResetUser(null);
                setNewPassword("");
            } else {
                throw new Error("Reset failed");
            }
        } catch (err) {
            setMessage({ text: "Failed to reset password", type: "error" });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: "1400px", margin: "0 auto", p: { xs: 2, md: 4 } }}>
            <Typography variant="h3" fontWeight={900} mb={4} className="text-gradient" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                Administrative Management
            </Typography>

            {message.text && <Alert severity={message.type} sx={{ mb: 4 }} onClose={() => setMessage({ text: "", type: "success" })}>{message.text}</Alert>}

            <Grid container spacing={4}>
                {/* Technicians Management */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Engineering color="primary" /> Technicians
                        </Typography>
                        <Stack spacing={2}>
                            {technicians.map((tech) => (
                                <Card key={tech.username} variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: tech.role === 'admin' ? 'primary.main' : 'secondary.main' }}>
                                                    {tech.username[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight={700}>{tech.displayName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{tech.role.toUpperCase()}</Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="soft"
                                                startIcon={<VpnKey fontSize="small" />}
                                                onClick={() => setResetUser(tech)}
                                                sx={{ textTransform: 'none', borderRadius: 2 }}
                                            >
                                                Reset
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Audit Trail & Search */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
                            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <History color="primary" /> Job Audit & Search
                            </Typography>

                            <TextField
                                size="small"
                                placeholder="Search Job #, Name, Phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                                    endAdornment: searching && <CircularProgress size={16} />
                                }}
                                sx={{
                                    width: { xs: '100%', sm: 300 },
                                    "& .MuiOutlinedInput-root": { borderRadius: 3 }
                                }}
                            />
                        </Stack>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Technician</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Device Info</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.map((log) => (
                                        <TableRow key={log._id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={800} color="primary">#{log.jobNumber}</Typography>
                                                    <Typography variant="caption" fontWeight={600} display="block" noWrap sx={{ maxWidth: 150 }}>{log.customerName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{log.brand}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Chip
                                                        size="small"
                                                        icon={<AccountCircle />}
                                                        label={log.technicianName}
                                                        variant="outlined"
                                                        sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: '0.65rem' } }}
                                                    />
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>
                                                        {log.metadata?.ip?.replace('::ffff:', '') || "127.0.0.1"}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Tooltip title={log.metadata?.ua || "Unknown"}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Devices sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{log.metadata?.device || "Desktop"}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Language sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{log.metadata?.os} · {log.metadata?.browser}</Typography>
                                                        </Box>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.status}
                                                    size="small"
                                                    variant="soft"
                                                    color={log.status === 'Delivered' ? 'success' : 'info'}
                                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!searching && auditLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body1" color="text.secondary">No matching records found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Reset Password Dialog */}
            <Dialog open={!!resetUser} onClose={() => setResetUser(null)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Reset Technician Password</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Updating password for <strong>{resetUser?.displayName}</strong>.
                    </Typography>
                    <TextField
                        autoFocus
                        label="New Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setResetUser(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleResetPassword} disabled={!newPassword}>Update Password</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;
