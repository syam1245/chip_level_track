/**
 * Skeleton loading placeholders that mirror the exact layout of the real UI.
 *
 * - StatCardsSkeleton  — matches the 5-card stat grid
 * - TableSkeleton      — matches ItemsTable rows
 * - MobileCardSkeleton — matches MobileCard layout
 *
 * Uses MUI's built-in <Skeleton> with "wave" animation for a premium shimmer feel.
 */
import React from "react";
import {
    Box,
    Card,
    CardContent,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";

// ── Stat Cards Skeleton ────────────────────────────────────────────────────
export const StatCardsSkeleton = () => (
    <Box
        sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
            gap: { xs: 1.5, md: 2 },
            mb: 4,
        }}
    >
        {Array.from({ length: 5 }).map((_, i) => (
            <Card
                key={i}
                elevation={0}
                sx={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    bgcolor: "var(--surface)",
                }}
            >
                <CardContent
                    sx={{
                        p: { xs: 1.5, md: 2 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        "&:last-child": { pb: { xs: 1.5, md: 2 } },
                    }}
                >
                    <Box>
                        <Skeleton
                            variant="text"
                            width={70}
                            height={14}
                            animation="wave"
                            sx={{ mb: 1, borderRadius: 1 }}
                        />
                        <Skeleton
                            variant="text"
                            width={50}
                            height={32}
                            animation="wave"
                            sx={{ borderRadius: 1 }}
                        />
                    </Box>
                    <Skeleton
                        variant="rounded"
                        width={44}
                        height={44}
                        animation="wave"
                        sx={{ borderRadius: "12px" }}
                    />
                </CardContent>
            </Card>
        ))}
    </Box>
);

// ── Search Bar Skeleton ────────────────────────────────────────────────────
export const SearchBarSkeleton = () => (
    <Paper
        elevation={0}
        className="glass-panel"
        sx={{
            p: { xs: 1.5, md: 2 },
            mb: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 2 },
        }}
    >
        <Skeleton variant="circular" width={24} height={24} animation="wave" />
        <Skeleton
            variant="text"
            width="60%"
            height={24}
            animation="wave"
            sx={{ borderRadius: 1 }}
        />
    </Paper>
);

// ── Table Skeleton ─────────────────────────────────────────────────────────
const CUSTOMER_WIDTHS = [118, 132, 107, 140, 124, 115, 135, 109];

export const TableSkeleton = ({ rows = 8 }) => (
    <TableContainer
        component={Paper}
        elevation={0}
        sx={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            bgcolor: "var(--surface)",
        }}
    >
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                        <Skeleton variant="rounded" width={20} height={20} animation="wave" />
                    </TableCell>
                    {["Job No", "Customer", "Device", "Technician", "Phone", "Amount", "Status", "Notes", "Actions"].map(
                        (col) => (
                            <TableCell key={col}>
                                <Skeleton
                                    variant="text"
                                    width={col === "Actions" ? 80 : col.length * 11}
                                    height={18}
                                    animation="wave"
                                    sx={{ borderRadius: 1 }}
                                />
                            </TableCell>
                        )
                    )}
                </TableRow>
            </TableHead>
            <TableBody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell padding="checkbox">
                            <Skeleton variant="rounded" width={20} height={20} animation="wave" />
                        </TableCell>
                        {/* Job No */}
                        <TableCell>
                            <Skeleton variant="text" width={140} height={18} animation="wave" sx={{ mb: 0.5, borderRadius: 1 }} />
                            <Skeleton variant="text" width={80} height={12} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Customer */}
                        <TableCell>
                            <Skeleton variant="text" width={CUSTOMER_WIDTHS[i % CUSTOMER_WIDTHS.length]} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Device */}
                        <TableCell>
                            <Skeleton variant="text" width={50} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Technician */}
                        <TableCell>
                            <Skeleton variant="text" width={70} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Phone */}
                        <TableCell>
                            <Skeleton variant="text" width={90} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Amount */}
                        <TableCell>
                            <Skeleton variant="text" width={45} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                            <Skeleton variant="rounded" width={75} height={24} animation="wave" sx={{ borderRadius: "12px" }} />
                        </TableCell>
                        {/* Notes */}
                        <TableCell>
                            <Skeleton variant="text" width={30} height={18} animation="wave" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        {/* Actions */}
                        <TableCell>
                            <Box display="flex" gap={0.5}>
                                {[1, 2, 3, 4].map((a) => (
                                    <Skeleton key={a} variant="circular" width={28} height={28} animation="wave" />
                                ))}
                            </Box>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

// ── Mobile Card Skeleton ───────────────────────────────────────────────────
export const MobileCardSkeleton = ({ count = 5 }) => (
    <Box sx={{ px: 0.5 }}>
        {Array.from({ length: count }).map((_, i) => (
            <Card
                key={i}
                elevation={0}
                sx={{
                    mb: 1.5,
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                }}
            >
                {/* Accent bar */}
                <Skeleton
                    variant="rectangular"
                    height={4}
                    animation="wave"
                    sx={{ bgcolor: "action.hover" }}
                />
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    {/* Header: job number + status */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Skeleton variant="rounded" width={140} height={24} animation="wave" sx={{ borderRadius: "10px" }} />
                        <Skeleton variant="rounded" width={70} height={22} animation="wave" sx={{ borderRadius: "8px" }} />
                    </Box>

                    {/* Customer name + brand */}
                    <Skeleton variant="text" width="55%" height={22} animation="wave" sx={{ mb: 0.5, borderRadius: 1 }} />
                    <Box display="flex" alignItems="center" gap={0.75} mb={1.5}>
                        <Skeleton variant="circular" width={15} height={15} animation="wave" />
                        <Skeleton variant="text" width={60} height={16} animation="wave" sx={{ borderRadius: 1 }} />
                    </Box>

                    {/* Info chips row */}
                    <Box display="flex" flexWrap="wrap" gap={0.75} mb={1.5}>
                        <Skeleton variant="rounded" width={110} height={32} animation="wave" sx={{ borderRadius: "8px" }} />
                        <Skeleton variant="rounded" width={85} height={32} animation="wave" sx={{ borderRadius: "8px" }} />
                        <Skeleton variant="rounded" width={100} height={32} animation="wave" sx={{ borderRadius: "8px" }} />
                    </Box>

                    {/* Action row */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} borderTop="1px solid" borderColor="divider">
                        <Skeleton variant="text" width={90} height={12} animation="wave" sx={{ borderRadius: 1 }} />
                        <Box display="flex" gap={1}>
                            <Skeleton variant="circular" width={40} height={40} animation="wave" />
                            <Skeleton variant="circular" width={40} height={40} animation="wave" />
                            <Skeleton variant="circular" width={40} height={40} animation="wave" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        ))}
    </Box>
);

// ── Full Page Skeleton (stat cards + search + content) ─────────────────────
export const ItemsListSkeleton = ({ isMobile = false }) => (
    <Box>
        <StatCardsSkeleton />
        <SearchBarSkeleton />
        {isMobile ? <MobileCardSkeleton /> : <TableSkeleton />}
    </Box>
);
