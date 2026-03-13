import React from "react";
import {
    Paper, Chip, Stack, Select, MenuItem,
    FormControl, InputLabel, Button, Tooltip, IconButton, useTheme,
} from "@mui/material";
import { Close as CloseIcon, CheckBox as CheckBoxIcon, DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";

const ALL_STATUSES = [
    "Received", "Sent to Service", "In Progress",
    "Waiting for Parts", "Ready", "Delivered", "Return", "Pending",
];

const BulkActionBar = ({ selectedCount, bulkStatus, setBulkStatus, onApply, onBulkDelete, isAdmin, onClear }) => {
    const theme = useTheme();
    if (selectedCount === 0) return null;

    return (
        <Paper
            elevation={8}
            sx={{
                mb: 1.5, px: 2.5, py: 1.25, borderRadius: "16px",
                display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap",
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                color: "#fff",
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                position: "sticky", top: 16, zIndex: 10,
                backdropFilter: "blur(10px)",
            }}
        >
            <CheckBoxIcon sx={{ color: "#fff" }} />
            <Chip
                label={`${selectedCount} selected`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, border: "1px solid rgba(255,255,255,0.3)" }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                    <InputLabel sx={{ 
                        color: "rgba(255,255,255,0.7)", 
                        "&.Mui-focused": { color: "#fff" },
                        "&.MuiInputLabel-shrink": { color: "#fff" }
                    }}>
                        Set Status
                    </InputLabel>
                    <Select
                        value={bulkStatus}
                        label="Set Status"
                        onChange={(e) => setBulkStatus(e.target.value)}
                        sx={{
                            color: "#fff",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
                            "& .MuiSvgIcon-root": { color: "#fff" },
                        }}
                    >
                        {ALL_STATUSES.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    size="small"
                    onClick={onApply}
                    disabled={!bulkStatus}
                    sx={{ 
                        bgcolor: "#fff", 
                        color: "primary.main", 
                        fontWeight: 800, 
                        px: 2,
                        "&:hover": { bgcolor: "grey.100" },
                        "&.Mui-disabled": { 
                            bgcolor: "rgba(255,255,255,0.12)", 
                            color: "rgba(255,255,255,0.3)" 
                        }
                    }}
                >
                    Apply
                </Button>
                {isAdmin && (
                    <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon fontSize="small" />}
                        onClick={onBulkDelete}
                        sx={{
                            ml: 1,
                            fontWeight: 800,
                            px: 2,
                            boxShadow: "0 4px 12px rgba(211, 47, 47, 0.4)",
                            "&:hover": { bgcolor: "error.dark" }
                        }}
                    >
                        Delete
                    </Button>
                )}
                <Tooltip title="Clear selection (Esc)">
                    <IconButton size="small" onClick={onClear} sx={{ color: "#fff", ml: 1 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

export default React.memo(BulkActionBar);
