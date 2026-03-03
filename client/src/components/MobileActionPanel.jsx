import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import {
    WhatsApp as WhatsAppIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";

const MobileActionPanel = ({ onWhatsApp, onEdit, onDelete, canDelete, item, closeActions }) => {
    const handleAction = (fn) => () => {
        closeActions();
        fn(item);
    };

    return (
        <Box
            sx={{
                display: "flex", alignItems: "center", justifyContent: "space-evenly",
                width: "100%", gap: 0.5, px: 1, height: "100%",
                background: "linear-gradient(90deg, transparent 0%, rgba(30,41,59,0.95) 25%)",
            }}
        >
            <Tooltip title="WhatsApp" placement="top">
                <IconButton
                    onClick={handleAction(onWhatsApp)}
                    sx={{ color: "#fff", bgcolor: "#25D366", width: 44, height: 44, "&:hover": { bgcolor: "#1da851" }, "&:active": { transform: "scale(0.9)" } }}
                >
                    <WhatsAppIcon sx={{ fontSize: "1.25rem" }} />
                </IconButton>
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
