import React from 'react';
import { Stack, Box, Typography, Button } from '@mui/material';
import { Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ItemsListHeader = ({ isAdmin, downloadBackup, onNewJob }) => {
    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "start", md: "center" }}
                spacing={3}
                mb={5}
            >
                <Box>
                    <Typography variant="h3" fontWeight="900" className="text-gradient" sx={{ letterSpacing: '-1px' }}>
                        Repair Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mt={0.5}>
                        Manage your service jobs effectively.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    {isAdmin && (
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={downloadBackup}
                            sx={{ borderRadius: "var(--radius)", textTransform: 'none', fontWeight: 600 }}
                        >
                            Backup Data
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onNewJob}
                        sx={{
                            borderRadius: "var(--radius)",
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: "var(--shadow-md)",
                            background: "var(--color-primary)",
                            "&:hover": { background: "var(--color-primary-dark)" },
                        }}
                    >
                        New Job
                    </Button>
                </Stack>
            </Stack>
        </motion.div>
    );
};

export default ItemsListHeader;
