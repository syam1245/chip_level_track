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
    MenuItem,
    Checkbox
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    WhatsApp as WhatsAppIcon,
    Print as PrintIcon,
    Notes as NotesIcon,
    FilterList as FilterListIcon,
    Schedule as ScheduleIcon
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
    handleDelete,
    selectedIds,
    onSelectChange,
    isAdmin
}) => {
    const [techMenuAnchor, setTechMenuAnchor] = useState(null);
    const now = new Date();
    const CLOSED_STATUSES = new Set(['Delivered', 'Return']);

    const isOverdue = (item) =>
        item.dueDate && !CLOSED_STATUSES.has(item.status) && new Date(item.dueDate) < now;

    const allSelected = items.length > 0 && items.every(i => selectedIds.has(i._id));
    const someSelected = items.some(i => selectedIds.has(i._id)) && !allSelected;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            items.forEach(i => onSelectChange(i._id, true));
        } else {
            items.forEach(i => onSelectChange(i._id, false));
        }
    };

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
                <TableHead sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                size="small"
                                checked={allSelected}
                                indeterminate={someSelected}
                                onChange={handleSelectAll}
                            />
                        </TableCell>
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
                    {items.map((item) => {
                        const overdue = isOverdue(item);
                        return (
                            <TableRow key={item._id} hover selected={selectedIds.has(item._id)} sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                bgcolor: overdue
                                    ? 'rgba(239,68,68,0.07)'
                                    : selectedIds.has(item._id)
                                        ? 'action.selected'
                                        : undefined,
                                borderLeft: overdue ? '3px solid #ef4444' : undefined,
                            }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={selectedIds.has(item._id)}
                                        onChange={(e) => onSelectChange(item._id, e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell align="left">
                                    <Typography fontWeight="600" color="primary">{item.jobNumber}</Typography>
                                    <Typography variant="caption" color="text.secondary">{formatDate(item.createdAt)}</Typography>
                                    {item.dueDate && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.2 }}>
                                            <ScheduleIcon sx={{ fontSize: 11, color: overdue ? 'error.main' : 'text.disabled' }} />
                                            <Typography
                                                variant="caption"
                                                sx={{ fontSize: '0.6rem', color: overdue ? 'error.main' : 'text.disabled', fontWeight: overdue ? 700 : 400 }}
                                            >
                                                {overdue ? 'OVERDUE' : 'Due'} {formatDate(item.dueDate)}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>{item.customerName}</TableCell>
                                <TableCell>{item.brand}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="600">{item.technicianName}</Typography>
                                </TableCell>
                                <TableCell>{item.phoneNumber}</TableCell>
                                <TableCell>
                                    {item.finalCost > 0 ? (
                                        <Box>
                                            <Typography variant="body2" fontWeight="700" color="success.main">
                                                ₹{item.finalCost}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.dark', bgcolor: 'success.light', px: 0.8, py: 0.2, borderRadius: 1 }}>
                                                FINAL
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Typography variant="body2" fontWeight="700" color="text.secondary">
                                                {item.cost ? `₹${item.cost}` : "—"}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                                                Est.
                                            </Typography>
                                        </Box>
                                    )}
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
                                            <IconButton size="small" onClick={() => handleWhatsApp(item)} sx={{ color: 'success.main', bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'success.contrastText' } }}>
                                                <WhatsAppIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Print">
                                            <IconButton size="small" onClick={() => setPrintItem(item)} sx={{ color: 'text.secondary', bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
                                                <PrintIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => setEditItem(item)} sx={{ color: 'primary.main', bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: 'error.main', bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ItemsTable;
