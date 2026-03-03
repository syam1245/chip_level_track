import React from "react";
import {
    Paper, Chip, Stack, Select, MenuItem,
    FormControl, InputLabel, Button, Tooltip, IconButton,
} from "@mui/material";
import { Close as CloseIcon, CheckBox as CheckBoxIcon } from "@mui/icons-material";

const ALL_STATUSES = [
    "Received", "Sent to Service", "In Progress",
    "Waiting for Parts", "Ready", "Delivered", "Return", "Pending",
];

const BulkActionBar = ({ selectedCount, bulkStatus, setBulkStatus, onApply, onClear }) => {
    if (selectedCount === 0) return null;

    return (
        <Paper
            elevation={4}
            sx={{
                mb: 1, px: 2, py: 1, borderRadius: 2,
                display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
                bgcolor: "primary.dark", color: "primary.contrastText",
                border: "1px solid", borderColor: "primary.main",
            }}
        >
            <CheckBoxIcon sx={{ color: "primary.contrastText" }} />
            <Chip
                label={`${selectedCount} selected`}
                size="small"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                    <InputLabel sx={{ color: "primary.contrastText", "&.Mui-focused": { color: "primary.contrastText" } }}>
                        Set Status
                    </InputLabel>
                    <Select
                        value={bulkStatus}
                        label="Set Status"
                        onChange={(e) => setBulkStatus(e.target.value)}
                        sx={{
                            color: "primary.contrastText",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" },
                            "& .MuiSvgIcon-root": { color: "primary.contrastText" },
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
                    sx={{ bgcolor: "white", color: "primary.dark", fontWeight: 700, "&:hover": { bgcolor: "grey.100" } }}
                >
                    Apply
                </Button>
                <Tooltip title="Clear selection (Esc)">
                    <IconButton size="small" onClick={onClear} sx={{ color: "primary.contrastText" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

export default React.memo(BulkActionBar);
