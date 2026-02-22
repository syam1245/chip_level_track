import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Grid,
    Autocomplete
} from '@mui/material';
import { STATUS_COLORS } from "../../constants/status";

const FAULT_OPTIONS = [
    "Standby-Section",
    "Power-Section",
    "Charging-Section",
    "I/O section",
    "GPU-Section",
    "Processor Short",
    "KB-Short"
];

const EditJobDialog = ({ editItem, setEditItem, handleEditSave, isAdmin }) => {
    if (!editItem) return null;

    return (
        <Dialog
            open={!!editItem}
            onClose={() => setEditItem(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: "var(--radius)" }
            }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Job Details</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid size={6}>
                            <TextField
                                label="Job Number"
                                value={editItem.jobNumber}
                                disabled
                                fullWidth
                                variant="filled"
                                size="small"
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Brand"
                                value={editItem.brand}
                                onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="Customer Name"
                        value={editItem.customerName}
                        onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value.toUpperCase() })}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Phone Number"
                        value={editItem.phoneNumber}
                        onChange={(e) => setEditItem({ ...editItem, phoneNumber: e.target.value })}
                        fullWidth
                        size="small"
                    />

                    {isAdmin && (
                        <TextField
                            label="Technician Name"
                            value={editItem.technicianName || ""}
                            onChange={(e) => setEditItem({ ...editItem, technicianName: e.target.value })}
                            fullWidth
                            size="small"
                            helperText="Admin only."
                        />
                    )}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                freeSolo
                                options={FAULT_OPTIONS}
                                value={editItem.issue || ""}
                                onChange={(_event, newValue) => {
                                    setEditItem({ ...editItem, issue: (newValue || "").toUpperCase() });
                                }}
                                onInputChange={(_event, newInputValue) => {
                                    setEditItem({ ...editItem, issue: newInputValue.toUpperCase() });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Fault / Issue"
                                        onChange={(e) => setEditItem({ ...editItem, issue: e.target.value.toUpperCase() })}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Total Cost (₹)"
                                type="number"
                                value={editItem.cost || ""}
                                onChange={(e) => setEditItem({ ...editItem, cost: e.target.value })}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={editItem.status || "Received"}
                            label="Status"
                            onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                        >
                            {Object.keys(STATUS_COLORS).map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Repair Notes (Optional)"
                        multiline
                        rows={3}
                        value={editItem.repairNotes || ""}
                        onChange={(e) => setEditItem({ ...editItem, repairNotes: e.target.value })}
                        placeholder="E.g. Replaced display, Checked charging port..."
                        fullWidth
                        variant="outlined"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setEditItem(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={handleEditSave} sx={{ borderRadius: "8px" }}>Save Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditJobDialog;
