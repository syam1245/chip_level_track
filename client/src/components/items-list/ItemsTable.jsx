import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Stack,
    TableSortLabel,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    WhatsApp as WhatsAppIcon,
    Print as PrintIcon,
    Notes as NotesIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { STATUS_COLORS } from "../../constants/status";
import { formatDate } from "../../utils/date";

const ItemsTable = ({
    items,
    loading,
    sortBy,
    sortOrder,
    handleSort,
    technicianFilter,
    setTechnicianFilter,
    setPage,
    techniciansList,
    handleWhatsApp,
    setPrintItem,
    setEditItem,
    handleDelete
}) => {
    const [techMenuAnchor, setTechMenuAnchor] = useState(null);

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: 'hidden',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s'
            }}
        >
            <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'createdAt'}
                                direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                                onClick={() => handleSort('createdAt')}
                            >
                                <Typography variant="subtitle2" fontWeight="700" color="text.secondary">JOB NO</Typography>
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'customerName'}
                                direction={sortBy === 'customerName' ? sortOrder : 'asc'}
                                onClick={() => handleSort('customerName')}
                            >
                                <Typography variant="subtitle2" fontWeight="700" color="text.secondary">CUSTOMER</Typography>
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">DEVICE</Typography>
                        </TableCell>
                        <TableCell>
                            <Box
                                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                onClick={(e) => setTechMenuAnchor(e.currentTarget)}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="700"
                                    color={technicianFilter !== 'All' ? 'primary.main' : 'text.secondary'}
                                >
                                    TECHNICIAN {technicianFilter !== 'All' && `(${technicianFilter})`}
                                </Typography>
                                <FilterListIcon
                                    sx={{
                                        ml: 0.5,
                                        fontSize: 16,
                                        color: technicianFilter !== 'All' ? 'primary.main' : 'text.secondary'
                                    }}
                                />
                            </Box>
                            <Menu
                                anchorEl={techMenuAnchor}
                                open={Boolean(techMenuAnchor)}
                                onClose={() => setTechMenuAnchor(null)}
                            >
                                <MenuItem
                                    selected={technicianFilter === "All"}
                                    onClick={() => {
                                        setTechnicianFilter("All");
                                        setPage(1);
                                        setTechMenuAnchor(null);
                                    }}
                                >
                                    All Technicians
                                </MenuItem>
                                {techniciansList.map(tech => (
                                    <MenuItem
                                        key={tech.displayName}
                                        selected={technicianFilter === tech.displayName}
                                        onClick={() => {
                                            setTechnicianFilter(tech.displayName);
                                            setPage(1);
                                            setTechMenuAnchor(null);
                                        }}
                                    >
                                        {tech.displayName}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </TableCell>
                        <TableCell>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">PHONE</Typography>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'cost'}
                                direction={sortBy === 'cost' ? sortOrder : 'asc'}
                                onClick={() => handleSort('cost')}
                            >
                                <Typography variant="subtitle2" fontWeight="700" color="text.secondary">AMOUNT</Typography>
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'status'}
                                direction={sortBy === 'status' ? sortOrder : 'asc'}
                                onClick={() => handleSort('status')}
                            >
                                <Typography variant="subtitle2" fontWeight="700" color="text.secondary">STATUS</Typography>
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">NOTES</Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">ACTIONS</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell align="left">
                                <Typography fontWeight="600" color="primary">{item.jobNumber}</Typography>
                                <Typography variant="caption" color="text.secondary">{formatDate(item.createdAt)}</Typography>
                            </TableCell>
                            <TableCell>{item.customerName}</TableCell>
                            <TableCell>{item.brand}</TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="600">{item.technicianName}</Typography>
                            </TableCell>
                            <TableCell>{item.phoneNumber}</TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="700" color="success.main">
                                    {item.cost ? `₹${item.cost}` : "—"}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={item.status || "Received"}
                                    color={STATUS_COLORS[item.status] || "default"}
                                    size="small"
                                    sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', height: '24px' }}
                                />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>
                                {item.repairNotes ? (
                                    <Box
                                        sx={{
                                            p: '6px 10px',
                                            bgcolor: 'action.hover',
                                            borderRadius: '6px',
                                            borderLeft: '3px solid var(--color-primary)',
                                            display: 'flex',
                                            gap: 0.75,
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <NotesIcon sx={{ fontSize: '0.85rem', color: 'var(--color-primary)', mt: '2px', flexShrink: 0 }} />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                lineHeight: 1.5,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            {item.repairNotes}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                    <Tooltip title="WhatsApp">
                                        <IconButton size="small" onClick={() => handleWhatsApp(item)} sx={{ color: '#10b981', bgcolor: '#dcfce7' }}>
                                            <WhatsAppIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Print">
                                        <IconButton size="small" onClick={() => setPrintItem(item)} sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}>
                                            <PrintIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => setEditItem(item)} sx={{ color: '#3b82f6', bgcolor: '#dbeafe' }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: '#ef4444', bgcolor: '#fee2e2' }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ItemsTable;
