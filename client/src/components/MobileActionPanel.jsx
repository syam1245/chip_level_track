import React, { useState } from "react";
import { Box, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from "@mui/material";
import {
    WhatsApp as WhatsAppIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AutoAwesome as AutoAwesomeIcon,
    Summarize as SummarizeIcon,
    ChatBubbleOutline as ChatIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";

const MobileActionPanel = ({ onWhatsApp, onAIGenerateWhatsApp, onEdit, onDelete, canDelete, item, closeActions, onOpenSummary }) => {
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiAnchorEl, setAiAnchorEl] = useState(null);

    const handleAction = (fn) => () => {
        closeActions();
        fn(item);
    };

    const handleAIMenuOpen = (event) => {
        setAiAnchorEl(event.currentTarget);
    };

    const handleAIMenuClose = () => {
        setAiAnchorEl(null);
    };

    const handleAIGenerate = async () => {
        handleAIMenuClose();
        setIsGeneratingAI(true);
        try {
            await onAIGenerateWhatsApp(item);
        } finally {
            setIsGeneratingAI(false);
            closeActions();
        }
    };

    return (
        <Box
            sx={{
                display: "flex", alignItems: "center", justifyContent: "space-evenly",
                width: "100%", gap: 0.5, px: 1, height: "100%",
                bgcolor: "rgba(30,41,59, 1)",
            }}
        >
            <Tooltip title="AI Actions" placement="top">
                <span>
                    <IconButton
                        onClick={handleAIMenuOpen}
                        disabled={isGeneratingAI}
                        sx={{
                            color: "#fff",
                            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                            width: 44, height: 44,
                            "&:hover": { filter: "brightness(1.1)" },
                            "&:active": { transform: "scale(0.9)" }
                        }}
                    >
                        {isGeneratingAI ? (
                            <motion.div
                                animate={{
                                    rotate: [0, 20, -20, 20, 0],
                                    scale: [1, 1.25, 1],
                                }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                style={{ display: "flex" }}
                            >
                                <AutoAwesomeIcon sx={{ fontSize: "1.25rem" }} />
                            </motion.div>
                        ) : (
                            <AutoAwesomeIcon sx={{ fontSize: "1.25rem" }} />
                        )}
                    </IconButton>
                </span>
            </Tooltip>

            <Menu
                anchorEl={aiAnchorEl}
                open={Boolean(aiAnchorEl)}
                onClose={handleAIMenuClose}
                transformOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
                PaperProps={{
                    sx: {
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                        mt: -1.5
                    }
                }}
            >
                <MenuItem onClick={handleAIGenerate} sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon>
                        <ChatIcon sx={{ color: "#ec4899" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Draft WhatsApp"
                        secondary="Smart message generation"
                        secondaryTypographyProps={{ fontSize: "0.7rem" }}
                    />
                </MenuItem>
                <MenuItem onClick={() => { handleAIMenuClose(); onOpenSummary(); closeActions(); }} sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon>
                        <SummarizeIcon sx={{ color: "#8b5cf6", fontSize: "1.2rem" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Summarize Case"
                        secondary="Quick repair TL;DR"
                        secondaryTypographyProps={{ fontSize: "0.7rem" }}
                    />
                </MenuItem>
                {/* Note: The summary is currently inside the MobileCardContent, so we don't need a strict second action here right now, but this menu establishes the pattern for future "Smart Actions" */}
            </Menu>

            <Tooltip title="Edit" placement="top">
                <IconButton
                    onClick={handleAction(onEdit)}
                    sx={{ color: "#fff", bgcolor: "#3b82f6", width: 44, height: 44, "&:hover": { bgcolor: "#2563eb" }, "&:active": { transform: "scale(0.9)" } }}
                >
                    <EditIcon sx={{ fontSize: "1.25rem" }} />
                </IconButton>
            </Tooltip>
            {canDelete && (
                <Tooltip title="Delete" placement="top">
                    <IconButton
                        onClick={handleAction(onDelete)}
                        sx={{ color: "#fff", bgcolor: "#ef4444", width: 44, height: 44, "&:hover": { bgcolor: "#dc2626" }, "&:active": { transform: "scale(0.9)" } }}
                    >
                        <DeleteIcon sx={{ fontSize: "1.25rem" }} />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

export default React.memo(MobileActionPanel);
