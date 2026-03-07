import React, { useState } from "react";
import { Box, Typography, Button, Skeleton, Alert, Stack, Collapse } from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon, Info as InfoIcon } from "@mui/icons-material";
import { aiApi } from "../../services/ai.api";

const SummaryWidget = ({ jobData }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSummarize = async (force = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await aiApi.generateJobSummary(jobData, { forceRefresh: force });
            setSummary(result);
        } catch (err) {
            console.error("Summary generation failed:", err);
            setError(err?.response?.data?.message || err.message || "AI Co-Pilot is currently unavailable. Displaying standard data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 2, mb: 1, p: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: summary || loading || error ? 2 : 0 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: "primary.main", fontSize: "1.2rem" }} />
                    AI Technical Overview
                </Typography>
                {!summary && !loading && (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSummarize()}
                        startIcon={<AutoAwesomeIcon />}
                        sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                        Summarize Case
                    </Button>
                )}
            </Box>

            <Collapse in={loading || !!error || !!summary}>
                {loading && (
                    <Stack spacing={1}>
                        <Skeleton variant="text" width="90%" animation="wave" />
                        <Skeleton variant="text" width="80%" animation="wave" />
                        <Skeleton variant="text" width="85%" animation="wave" />
                    </Stack>
                )}

                {error && (
                    <Alert severity="warning" icon={<InfoIcon />} sx={{ borderRadius: "8px" }}>
                        {error}
                    </Alert>
                )}

                {summary && !loading && !error && (
                    <Box sx={{ mt: 1 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.7,
                                fontSize: "0.85rem",
                                '& b, & strong': { color: 'var(--text-main)', fontWeight: 700 }
                            }}
                        >
                            {/* Simple replacement of markdown bold for browser rendering if not using a library */}
                            {summary.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line.startsWith('**') ? <b>{line.replace(/\*\*/g, '')}</b> : line}
                                    {i < summary.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </Typography>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => handleSummarize(true)}
                                sx={{ fontSize: '0.7rem', opacity: 0.6, '&:hover': { opacity: 1 } }}
                            >
                                Re-generate
                            </Button>
                        </Box>
                    </Box>
                )}
            </Collapse>
        </Box>
    );
};

export default SummaryWidget;
