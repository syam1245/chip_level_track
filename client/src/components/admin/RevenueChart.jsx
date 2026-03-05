import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";

const BAR_COLORS = [
    "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
    "#06b6d4", "#f97316", "#a855f7", "#14b8a6", "#ec4899",
];

const RevenueChart = ({ breakdown }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (!breakdown || breakdown.length === 0) return null;

    const max = Math.max(...breakdown.map((r) => r.totalRevenue), 1);
    const barHeight = isMobile ? 26 : 32;
    const gap = isMobile ? 8 : 12;

    return (
        <Box sx={{ mt: 1 }}>
            <Typography
                variant="subtitle2"
                fontWeight={800}
                mb={{ xs: 1.5, sm: 2 }}
                color="text.secondary"
                sx={{
                    textTransform: "uppercase",
                    fontSize: { xs: "0.6rem", sm: "0.7rem" },
                    letterSpacing: "0.06em"
                }}
            >
                Revenue by Technician
            </Typography>

            <Box sx={{ overflow: "hidden" }}>
                {breakdown.map((row, i) => {
                    const color = BAR_COLORS[i % BAR_COLORS.length];
                    return (
                        <Box
                            key={row._id}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: `${gap}px`,
                                gap: { xs: 0.75, sm: 1.5 },
                            }}
                        >
                            {/* Technician label */}
                            <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                    width: { xs: 80, sm: 130 },
                                    flexShrink: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    color: "text.primary",
                                    fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                }}
                            >
                                {row._id}
                            </Typography>

                            {/* Bar track */}
                            <Box
                                sx={{
                                    flex: 1,
                                    height: barHeight,
                                    borderRadius: "8px",
                                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                    position: "relative",
                                    overflow: "hidden",
                                    minWidth: 40,
                                }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(row.totalRevenue / max) * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        height: "100%",
                                        borderRadius: "8px",
                                        background: `linear-gradient(90deg, ${color}cc, ${color})`,
                                        boxShadow: `0 2px 8px ${color}40`,
                                        minWidth: 4,
                                    }}
                                />
                                {/* Count label inside bar */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        left: 8,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: { xs: "0.6rem", sm: "0.7rem" },
                                        zIndex: 1,
                                        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {row.deviceCount} job{row.deviceCount !== 1 ? "s" : ""}
                                </Typography>
                            </Box>

                            {/* Revenue value */}
                            <Typography
                                variant="body2"
                                fontWeight={800}
                                sx={{
                                    width: 'fit-content',
                                    minWidth: { xs: 48, sm: 65 },
                                    flexShrink: 0,
                                    textAlign: "right",
                                    color: color,
                                    fontSize: { xs: "0.7rem", sm: "0.85rem" },
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ₹{row.totalRevenue.toLocaleString()}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default React.memo(RevenueChart);
