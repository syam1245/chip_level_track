import React from 'react';
import { Box, Typography, Chip, Paper, CircularProgress, InputBase } from '@mui/material';
import {
    Search as SearchIcon,
    Build as BuildIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as HourglassIcon,
    GridView as AllJobsIcon,
    WarningAmber as WarningIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import StatCard from "../StatCard";

const ItemsListFilters = ({
    stats,
    activeFilter,
    handleFilterChange,
    search,
    setSearch,
    loading,
    searchInputRef
}) => {
    const agingCount = stats.agingSummary?.total || 0;

    return (
        <>
            <AnimatePresence>
                <Box sx={{ position: 'relative', mb: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
                            gap: { xs: 1.5, md: 2 },
                        }}
                    >
                        {[
                            {
                                key: "inProgress",
                                title: "In Progress",
                                value: stats.inProgress,
                                color: "#f59e0b",
                                icon: <BuildIcon />,
                            },
                            {
                                key: "ready",
                                title: "Ready / Done",
                                value: stats.ready,
                                color: "#10b981",
                                icon: <CheckCircleIcon />,
                            },
                            {
                                key: "returned",
                                title: "Return",
                                value: stats.returned,
                                color: "#a855f7",
                                icon: <HourglassIcon />,
                            },
                            {
                                key: "all",
                                title: "All Jobs",
                                value: stats.total,
                                color: "var(--color-primary)",
                                icon: <AllJobsIcon />,
                            },
                        ].map((stat) => (
                            <StatCard
                                key={stat.key}
                                title={stat.title}
                                value={stat.value}
                                color={stat.color}
                                icon={stat.icon}
                                isActive={activeFilter === stat.key}
                                onClick={() => handleFilterChange(stat.key)}
                            />
                        ))}
                        <Box
                            sx={{
                                position: 'relative',
                                animation: agingCount > 0 ? 'agingCardGlow 3s ease-in-out infinite' : 'none',
                                '@keyframes agingCardGlow': {
                                    '0%, 100%': { filter: 'drop-shadow(0 0 0px transparent)' },
                                    '50%': { filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.3))' },
                                },
                            }}
                        >
                            <StatCard
                                title="Needs Attention"
                                value={agingCount}
                                color={agingCount > 0 ? "#f97316" : "#94a3b8"}
                                icon={<WarningIcon />}
                                isActive={false}
                                onClick={() => { }}
                            />
                        </Box>
                    </Box>

                    {activeFilter !== "all" && (
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Showing filtered results —
                            </Typography>
                            <Chip
                                label={`Clear filter`}
                                size="small"
                                onDelete={() => handleFilterChange("all")}
                                sx={{ fontWeight: 600, fontSize: '0.7rem', height: '22px' }}
                            />
                        </Box>
                    )}

                    {agingCount > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Aging breakdown:
                            </Typography>
                            {stats.agingSummary?.attention > 0 && (
                                <Chip
                                    label={`${stats.agingSummary.attention} approaching SLA`}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}
                                />
                            )}
                            {stats.agingSummary?.overdue > 0 && (
                                <Chip
                                    label={`${stats.agingSummary.overdue} overdue`}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: '#f9731618', color: '#f97316', border: '1px solid #f9731630' }}
                                />
                            )}
                            {stats.agingSummary?.critical > 0 && (
                                <Chip
                                    label={`${stats.agingSummary.critical} critical`}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </AnimatePresence>

            <Paper
                elevation={0}
                className="glass-panel"
                sx={{
                    p: { xs: 1.5, md: 2 },
                    mb: { xs: 2, md: 4 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, md: 2 }
                }}
            >
                <SearchIcon color="action" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }} />
                <InputBase
                    inputRef={searchInputRef}
                    sx={{
                        width: '100%',
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        color: 'var(--text-main)',
                        '& .MuiInputBase-input::placeholder': {
                            fontSize: { xs: '0.85rem', md: '1rem' },
                        }
                    }}
                    placeholder="Search by Customer, Job Number, Brand or Phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <Chip
                        label="Searching all jobs"
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={() => setSearch("")}
                        deleteIcon={<CloseIcon sx={{ fontSize: '0.85rem !important' }} />}
                        sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, flexShrink: 0, mr: 0.5 }}
                    />
                )}
                {loading && <CircularProgress size={20} />}
            </Paper>
        </>
    );
};

export default ItemsListFilters;
