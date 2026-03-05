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
    Alert,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Engineering, VpnKey } from "@mui/icons-material";
import { resetPassword } from "../../services/auth.api";
import { useAuth } from "../../auth/AuthContext";

const TechnicianList = ({ technicians, onUpdate }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

            const result = await resetPassword(resetUser.username, bodyData);

            if (result.ok) {
                setMessage({ text: `Password reset for ${resetUser.displayName}`, type: "success" });
                setResetUser(null);
                setNewPassword("");
                setOverrideUsername("");
                setOverridePassword("");
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: result.error || "Reset failed", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Failed to reset password. Connection error.", type: "error" });
        }
    };

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography
                variant="h6"
                fontWeight={800}
                mb={{ xs: 2, sm: 3 }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
            >
                <Engineering color="primary" /> Technicians
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
                {technicians.map((tech) => (
                    <Card key={tech.username} variant="outlined" sx={{ borderRadius: { xs: 2, sm: 3 } }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: { xs: 1, sm: 1.5 },
                                width: '100%'
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: { xs: 1, sm: 1.5 },
                                    minWidth: 0,
                                    flex: 1
                                }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: tech.role === 'admin' ? 'primary.main' : 'secondary.main',
                                            width: { xs: 36, sm: 40 },
                                            height: { xs: 36, sm: 40 },
                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }}
                                    >
                                        {tech.username[0].toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            fontWeight={700}
                                            sx={{
                                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {tech.displayName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                        >
                                            {tech.role.toUpperCase()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    size="small"
                                    variant="soft"
                                    startIcon={<VpnKey fontSize="small" />}
                                    onClick={() => setResetUser(tech)}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        flexShrink: 0,
                                        minWidth: 'auto',
                                        px: { xs: 1.5, sm: 2 },
                                        fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                                    }}
                                >
                                    Reset
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            {/* Reset Password Dialog */}
            <Dialog
                open={!!resetUser}
                onClose={() => setResetUser(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 3, sm: 4 },
                        p: { xs: 0.5, sm: 1 },
                        mx: { xs: 1.5, sm: 3 }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, pb: 1 }}>
                    Reset Technician Password
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Updating password for <strong>{resetUser?.displayName}</strong>.
                    </Typography>

                    <TextField
                        autoFocus
                        label="New Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mt: 1, mb: 2 }}
                    />

                    {!isAdmin && (
                        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'error.soft', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
                            <Typography variant="subtitle2" color="error.main" fontWeight={800} mb={1} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Admin Override Required
                            </Typography>
                            <Typography variant="caption" color="error.main" display="block" mb={2} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
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
                <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                    <Button
                        onClick={() => {
                            setResetUser(null);
                            setOverrideUsername("");
                            setOverridePassword("");
                        }}
                        size={isMobile ? "small" : "medium"}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleResetPassword}
                        disabled={!newPassword || (!isAdmin && (!overrideUsername || !overridePassword))}
                        size={isMobile ? "small" : "medium"}
                    >
                        Update Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TechnicianList;
