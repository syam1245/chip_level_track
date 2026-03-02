/**
 * PullToRefresh — touch-driven pull-to-refresh for mobile views.
 *
 * Uses raw touch events + Framer Motion for the spinner animation.
 * Only activates when the scroll container is at the very top (scrollTop === 0),
 * so it never interferes with normal scrolling.
 *
 * Props:
 *   onRefresh — async function; called when the user releases after pulling far enough.
 *   disabled  — if true, pull-to-refresh is inactive.
 *   children  — the scrollable content.
 */
import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography, CircularProgress } from "@mui/material";
import { ArrowDownward as ArrowIcon } from "@mui/icons-material";

const PULL_THRESHOLD = 80;   // px the user must pull to trigger refresh
const MAX_PULL = 130;         // cap to avoid over-stretching
const RESISTANCE = 0.45;      // damping factor — makes pull feel natural

const PullToRefresh = ({ onRefresh, disabled = false, children }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);
    const containerRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        if (disabled || refreshing) return;
        // Only activate if we're scrolled to the very top
        if (containerRef.current && containerRef.current.scrollTop > 0) return;
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
    }, [disabled, refreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling.current || disabled || refreshing) return;
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff < 0) {
            // Scrolling up — abort pull
            isPulling.current = false;
            setPullDistance(0);
            return;
        }
        // Apply resistance for a natural rubber-band feel
        const dampened = Math.min(diff * RESISTANCE, MAX_PULL);
        setPullDistance(dampened);
    }, [disabled, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || disabled) return;
        isPulling.current = false;

        if (pullDistance >= PULL_THRESHOLD && !refreshing) {
            setRefreshing(true);
            setPullDistance(PULL_THRESHOLD * 0.6); // hold spinner in view
            try {
                await onRefresh();
            } catch (_) { /* swallow — caller handles errors */ }
            setRefreshing(false);
        }
        setPullDistance(0);
    }, [pullDistance, refreshing, disabled, onRefresh]);

    const progress = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);
    const isReady = progress >= 100;

    return (
        <Box
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{ position: "relative", touchAction: "pan-y" }}
        >
            {/* Pull indicator */}
            <AnimatePresence>
                {(pullDistance > 0 || refreshing) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: pullDistance > 0 ? pullDistance : 48 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                py: 1,
                            }}
                        >
                            {refreshing ? (
                                <>
                                    <CircularProgress size={24} thickness={5} sx={{ color: "primary.main" }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                                        Refreshing...
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        animate={{ rotate: isReady ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowIcon
                                            sx={{
                                                fontSize: "1.3rem",
                                                color: isReady ? "primary.main" : "text.disabled",
                                                transition: "color 0.2s",
                                            }}
                                        />
                                    </motion.div>
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        sx={{
                                            fontSize: "0.68rem",
                                            color: isReady ? "primary.main" : "text.disabled",
                                            transition: "color 0.2s",
                                        }}
                                    >
                                        {isReady ? "Release to refresh" : "Pull down to refresh"}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <motion.div
                animate={{ y: refreshing && pullDistance === 0 ? 0 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                {children}
            </motion.div>
        </Box>
    );
};

export default React.memo(PullToRefresh);
