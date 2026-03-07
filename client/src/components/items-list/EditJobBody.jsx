import React, { useState } from "react";
import {
    DialogContent, Stack, Grid, FormControl, InputLabel, Select, MenuItem,
    Autocomplete, TextField, InputAdornment, Typography, Box, Button, Collapse, Paper
} from "@mui/material";
import {
    Build as BuildIcon, Schedule as ScheduleIcon, Person as PersonIcon,
    Phone as PhoneIcon, Devices as DevicesIcon, Receipt as ReceiptIcon,
    Notes as NotesIcon, AdminPanelSettings as AdminIcon, Info as InfoIcon,
    ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";
import { alpha } from "@mui/system";

import { STATUS_COLORS, STATUS_ACCENT } from "../../constants/status";
import { FAULT_OPTIONS } from "../../constants/faults";
import EditJobSection from "./EditJobSection";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const inputSx = (theme) => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        transition: "all 0.2s ease",
        minHeight: { xs: "48px", sm: "auto" },
        "&:hover": { bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
        "&.Mui-focused": { bgcolor: "transparent" },
    },
    "& .MuiInputLabel-root": { fontWeight: 600, fontSize: "0.85rem" },
});

const EditJobBody = ({ editItem, setEditItem, isAdmin, isMobile, isDark, theme, statusColor }) => {
    const [showMeta, setShowMeta] = useState(false);

    return (
        <DialogContent
            sx={{
                px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 },
                WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
                "&::-webkit-scrollbar": { width: isMobile ? 0 : 6 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(128,128,128,0.3)", borderRadius: 3 },
                pb: { xs: "calc(16px + env(safe-area-inset-bottom, 0px))", sm: 3 },
            }}
        >
            <Stack spacing={{ xs: 2, sm: 2.5 }}>

                {/* ── Status & Service ── */}
                <EditJobSection icon={<BuildIcon sx={{ fontSize: "1.1rem" }} />} title="Status & Service" accent={statusColor}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontWeight: 600 }}>Current Status</InputLabel>
                                <Select
                                    id="edit-status-select"
                                    name="status"
                                    value={editItem.status || "Received"} label="Current Status"
                                    onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                                    sx={{
                                        borderRadius: "12px", bgcolor: alpha(statusColor, 0.06), fontWeight: 700, color: statusColor,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(statusColor, 0.25) },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(statusColor, 0.45) },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: statusColor },
                                    }}
                                >
                                    {Object.keys(STATUS_COLORS).map((status) => (
                                        <MenuItem key={status} value={status} sx={{ fontWeight: editItem.status === status ? 700 : 500, color: STATUS_ACCENT[status] || "inherit", display: "flex", alignItems: "center", gap: 1, "&::before": { content: '""', width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS_ACCENT[status] || "#94a3b8", flexShrink: 0 } }}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                freeSolo options={FAULT_OPTIONS} value={editItem.issue || ""}
                                onChange={(_event, newValue) => setEditItem({ ...editItem, issue: (newValue || "").toUpperCase() })}
                                onInputChange={(_event, newInputValue) => setEditItem({ ...editItem, issue: newInputValue.toUpperCase() })}
                                renderInput={(params) => <TextField {...params} id="edit-issue-input" name="issue" label="Fault / Issue" onChange={(e) => setEditItem({ ...editItem, issue: e.target.value.toUpperCase() })} fullWidth size="small" sx={inputSx(theme)} />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Due Date"
                                    format="dd/MM/yyyy"
                                    value={editItem.dueDate ? new Date(editItem.dueDate) : null}
                                    onChange={(newValue) => setEditItem({ ...editItem, dueDate: newValue ? newValue.toISOString() : null })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                            helperText: "Optional — leave blank for no deadline",
                                            sx: inputSx(theme),
                                            InputProps: { startAdornment: <InputAdornment position="start"><ScheduleIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </EditJobSection>

                {/* ── Customer & Device ── */}
                <EditJobSection icon={<PersonIcon sx={{ fontSize: "1.1rem" }} />} title="Customer & Device" accent="#3b82f6">
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField id="edit-customer-name" name="customerName" label="Customer Name" value={editItem.customerName} onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value.toUpperCase() })} fullWidth size="small" sx={inputSx(theme)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField id="edit-phone-number" name="phoneNumber" label="Phone Number" value={editItem.phoneNumber} onChange={(e) => setEditItem({ ...editItem, phoneNumber: e.target.value })} fullWidth size="small" sx={inputSx(theme)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField id="edit-brand-model" name="brand" label="Brand / Model" value={editItem.brand} onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })} fullWidth size="small" sx={inputSx(theme)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><DevicesIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> } }} />
                        </Grid>
                    </Grid>
                </EditJobSection>

                <EditJobSection icon={<ReceiptIcon sx={{ fontSize: "1.1rem" }} />} title="Financials" accent="#10b981">
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <TextField
                                id="edit-final-cost"
                                name="finalCost"
                                label="Final Cost (₹)" type="number" value={editItem.finalCost || ""}
                                onChange={(e) => setEditItem({ ...editItem, finalCost: e.target.value })} fullWidth size="small" color="success" focused={!!editItem.finalCost} placeholder="Leave blank if pending"
                                sx={{ ...inputSx(theme), "& .MuiOutlinedInput-root": { ...inputSx(theme)["& .MuiOutlinedInput-root"], bgcolor: editItem.finalCost ? (isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.04)") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") } }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, fontSize: "1rem", color: editItem.finalCost ? "#10b981" : "text.disabled" }}>₹</Typography></InputAdornment> } }}
                            />
                        </Grid>
                    </Grid>
                </EditJobSection>

                {/* ── Notes & Admin ── */}
                <EditJobSection icon={<NotesIcon sx={{ fontSize: "1.1rem" }} />} title="Notes & Details" accent="#8b5cf6">
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                id="edit-repair-notes"
                                name="repairNotes"
                                label="Repair Notes" multiline minRows={3} maxRows={6} value={editItem.repairNotes || ""}
                                onChange={(e) => setEditItem({ ...editItem, repairNotes: e.target.value })} placeholder="E.g. Replaced display, Checked charging port..." fullWidth variant="outlined"
                                sx={{ ...inputSx(theme), "& .MuiOutlinedInput-root": { ...inputSx(theme)["& .MuiOutlinedInput-root"], borderRadius: "12px", fontFamily: '"Inter", sans-serif', fontSize: "0.88rem", lineHeight: 1.7 } }}
                            />
                        </Grid>
                        {isAdmin && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField id="edit-technician-override" name="technicianName" label="Technician Name" value={editItem.technicianName || ""} onChange={(e) => setEditItem({ ...editItem, technicianName: e.target.value })} fullWidth size="small" helperText="Admin override" sx={inputSx(theme)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><AdminIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> } }} />
                            </Grid>
                        )}
                    </Grid>
                </EditJobSection>

                {/* ── Expandable: Audit Log (admin only) ── */}
                {isAdmin && editItem.metadata && (
                    <Box>
                        <Button
                            size="small" color="inherit" onClick={() => setShowMeta(!showMeta)}
                            startIcon={<InfoIcon sx={{ fontSize: "1rem !important" }} />} endIcon={<ExpandMoreIcon sx={{ transform: showMeta ? "rotate(180deg)" : "none", transition: "0.3s ease" }} />}
                            sx={{ textTransform: "none", opacity: 0.6, fontWeight: 600, fontSize: "0.78rem", borderRadius: "10px", px: 1.5, "&:hover": { opacity: 1, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" } }}
                        >
                            Creation Audit Log
                        </Button>
                        <Collapse in={showMeta}>
                            <Paper elevation={0} sx={{ mt: 1, p: 2, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: "12px", border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: "IP", value: editItem.metadata.ip },
                                        { label: "User Role", value: editItem.metadata.userRole },
                                        { label: "OS", value: editItem.metadata.os },
                                        { label: "Browser", value: editItem.metadata.browser },
                                        { label: "Device", value: editItem.metadata.device },
                                        { label: "Time", value: editItem.metadata.timestamp ? new Date(editItem.metadata.timestamp).toLocaleString() : null },
                                    ].map((row) => (
                                        <Grid size={6} key={row.label}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", display: "block", mb: 0.3 }}>{row.label}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: row.label === "IP" ? "monospace" : "inherit", fontWeight: 600 }}>{row.value || "N/A"}</Typography>
                                        </Grid>
                                    ))}
                                    <Grid size={12}>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", display: "block", mb: 0.3 }}>Source</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all", fontWeight: 600 }}>{editItem.metadata.referer || "N/A"}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Collapse>
                    </Box>
                )}
            </Stack>
        </DialogContent>
    );
};

export default React.memo(EditJobBody);
