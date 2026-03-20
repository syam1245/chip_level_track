import React, { useState, useEffect, useRef } from "react";
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
    IconButton,
    Card,
    CardContent,
    CardActionArea,
    useMediaQuery,
    Button
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { History, Search, Devices, Language, AccountCircle, Visibility, Download as DownloadIcon } from "@mui/icons-material";
import { searchItems } from "../../services/items.api";

/* ─── Mobile Card View for a single audit log ─── */
const AuditCard = React.memo(({ log, onShowHistory }) => {
    const theme = useTheme();
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2.5,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.main' }
            }}
        >
            <CardActionArea onClick={() => onShowHistory(log)} sx={{ p: 0 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    {/* Top row: Job number + Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ fontSize: '0.8rem' }}>
                            #{log.jobNumber}
                        </Typography>
                        <Chip
                            label={log.status}
                            size="small"
                            variant="soft"
                            color={log.status === 'Delivered' ? 'success' : 'info'}
                            sx={{ fontSize: '0.6rem', height: 20 }}
                        />
                    </Box>

                    {/* Customer + Brand */}
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                        {log.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {log.brand}
                    </Typography>

                    {/* Technician row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Chip
                            size="small"
                            icon={<AccountCircle />}
                            label={log.technicianName}
                            variant="outlined"
                            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: '0.65rem' }, "& .MuiChip-icon": { fontSize: 14 } }}
                        />
                        <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                            <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
});

/* ─── Main AuditTrail Component ─── */
const AuditTrail = React.memo(({ initialLogs = [], onShowHistory }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [auditLogs, setAuditLogs] = useState(initialLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const abortRef = useRef(null);

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
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setSearching(true);
        try {
            const data = await searchItems(query, 15, abortRef.current.signal);
            setAuditLogs(data.items);
        } catch (err) {
            if (err.name !== 'AbortError') console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    const handleExportCSV = () => {
        if (!auditLogs || auditLogs.length === 0) return;

        const headers = ["Job Number", "Customer Name", "Phone", "Brand", "Issue", "Technician", "Status", "Date"];
        const csvRows = [headers.join(",")];

        for (const log of auditLogs) {
            const row = [
                `"${log.jobNumber || ''}"`,
                `"${log.customerName || ''}"`,
                `"${log.phoneNumber || ''}"`,
                `"${log.brand || ''}"`,
                `"${log.issue || ''}"`,
                `"${log.technicianName || ''}"`,
                `"${log.status || ''}"`,
                `"${log.formattedDate || new Date(log.createdAt).toLocaleDateString()}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 1.5, sm: 2 } }}>
            {/* Header */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={{ xs: 1, sm: 1.5 }}
                mb={{ xs: 1.5, sm: 2 }}
            >
                <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                >
                    <History color="primary" /> Job Audit & Search
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                            "& .MuiOutlinedInput-root": { borderRadius: 3 },
                            '& .MuiInputBase-input': {
                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        disabled={auditLogs.length === 0}
                        sx={{ minWidth: 130, borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Stack>

            {/* Mobile: Card layout / Desktop: Table layout */}
            {isMobile ? (
                <Stack spacing={1}>
                    {auditLogs.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={3} sx={{ fontSize: '0.85rem' }}>
                            No audit logs found.
                        </Typography>
                    ) : (
                        auditLogs.map((log) => (
                            <AuditCard key={log._id} log={log} onShowHistory={onShowHistory} />
                        ))
                    )}
                </Stack>
            ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Details</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Technician</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Device Info</TableCell>
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
                                    <TableCell>
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
            )}
        </Paper>
    );
});

export default AuditTrail;
