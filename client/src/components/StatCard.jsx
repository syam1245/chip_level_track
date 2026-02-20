import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Box, Typography } from "@mui/material";

const StatCard = React.memo(({ title, value, color, icon, isActive, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ height: '100%' }}
    >
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                bgcolor: isActive ? `${color}18` : "var(--surface)",
                border: isActive ? `2px solid ${color}` : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                boxShadow: isActive ? `0 0 0 3px ${color}22` : "var(--shadow-sm)",
                height: '100%',
                cursor: 'pointer',
                transition: "all 0.2s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: `0 6px 20px ${color}30`, borderColor: color }
            }}
        >
            <CardContent sx={{
                p: { xs: 1.5, md: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                "&:last-child": { pb: { xs: 1.5, md: 2 } }
            }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" sx={{ fontSize: { xs: '0.6rem', md: '0.7rem' }, letterSpacing: '0.06em' }}>
                        {title}
                    </Typography>
                    <Typography
                        variant="h5"
                        fontWeight="800"
                        sx={{ color: color, mt: 0.25, lineHeight: 1.2, fontSize: { xs: '1.4rem', md: '1.75rem' } }}
                    >
                        {value}
                    </Typography>
                    {isActive && (
                        <Typography variant="caption" sx={{ color: color, fontWeight: 700, fontSize: '0.6rem' }}>
                            ● ACTIVE FILTER
                        </Typography>
                    )}
                </Box>
                <Box sx={{
                    bgcolor: `${color}18`,
                    p: { xs: 1, md: 1.5 },
                    borderRadius: "12px",
                    color: color,
                    display: 'flex',
                    '& svg': { fontSize: { xs: '1.3rem', md: '1.75rem' } }
                }}>
                    {icon}
                </Box>
            </CardContent>
        </Card>
    </motion.div>
));

export default StatCard;
