import { Box, Typography, Chip, Paper, CircularProgress, InputBase } from '@mui/material';
import {
    Search as SearchIcon,
    Build as BuildIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as HourglassIcon,
    GridView as AllJobsIcon
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import StatCard from "../StatCard";

const ItemsListFilters = ({
    stats,
    activeFilter,
    handleFilterChange,
    search,
    setSearch,
    loading
}) => {
    return (
        <>
            <AnimatePresence>
                <Box sx={{ position: 'relative', mb: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
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
                                subtitle: "Received · Working · Waiting · Sent"
                            },
                            {
                                key: "ready",
                                title: "Ready / Done",
                                value: stats.ready,
                                color: "#10b981",
                                icon: <CheckCircleIcon />,
                                subtitle: "Ready for pickup · Delivered"
                            },
                            {
                                key: "returned",
                                title: "Return",
                                value: stats.returned,
                                color: "#a855f7",
                                icon: <HourglassIcon />,
                                subtitle: "Awaiting customer feedback"
                            },
                            {
                                key: "all",
                                title: "All Jobs",
                                value: stats.total,
                                color: "var(--color-primary)",
                                icon: <AllJobsIcon />,
                                subtitle: "Every job in the system"
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
                {loading && <CircularProgress size={20} />}
            </Paper>
        </>
    );
};

export default ItemsListFilters;
