import React, { useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Card,
    CardContent,
    Avatar,
    Button,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert
} from "@mui/material";
import { Engineering, VpnKey } from "@mui/icons-material";
import { authFetch } from "../../api";
import { useAuth } from "../../auth/AuthContext";

const TechnicianList = ({ technicians, onUpdate }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [overrideUsername, setOverrideUsername] = useState("");
    const [overridePassword, setOverridePassword] = useState("");
    const [message, setMessage] = useState({ text: "", type: "success" });

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 4) return;

        try {
            const bodyData = { newPassword };
            if (!isAdmin) {
                bodyData.overrideUsername = overrideUsername;
                bodyData.overridePassword = overridePassword;
            }

            const res = await authFetch(`/api/auth/users/${resetUser.username}/password`, {
                method: "PUT",
                body: JSON.stringify(bodyData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: `Password reset for ${resetUser.displayName}`, type: "success" });
                setResetUser(null);
                setNewPassword("");
                setOverrideUsername("");
                setOverridePassword("");
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: data.error || "Reset failed", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Failed to reset password. Connection error.", type: "error" });
        }
    };

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Engineering color="primary" /> Technicians
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

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
                        sx={{ mt: 1, mb: 2 }}
                    />

                    {!isAdmin && (
                        <Box sx={{ p: 2, bgcolor: 'error.soft', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
                            <Typography variant="subtitle2" color="error.main" fontWeight={800} mb={1}>
                                Admin Override Required
                            </Typography>
                            <Typography variant="caption" color="error.main" display="block" mb={2}>
                                You are not an administrator. An admin must provide their credentials below to authorize this password reset.
                            </Typography>
                            <TextField
                                label="Admin Username"
                                fullWidth
                                size="small"
                                variant="outlined"
                                value={overrideUsername}
                                onChange={(e) => setOverrideUsername(e.target.value)}
                                sx={{ mb: 1.5 }}
                            />
                            <TextField
                                label="Admin Password"
                                type="password"
                                fullWidth
                                size="small"
                                variant="outlined"
                                value={overridePassword}
                                onChange={(e) => setOverridePassword(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => {
                        setResetUser(null);
                        setOverrideUsername("");
                        setOverridePassword("");
                    }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleResetPassword}
                        disabled={!newPassword || (!isAdmin && (!overrideUsername || !overridePassword))}
                    >
                        Update Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TechnicianList;
