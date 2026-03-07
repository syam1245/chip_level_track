import React, { useState } from "react";
import { Box, Typography, Button, Skeleton, Alert, Paper, Collapse } from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon, Lightbulb as LightbulbIcon, Insights as InsightsIcon } from "@mui/icons-material";
import { aiApi } from "../../services/ai.api";

const InsightsCard = ({ revenueData }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!revenueData) return;
        setLoading(true);
        setError(null);
        try {
            const result = await aiApi.generateInsights(revenueData);
            setInsights(result);
        } catch (err) {
            console.error("Insights generation failed:", err);
            setError(err?.response?.data?.message || err.message || "AI Co-Pilot is currently unavailable. Displaying standard data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                mb: 3,
                borderRadius: "16px",
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(145deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Decorative background glow */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-50px",
                    right: "-50px",
                    width: "150px",
                    height: "150px",
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(255,255,255,0) 70%)",
                    borderRadius: "50%",
                    zIndex: 0,
                    pointerEvents: "none"
                }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: insights || loading || error ? 2 : 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                                color: "#fff",
                                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.25)"
                            }}
                        >
                            <InsightsIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                                AI Business Insights
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Weekly Performance & Bottleneck Analysis
                            </Typography>
                        </Box>
                    </Box>

                    {!insights && !loading && (
                        <Button
                            variant="contained"
                            onClick={handleGenerate}
                            disabled={!revenueData}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                                boxShadow: "none",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                                },
                                "&.Mui-disabled": {
                                    background: "rgba(0,0,0,0.12)",
                                    color: "rgba(0,0,0,0.26)"
                                }
                            }}
                        >
                            Analyze Now
                        </Button>
                    )}
                </Box>

                <Collapse in={loading || !!error || !!insights}>
                    {loading && (
                        <Box sx={{ mt: 2 }}>
                            <Skeleton variant="text" width="90%" animation="wave" height={24} />
                            <Skeleton variant="text" width="80%" animation="wave" height={24} />
                            <Skeleton variant="text" width="85%" animation="wave" height={24} />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: "10px" }}>
                            {error}
                        </Alert>
                    )}

                    {insights && !loading && !error && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: "background.paper",
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: "divider"
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                <LightbulbIcon sx={{ color: "#eab308", mt: 0.5 }} />
                                <Box>
                                    {insights.split('\n').filter(line => line.trim()).map((paragraph, idx) => (
                                        <Typography
                                            key={idx}
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1.5,
                                                "&:last-child": { mb: 0 },
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {paragraph.replace(/^[-•*]\s*/, "• ")}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Collapse>
            </Box>
        </Paper>
    );
};

export default InsightsCard;
