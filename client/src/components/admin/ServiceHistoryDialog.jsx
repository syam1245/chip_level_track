import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper
} from "@mui/material";
import { format } from "date-fns";
import { STATUS_ACCENT } from "../../constants/status";

const ServiceHistoryDialog = ({ open, onClose, item }) => {
    if (!item) return null;

    const history = item.statusHistory || [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>
                Service History: #{item.jobNumber}
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{item.customerName}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.brand} - {item.issue}</Typography>
                </Box>

                {history.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        No history logs found for this device.
                    </Typography>
                ) : (
                    <Stepper orientation="vertical" sx={{ mt: 2 }}>
                        {history.map((step, index) => (
                            <Step key={index} active={true}>
                                <StepLabel
                                    StepIconProps={{
                                        sx: { color: STATUS_ACCENT[step.status] || 'primary.main' }
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        {step.status}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {format(new Date(step.changedAt), "PPpp")}
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    {step.note && (
                                        <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                                {step.note}
                                            </Typography>
                                        </Paper>
                                    )}
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceHistoryDialog;
