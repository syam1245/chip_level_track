/**
 * KeyboardShortcutsDialog — shows all available keyboard shortcuts.
 * Triggered by pressing "?" anywhere on the page.
 */
import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Chip,
    IconButton,
    Divider,
    useTheme,
} from "@mui/material";
import { Close as CloseIcon, Keyboard as KeyboardIcon } from "@mui/icons-material";

const SHORTCUT_GROUPS = [
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["N"], description: "Create new job" },
            { keys: ["S", "/"], description: "Focus search bar" },
            { keys: ["A"], description: "Go to Admin Panel" },
            { keys: ["R"], description: "Refresh data" },
            { keys: ["?"], description: "Show this help" },
        ],
    },
    {
        title: "Filters",
        shortcuts: [
            { keys: ["1"], description: "Filter: In Progress" },
            { keys: ["2"], description: "Filter: Ready / Done" },
            { keys: ["3"], description: "Filter: Return" },
            { keys: ["4"], description: "Filter: All Jobs" },
            { keys: ["F"], description: "Clear all filters" },
        ],
    },
    {
        title: "Table Navigation",
        shortcuts: [
            { keys: ["↑", "↓"], description: "Move between rows" },
            { keys: ["Enter"], description: "Edit focused row" },
            { keys: ["Space"], description: "Select / deselect focused row" },
        ],
    },
    {
        title: "Row Actions",
        shortcuts: [
            { keys: ["E"], description: "Edit focused row" },
            { keys: ["W"], description: "WhatsApp focused row" },
            { keys: ["P"], description: "Print focused row" },
            { keys: ["D"], description: "Delete focused row (Admin)" },
        ],
    },
    {
        title: "Pagination",
        shortcuts: [
            { keys: ["←", "["], description: "Previous page" },
            { keys: ["→", "]"], description: "Next page" },
        ],
    },
    {
        title: "General",
        shortcuts: [
            { keys: ["Esc"], description: "Close dialog / clear selection" },
            { keys: ["B"], description: "Download backup (Admin)" },
            { keys: ["T"], description: "Toggle dark / light theme" },
        ],
    },
];

const KeyBadge = ({ children }) => {
    const theme = useTheme();
    return (
        <Box
            component="kbd"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 28,
                height: 28,
                px: 1,
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: "0.02em",
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e293b",
                bgcolor: theme.palette.mode === "dark" ? "#334155" : "#f1f5f9",
                border: `1px solid ${theme.palette.mode === "dark" ? "#475569" : "#cbd5e1"}`,
                boxShadow:
                    theme.palette.mode === "dark"
                        ? "0 2px 0 #1e293b"
                        : "0 2px 0 #e2e8f0",
            }}
        >
            {children}
        </Box>
    );
};

const KeyboardShortcutsDialog = ({ open, onClose }) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    maxHeight: "80vh",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 1,
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: "12px",
                            bgcolor: "primary.light",
                            color: "primary.main",
                        }}
                    >
                        <KeyboardIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="800">
                            Keyboard Shortcuts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Press <KeyBadge>?</KeyBadge> anytime to show this
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                {SHORTCUT_GROUPS.map((group, gi) => (
                    <Box key={group.title} sx={{ mb: gi < SHORTCUT_GROUPS.length - 1 ? 3 : 1 }}>
                        <Typography
                            variant="overline"
                            fontWeight="800"
                            color="text.secondary"
                            sx={{
                                fontSize: "0.68rem",
                                letterSpacing: "0.1em",
                                display: "block",
                                mb: 1,
                            }}
                        >
                            {group.title}
                        </Typography>
                        <Box
                            sx={{
                                bgcolor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(255,255,255,0.03)"
                                        : "rgba(0,0,0,0.02)",
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: "divider",
                                overflow: "hidden",
                            }}
                        >
                            {group.shortcuts.map((sc, si) => (
                                <Box
                                    key={sc.description}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        px: 2,
                                        py: 1.2,
                                        borderBottom:
                                            si < group.shortcuts.length - 1
                                                ? "1px solid"
                                                : "none",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.primary"
                                        fontWeight="500"
                                        sx={{ fontSize: "0.85rem" }}
                                    >
                                        {sc.description}
                                    </Typography>
                                    <Box display="flex" gap={0.5} alignItems="center">
                                        {sc.keys.map((key, ki) => (
                                            <React.Fragment key={key}>
                                                {ki > 0 && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        sx={{ mx: 0.2, fontSize: "0.65rem" }}
                                                    >
                                                        or
                                                    </Typography>
                                                )}
                                                <KeyBadge>{key}</KeyBadge>
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ))}
            </DialogContent>
        </Dialog>
    );
};

export default KeyboardShortcutsDialog;
