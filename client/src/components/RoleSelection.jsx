import React from "react";
import { Box, Card, CardContent, Typography, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AdminPanelSettings, Engineering } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

const RoleSelection = () => {
    const { selectView, user } = useAuth();
    const theme = useTheme();

    return (
        <Box sx={{
            minHeight: "calc(100vh - 72px)",
            display: "grid",
            placeItems: "center",
            background: theme.palette.mode === 'dark' ? 'radial-gradient(circle at top, #1a1a1a, #0a0a0a)' : 'radial-gradient(circle at top, #f8fafc, #f1f5f9)',
            p: 3
        }}>
            <Stack spacing={4} sx={{ maxWidth: 700, width: "100%", alignItems: "center" }}>
                <Box textAlign="center">
                    <Typography variant="h3" fontWeight={900} gutterBottom className="text-gradient">
                        Welcome back, {user?.displayName}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        How would you like to start your session?
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ width: "100%" }}>
                    <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }} style={{ flex: 1 }}>
                        <Card
                            onClick={() => selectView(true)}
                            sx={{
                                height: "100%",
                                cursor: "pointer",
                                borderRadius: 5,
                                border: `2px solid transparent`,
                                transition: "all 0.3s",
                                "&:hover": {
                                    borderColor: "primary.main",
                                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.1)"
                                }
                            }}
                        >
                            <CardContent sx={{ p: 4, textAlign: "center" }}>
                                <Box sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: "primary.main",
                                    width: 80,
                                    height: 80,
                                    borderRadius: "24px",
                                    display: "grid",
                                    placeItems: "center",
                                    margin: "0 auto 24px"
                                }}>
                                    <AdminPanelSettings sx={{ fontSize: 40 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={800} gutterBottom>Admin Dashboard</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Full oversight, analytics, technician management, and security audits.
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }} style={{ flex: 1 }}>
                        <Card
                            onClick={() => selectView(false)}
                            sx={{
                                height: "100%",
                                cursor: "pointer",
                                borderRadius: 5,
                                border: `2px solid transparent`,
                                transition: "all 0.3s",
                                "&:hover": {
                                    borderColor: "success.main",
                                    boxShadow: "0 20px 40px rgba(16, 185, 129, 0.1)"
                                }
                            }}
                        >
                            <CardContent sx={{ p: 4, textAlign: "center" }}>
                                <Box sx={{
                                    bgcolor: "#dcfce7",
                                    color: "#10b981",
                                    width: 80,
                                    height: 80,
                                    borderRadius: "24px",
                                    display: "grid",
                                    placeItems: "center",
                                    margin: "0 auto 24px"
                                }}>
                                    <Engineering sx={{ fontSize: 40 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={800} gutterBottom>Technician View</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Standard job creation interface and item lists for quick service delivery.
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Stack>
            </Stack>
        </Box>
    );
};

export default RoleSelection;
