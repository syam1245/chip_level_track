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
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Divider
} from "@mui/material";
import {
    Engineering,
    History,
    VpnKey,
    Info,
    Devices,
    Language,
    Public as IpIcon,
    Search,
    CheckCircle,
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
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState({ text: "", type: "success" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [techs, itemsRes] = await Promise.all([
                fetchTechnicians(),
                authFetch("/api/items?limit=50&includeMetadata=true")
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
            <Typography variant="h3" fontWeight={900} mb={4} className="text-gradient">
                Administrative Management
            </Typography>

            {message.text && <Alert severity={message.type} sx={{ mb: 4 }} onClose={() => setMessage({ text: "", type: "success" })}>{message.text}</Alert>}

            <Grid container spacing={4}>
                {/* Technicians Management */}
                <Grid item xs={12} lg={4}>
                    <Paper elevation={0} className="glass-panel" sx={{ p: 3, height: '100%' }}>
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

                {/* Audit Trail */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <History color="primary" /> Audit Trail (Job Metadata)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Job #</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Technician</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Device Info</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.map((log) => (
                                        <TableRow key={log._id} hover>
                                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{log.jobNumber}</TableCell>
                                            <TableCell>
                                                <Chip size="small" icon={<AccountCircle />} label={log.technicianName} variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={log.metadata?.ua || "Unknown"}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Devices sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" fontWeight={600}>{log.metadata?.device || "Desktop"}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Language sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption">{log.metadata?.os} · {log.metadata?.browser}</Typography>
                                                        </Box>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace' }}>
                                                    <IpIcon sx={{ fontSize: 14 }} /> {log.metadata?.ip?.replace('::ffff:', '') || "127.0.0.1"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={log.status} size="small" variant="soft" color="info" sx={{ fontSize: '0.65rem', height: 20 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                        Updating password for <strong>{resetUser?.displayName}</strong>. This change will take effect immediately.
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
