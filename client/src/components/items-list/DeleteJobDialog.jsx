import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';

const DeleteJobDialog = ({ deleteConfirmId, setDeleteConfirmId, confirmDelete }) => {
    return (
        <Dialog
            open={!!deleteConfirmId}
            onClose={() => setDeleteConfirmId(null)}
            PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Delete Job?</DialogTitle>
            <DialogContent>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    This action cannot be undone. The job will be permanently removed from the list.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={() => setDeleteConfirmId(null)}
                    sx={{ color: "text.secondary", borderRadius: "8px" }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={confirmDelete}
                    sx={{ borderRadius: "8px", fontWeight: 700 }}
                >
                    Yes, Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteJobDialog;
