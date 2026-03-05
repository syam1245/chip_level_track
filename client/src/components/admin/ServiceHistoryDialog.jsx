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
    Paper,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import { STATUS_ACCENT } from "../../constants/status";

const ServiceHistoryDialog = ({ open, onClose, item }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (!item) return null;

    const history = item.statusHistory || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 4,
                    ...(isMobile && {
                        m: 0,
                        maxHeight: '100%',
                        height: '100%'
                    })
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, py: { xs: 1.5, sm: 2 } }}>
                Service History: #{item.jobNumber}
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {item.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {item.brand} - {item.issue}
                    </Typography>
                </Box>

                {history.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4, fontSize: '0.85rem' }}>
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
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                        {step.status}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                        {format(new Date(step.changedAt), "PPpp")}
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    {step.note && (
                                        <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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
            <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }} size={isMobile ? "small" : "medium"}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceHistoryDialog;
