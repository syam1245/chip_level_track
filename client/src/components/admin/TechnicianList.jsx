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
    useMediaQuery,
    Chip,
    Tooltip,
    IconButton,
    Menu,
    MenuItem
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Engineering, VpnKey, PersonOff, PersonAdd, Add as AddIcon, DeleteForever as DeleteIcon, Edit as EditIcon, MoreVert, AdminPanelSettings, Person } from "@mui/icons-material";
import { resetPassword, toggleUserActive, createUser, deleteUser, updateUser } from "../../services/auth.api";
import { useAuth } from "../../auth/AuthContext";

const TechnicianCard = React.memo(({ tech, stats, isAdmin, currentUser, onReset, onEdit, onToggleActive, onDelete }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    return (
        <Card variant="outlined" sx={{
            borderRadius: { xs: 2, sm: 3 },
            transition: 'all 0.2s',
            '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transform: 'translateY(-2px)'
            },
            position: 'relative',
            overflow: 'visible'
        }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: { xs: 1, sm: 2 }
                }}>
                    {/* Left: Avatar and Names */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, minWidth: 0, flex: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: tech.role === 'admin' ? 'primary.main' : 'secondary.main',
                                width: { xs: 40, sm: 48 },
                                height: { xs: 40, sm: 48 },
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {tech.role === 'admin' ? <AdminPanelSettings sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <Person sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Tooltip title={tech.displayName} arrow placement="top-start">
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={800}
                                    sx={{
                                        lineHeight: 1.2,
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tech.displayName}
                                </Typography>
                            </Tooltip>

                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                <Chip
                                    label={tech.username}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        maxWidth: { xs: 80, sm: 120 },
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                                {tech.isActive === false && (
                                    <Chip
                                        label="INACTIVE"
                                        size="small"
                                        color="error"
                                        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }}
                                    />
                                )}
                                {tech.role === 'admin' && (
                                    <Chip
                                        label="ADMIN"
                                        size="small"
                                        color="primary"
                                        variant="soft"
                                        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }}
                                    />
                                )}
                            </Stack>

                            {/* Performance Stats */}
                            <Stack direction="row" spacing={2} mt={1}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Jobs: <Typography component="span" variant="caption" fontWeight={800} color="text.primary">{stats?.deviceCount || 0}</Typography>
                                </Typography>
                                <Typography variant="caption" color="success.main" fontWeight={700}>
                                    Revenue: ₹{(stats?.totalRevenue || 0).toLocaleString()}
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Right: Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {!isMobile && (
                            <>
                                <Tooltip title="Edit Profile">
                                    <IconButton size="small" color="primary" onClick={onEdit} sx={{ borderRadius: 2 }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Reset Password">
                                    <IconButton size="small" color="secondary" onClick={onReset} sx={{ borderRadius: 2 }}>
                                        <VpnKey fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                {isAdmin && (
                                    <Tooltip title={tech.isActive !== false ? "Deactivate" : "Reactivate"}>
                                        <IconButton
                                            size="small"
                                            color={tech.isActive !== false ? "error" : "success"}
                                            onClick={onToggleActive}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {tech.isActive !== false ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {isAdmin && tech.username !== currentUser?.username && (
                                    <Tooltip title="Delete Permanently">
                                        <IconButton size="small" color="error" onClick={onDelete} sx={{ borderRadius: 2 }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}

                        {isMobile && (
                            <>
                                <IconButton size="small" onClick={handleMenuOpen}>
                                    <MoreVert fontSize="small" />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleMenuClose}
                                    PaperProps={{
                                        sx: {
                                            borderRadius: 2,
                                            minWidth: 150,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
                                        <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Edit Profile
                                    </MenuItem>
                                    <MenuItem onClick={() => { onReset(); handleMenuClose(); }}>
                                        <VpnKey fontSize="small" sx={{ mr: 1.5, color: 'secondary.main' }} /> Reset Password
                                    </MenuItem>
                                    {isAdmin && (
                                        <MenuItem onClick={() => { onToggleActive(); handleMenuClose(); }}>
                                            {tech.isActive !== false ? (
                                                <><PersonOff fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /> Deactivate</>
                                            ) : (
                                                <><PersonAdd fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} /> Reactivate</>
                                            )}
                                        </MenuItem>
                                    )}
                                    {isAdmin && tech.username !== currentUser?.username && (
                                        <MenuItem onClick={() => { onDelete(); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                                            <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete Employee
                                        </MenuItem>
                                    )}
                                </Menu>
                            </>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
});

const TechnicianList = ({ technicians, revenueData, onUpdate }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [overrideUsername, setOverrideUsername] = useState("");
    const [overridePassword, setOverridePassword] = useState("");

    // Add User State
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [newUserState, setNewUserState] = useState({ username: "", displayName: "", password: "" });

    // Delete User State
    const [deleteUserObj, setDeleteUserObj] = useState(null);
    const [deleteAdminPassword, setDeleteAdminPassword] = useState("");

    // Edit User State
    const [editUserObj, setEditUserObj] = useState(null);
    const [editUserState, setEditUserState] = useState({ username: "", displayName: "" });

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

    const handleToggleActive = async (tech) => {
        if (!isAdmin) return;

        try {
            const newStatus = tech.isActive !== false ? false : true;
            const result = await toggleUserActive(tech.username, newStatus);
            if (result.ok) {
                setMessage({ text: result.data.message || `User ${newStatus ? 'reactivated' : 'deactivated'}`, type: "success" });
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: result.error || "Failed to update status", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Connection error.", type: "error" });
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const result = await createUser(newUserState);
            if (result.ok) {
                setMessage({ text: `Technician ${newUserState.displayName} added successfully!`, type: "success" });
                setAddUserOpen(false);
                setNewUserState({ username: "", displayName: "", password: "" });
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: result.error || "Failed to create user.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Failed to connect to server.", type: "error" });
        }
    };

    const handleDeleteUser = async (e) => {
        e.preventDefault();
        try {
            const result = await deleteUser(deleteUserObj.username, deleteAdminPassword);
            if (result.ok) {
                setMessage({ text: `Technician ${deleteUserObj.displayName} permanently deleted.`, type: "success" });
                setDeleteUserObj(null);
                setDeleteAdminPassword("");
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: result.error || "Failed to delete user.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Failed to connect to server.", type: "error" });
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const result = await updateUser(editUserObj.username, {
                newUsername: editUserState.username,
                displayName: editUserState.displayName
            });
            if (result.ok) {
                setMessage({ text: `Technician updated successfully!`, type: "success" });
                setEditUserObj(null);
                if (onUpdate) onUpdate();
            } else {
                setMessage({ text: result.error || "Failed to update user.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Failed to connect to server.", type: "error" });
        }
    };

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                >
                    <Engineering color="primary" /> Technicians
                </Typography>
                {isAdmin && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setAddUserOpen(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                        Add Tech
                    </Button>
                )}
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ text: "", type: "success" })}>
                    {message.text}
                </Alert>
            )}

            <Stack spacing={{ xs: 1, sm: 1.5 }}>
                {(() => {
                    const revenueMap = {};
                    if (revenueData?.breakdown) {
                        for (const b of revenueData.breakdown) {
                            revenueMap[b._id] = b;
                        }
                    }

                    return technicians.map((tech) => {
                        const techStats = revenueMap[tech.displayName] || { totalRevenue: 0, deviceCount: 0 };

                        return (
                            <TechnicianCard
                                key={tech.username}
                                tech={tech}
                                stats={techStats}
                                isAdmin={isAdmin}
                                currentUser={user}
                                onReset={() => setResetUser(tech)}
                                onEdit={() => {
                                    setEditUserObj(tech);
                                    setEditUserState({ username: tech.username, displayName: tech.displayName });
                                }}
                                onToggleActive={() => handleToggleActive(tech)}
                                onDelete={() => setDeleteUserObj(tech)}
                            />
                        );
                    });
                })()}
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

            {/* Add Technician Dialog */}
            <Dialog
                open={addUserOpen}
                onClose={() => setAddUserOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: { xs: 3, sm: 4 }, p: { xs: 0.5, sm: 1 }, mx: { xs: 1.5, sm: 3 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, pb: 1 }}>
                    Add New Technician
                </DialogTitle>
                <form onSubmit={handleAddUser}>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Create a new employee account. They will instantly be able to log in.
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Login Username"
                                required
                                fullWidth
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                value={newUserState.username}
                                onChange={(e) => setNewUserState({ ...newUserState, username: e.target.value })}
                                helperText="e.g. vineeth (no spaces)"
                            />
                            <TextField
                                label="Display Name"
                                required
                                fullWidth
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                value={newUserState.displayName}
                                onChange={(e) => setNewUserState({ ...newUserState, displayName: e.target.value })}
                                helperText="e.g. Vineeth"
                            />
                            <TextField
                                label="Initial Password"
                                required
                                type="password"
                                fullWidth
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                value={newUserState.password}
                                onChange={(e) => setNewUserState({ ...newUserState, password: e.target.value })}
                                helperText="Must be at least 4 characters"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                        <Button
                            onClick={() => {
                                setAddUserOpen(false);
                                setNewUserState({ username: "", displayName: "", password: "" });
                            }}
                            size={isMobile ? "small" : "medium"}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={!newUserState.username || !newUserState.displayName || newUserState.password.length < 4}
                            size={isMobile ? "small" : "medium"}
                        >
                            Create Employee
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Hard Delete Technician Dialog */}
            <Dialog
                open={!!deleteUserObj}
                onClose={() => { setDeleteUserObj(null); setDeleteAdminPassword(""); }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: { xs: 3, sm: 4 }, p: { xs: 0.5, sm: 1 }, mx: { xs: 1.5, sm: 3 }, border: '1px solid', borderColor: 'error.main' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, pb: 1, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon /> Delete Employee
                </DialogTitle>
                <form onSubmit={handleDeleteUser}>
                    <DialogContent>
                        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'error.soft', borderRadius: 2, mb: 3 }}>
                            <Typography variant="subtitle2" color="error.main" fontWeight={800} mb={1} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                                WARNING: Permanent Action
                            </Typography>
                            <Typography variant="caption" color="error.main" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                                You are about to permanently delete <strong>{deleteUserObj?.displayName}</strong>. This cannot be undone.
                                Their historical data on old repair jobs will be preserved, but their account will be eradicated.
                            </Typography>
                        </Box>

                        <TextField
                            label="Enter Admin Password to Confirm"
                            required
                            type="password"
                            fullWidth
                            variant="outlined"
                            autoFocus
                            size={isMobile ? "small" : "medium"}
                            value={deleteAdminPassword}
                            onChange={(e) => setDeleteAdminPassword(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                        <Button
                            onClick={() => {
                                setDeleteUserObj(null);
                                setDeleteAdminPassword("");
                            }}
                            size={isMobile ? "small" : "medium"}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            type="submit"
                            disabled={!deleteAdminPassword}
                            size={isMobile ? "small" : "medium"}
                        >
                            Permanently Delete
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Edit Technician Dialog */}
            <Dialog
                open={!!editUserObj}
                onClose={() => setEditUserObj(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: { xs: 3, sm: 4 }, p: { xs: 0.5, sm: 1 }, mx: { xs: 1.5, sm: 3 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, pb: 1 }}>
                    Edit Technician Profile
                </DialogTitle>
                <form onSubmit={handleUpdateUser}>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Update identification for <strong>{editUserObj?.displayName}</strong>.
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Login Username"
                                required
                                fullWidth
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                value={editUserState.username}
                                onChange={(e) => setEditUserState({ ...editUserState, username: e.target.value })}
                                helperText="Users will be logged out if username changes"
                            />
                            <TextField
                                label="Display Name"
                                required
                                fullWidth
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                value={editUserState.displayName}
                                onChange={(e) => setEditUserState({ ...editUserState, displayName: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                        <Button
                            onClick={() => setEditUserObj(null)}
                            size={isMobile ? "small" : "medium"}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={!editUserState.username || !editUserState.displayName}
                            size={isMobile ? "small" : "medium"}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Paper>
    );
};

export default TechnicianList;
