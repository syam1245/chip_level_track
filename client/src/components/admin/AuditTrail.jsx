import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Stack,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Tooltip,
    IconButton
} from "@mui/material";
import { History, Search, Devices, Language, AccountCircle, Visibility } from "@mui/icons-material";
import { authFetch } from "../../api";

const AuditTrail = ({ initialLogs = [], onShowHistory }) => {
    const [auditLogs, setAuditLogs] = useState(initialLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setAuditLogs(initialLogs);
    }, [initialLogs]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else if (searchQuery === "") {
                setAuditLogs(initialLogs);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, initialLogs]);

    const performSearch = async (query) => {
        setSearching(true);
        try {
            const res = await authFetch(`/api/items?search=${encodeURIComponent(query)}&includeMetadata=true&limit=15`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.items);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
                <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History color="primary" /> Job Audit & Search
                </Typography>

                <TextField
                    size="small"
                    placeholder="Search Job #, Name, Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                        endAdornment: searching && <CircularProgress size={16} />
                    }}
                    sx={{
                        width: { xs: '100%', sm: 300 },
                        "& .MuiOutlinedInput-root": { borderRadius: 3 }
                    }}
                />
            </Stack>

            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Technician</TableCell>
                            <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Device Info</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {auditLogs.map((log) => (
                            <TableRow key={log._id} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="primary">#{log.jobNumber}</Typography>
                                        <Typography variant="caption" fontWeight={600} display="block" noWrap sx={{ maxWidth: 150 }}>{log.customerName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{log.brand}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Chip
                                            size="small"
                                            icon={<AccountCircle />}
                                            label={log.technicianName}
                                            variant="outlined"
                                            sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: '0.65rem' } }}
                                        />
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>
                                            {log.metadata?.ip?.replace('::ffff:', '') || "127.0.0.1"}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                    <Tooltip title={log.metadata?.ua || "Unknown"}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Devices sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{log.metadata?.device || "Desktop"}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Language sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{log.metadata?.os} · {log.metadata?.browser}</Typography>
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.status}
                                        size="small"
                                        variant="soft"
                                        color={log.status === 'Delivered' ? 'success' : 'info'}
                                        sx={{ fontSize: '0.65rem', height: 20 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" color="primary" onClick={() => onShowHistory(log)}>
                                        <Visibility fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default AuditTrail;
