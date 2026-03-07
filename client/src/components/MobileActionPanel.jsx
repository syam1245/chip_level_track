import React, { useState } from "react";
import { Box, IconButton, Tooltip, CircularProgress } from "@mui/material";
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

    const handleAction = (fn) => () => {
        closeActions();
        fn(item);
    };

    const handleAIGenerate = async () => {
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
            <Tooltip title="Summarize Case" placement="top">
                <IconButton
                    onClick={() => { onOpenSummary(); closeActions(); }}
                    sx={{
                        color: "#fff",
                        background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                        width: 44, height: 44,
                        "&:hover": { filter: "brightness(1.1)" },
                        "&:active": { transform: "scale(0.9)" }
                    }}
                >
                    <SummarizeIcon sx={{ fontSize: "1.25rem" }} />
                </IconButton>
            </Tooltip>

            <Tooltip title="Draft WhatsApp" placement="top">
                <span>
                    <IconButton
                        onClick={handleAIGenerate}
                        disabled={isGeneratingAI}
                        sx={{
                            color: "#fff",
                            background: "linear-gradient(135deg, #ec4899 0%, #d946ef 100%)",
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
