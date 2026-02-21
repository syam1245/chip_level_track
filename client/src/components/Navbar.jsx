import React, { useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Switch,
    FormControlLabel,
    Avatar,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Stack,
    Paper
} from "@mui/material";
import {
    AdminPanelSettings,
    Engineering,
    Logout,
    Dashboard as DashboardIcon,
    AddCircle as AddIcon,
    FormatListBulleted as ListIcon,
    Menu as MenuIcon,
    Brightness4,
    Brightness7,
    Person as PersonIcon,
    Security as ManagementIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ toggleTheme, mode }) => {
    const { user, logout, isAdminView, toggleAdminView } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!user) return null;

    const isAdmin = user.role === "admin";
    const isActive = (path) => location.pathname === path;

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleToggleWithRedirect = () => {
        toggleAdminView();
        // Navigate to the primary view of the selected mode
        const nextIsAdmin = !isAdminView;
        navigate(nextIsAdmin ? "/admin" : "/");
        if (isMobile) setMobileOpen(false);
    };

    const navItems = [
        { label: "New Job", icon: <AddIcon />, path: "/", show: true },
        { label: "Repair List", icon: <ListIcon />, path: "/items", show: true },
        { label: "Admin Panel", icon: <DashboardIcon />, path: "/admin", show: true },
    ];

    const drawer = (
        <Box sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 1 }}>
                <Avatar sx={{ bgcolor: 'var(--color-primary)', width: 40, height: 40 }}>{user.username[0]}</Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight={800}>{user.displayName}</Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List spacing={1}>
                {navItems.filter(item => item.show).map((item) => (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => { navigate(item.path); setMobileOpen(false); }}
                            selected={isActive(item.path)}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                {isAdmin && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isAdminView ? <AdminPanelSettings color="primary" /> : <Engineering color="action" />}
                                <Typography variant="body2" fontWeight={700}>
                                    {isAdminView ? "Admin Mode" : "Tech Mode"}
                                </Typography>
                            </Box>
                            <Switch size="small" checked={isAdminView} onChange={handleToggleWithRedirect} />
                        </Stack>
                    </Paper>
                )}
                <Button
                    fullWidth
                    variant="soft"
                    color="error"
                    startIcon={<Logout />}
                    onClick={logout}
                    sx={{ borderRadius: 3, py: 1.2, fontWeight: 700 }}
                >
                    Sign Out
                </Button>
            </Box>
        </Box>
    );

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: alpha(theme.palette.background.paper, 0.75),
                    backdropFilter: "blur(24px)",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Toolbar sx={{ height: 72, px: { xs: 2, md: 4 } }}>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, color: 'text.primary' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography
                        variant="h5"
                        fontWeight={900}
                        className="text-gradient"
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            letterSpacing: '-1px'
                        }}
                        onClick={() => navigate(isAdminView ? "/admin" : "/")}
                    >
                        {isAdminView ? <ManagementIcon /> : <AddIcon />}
                        Admin Info Solution
                    </Typography>

                    {!isMobile && (
                        <Box sx={{ ml: 6, display: 'flex', gap: 1 }}>
                            {navItems.filter(item => item.show).map((item) => (
                                <Button
                                    key={item.label}
                                    onClick={() => navigate(item.path)}
                                    startIcon={item.icon}
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        borderRadius: "12px",
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                                        bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Stack direction="row" spacing={2} alignItems="center">
                        {!isMobile && isAdmin && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: "14px",
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Typography variant="caption" fontWeight={800} color={isAdminView ? "primary" : "text.secondary"}>
                                    {isAdminView ? "ADMIN MODE" : "TECH MODE"}
                                </Typography>
                                <Switch
                                    size="small"
                                    checked={isAdminView}
                                    onChange={handleToggleWithRedirect}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: theme.palette.primary.main },
                                    }}
                                />
                            </Box>
                        )}

                        <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
                            <IconButton
                                onClick={toggleTheme}
                                sx={{
                                    bgcolor: 'action.hover',
                                    borderRadius: "12px",
                                    p: 1.2
                                }}
                            >
                                {mode === "dark" ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        {!isMobile && (
                            <>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box textAlign="right">
                                        <Typography variant="body2" fontWeight={800} display="block" sx={{ lineHeight: 1 }}>
                                            {user.displayName}
                                        </Typography>

                                    </Box>
                                    <Avatar
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: 'var(--color-primary)',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {user.username[0]}
                                    </Avatar>
                                </Box>
                                <IconButton
                                    onClick={logout}
                                    sx={{
                                        color: 'error.main',
                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' },
                                        borderRadius: "12px"
                                    }}
                                >
                                    <Logout fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, borderRadius: '0 20px 20px 0' },
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};

export default Navbar;
