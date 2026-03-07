import React from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Close as CloseIcon, AutoAwesome as AutoAwesomeIcon } from "@mui/icons-material";
import SummaryWidget from "../AI/SummaryWidget";

const SummaryDialog = ({ open, onClose, jobData }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AutoAwesomeIcon color="primary" />
                    AI Technical Overview
                </span>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ minHeight: "150px" }}>
                {jobData && <SummaryWidget jobData={jobData} />}
            </DialogContent>
        </Dialog>
    );
};

export default SummaryDialog;
