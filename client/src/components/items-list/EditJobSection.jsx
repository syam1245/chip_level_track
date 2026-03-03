import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/system";

const EditJobSection = ({ icon, title, accent, children, sx }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: { xs: "14px", sm: "16px" },
                bgcolor: isDark ? alpha(accent || "#94a3b8", 0.06) : alpha(accent || "#94a3b8", 0.04),
                border: `1px solid ${isDark ? alpha(accent || "#94a3b8", 0.15) : alpha(accent || "#94a3b8", 0.12)}`,
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.3s ease",
                "&:hover": { borderColor: alpha(accent || "#94a3b8", 0.3) },
                ...sx,
            }}
        >
            <Box
                sx={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                    background: `linear-gradient(90deg, transparent, ${accent || "#94a3b8"}, transparent)`,
                    opacity: 0.5,
                }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: { xs: 2, sm: 2.5 } }}>
                <Box
                    sx={{
                        width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, borderRadius: { xs: "8px", sm: "10px" },
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: alpha(accent || "#94a3b8", 0.15), color: accent || "#94a3b8", flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.72rem", color: accent || "text.secondary" }}
                >
                    {title}
                </Typography>
            </Box>
            {children}
        </Box>
    );
};

export default React.memo(EditJobSection);
