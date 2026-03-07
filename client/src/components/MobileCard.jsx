import React, { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { Card, Box } from "@mui/material";

import { STATUS_ACCENT } from "../constants/status";
import { getAgingInfo } from "../utils/aging";

import MobileActionPanel from "./MobileActionPanel";
import MobileCardContent from "./MobileCardContent";

const SWIPE_THRESHOLD = 80;  // px needed to lock actions open
const ACTION_WIDTH = 220;     // width of the revealed action panel

const MobileCard = React.memo(({ item, onWhatsApp, onAIGenerateWhatsApp, onPrint, onEdit, onDelete, canDelete, onOpenSummary }) => {
    const aging = getAgingInfo(item);
    const [isOpen, setIsOpen] = useState(false);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Reveal bg opacity based on drag distance
    const actionOpacity = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.5, 0]);

    const handleDragEnd = useCallback((_, info) => {
        const offsetX = info.offset.x;
        if (offsetX < -SWIPE_THRESHOLD && !isOpen) {
            // Swipe left — reveal actions
            controls.start({ x: -ACTION_WIDTH, transition: { type: "spring", stiffness: 500, damping: 35 } });
            setIsOpen(true);
        } else {
            // Snap back
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 35 } });
            setIsOpen(false);
        }
    }, [isOpen, controls]);

    const closeActions = useCallback(() => {
        controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 35 } });
        setIsOpen(false);
    }, [controls]);

    return (
        <Box sx={{ position: "relative", mb: 1.5, overflow: "hidden", borderRadius: "var(--radius)" }}>
            {/* ── Swipe-reveal actions (behind the card) ───────────────── */}
            <motion.div
                style={{
                    position: "absolute", top: 0, right: 0, bottom: 0,
                    width: ACTION_WIDTH, display: "flex", alignItems: "stretch",
                    opacity: actionOpacity, zIndex: 0,
                    borderRadius: "0 var(--radius) var(--radius) 0", overflow: "hidden",
                }}
            >
                <MobileActionPanel
                    item={item}
                    onWhatsApp={onWhatsApp}
                    onAIGenerateWhatsApp={onAIGenerateWhatsApp}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canDelete={canDelete}
                    closeActions={closeActions}
                    onOpenSummary={() => { closeActions(); onOpenSummary(item); }}
                />
            </motion.div>

            {/* ── Main card (draggable) ─────────────────────────────── */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, position: "relative", zIndex: 1, touchAction: "pan-y" }}
            >
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)",
                        border: aging.isAging ? `1px solid ${aging.color}40` : "1px solid var(--border)",
                        overflow: "hidden", position: "relative", userSelect: "none",
                    }}
                >
                    {/* Status accent bar */}
                    <Box sx={{ height: "4px", background: aging.isAging ? aging.color : STATUS_ACCENT[item.status] || "#94a3b8" }} />

                    <MobileCardContent
                        item={item}
                        aging={aging}
                        onWhatsApp={onWhatsApp}
                        onPrint={onPrint}
                        onEdit={onEdit}
                    />
                </Card>
            </motion.div>
        </Box>
    );
});

export default MobileCard;
