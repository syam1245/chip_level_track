import React from "react";
import { Dialog, DialogActions, Button, useTheme, useMediaQuery, Fade, Slide } from "@mui/material";
import { SaveAlt as SaveIcon } from "@mui/icons-material";
import { alpha } from "@mui/system";
import { STATUS_ACCENT } from "../../constants/status";

import EditJobHeader from "./EditJobHeader";
import EditJobBody from "./EditJobBody";

const SlideUp = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const EditJobDialog = ({ editItem, setEditItem, handleEditSave, isAdmin }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (!editItem) return null;

    const statusColor = STATUS_ACCENT[editItem.status] || "#94a3b8";

    return (
        <Dialog
            open={!!editItem}
            onClose={() => setEditItem(null)}
            maxWidth="sm" fullWidth fullScreen={isMobile}
            TransitionComponent={isMobile ? SlideUp : Fade}
            transitionDuration={isMobile ? 350 : 280}
            PaperProps={{
                elevation: 0,
                sx: {
                    borderRadius: isMobile ? "16px 16px 0 0" : "20px",
                    border: isMobile ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    overflow: "hidden", maxHeight: isMobile ? "100vh" : "92vh",
                    boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 24px 80px rgba(0,0,0,0.12)",
                    ...(isMobile && { position: "fixed", bottom: 0, top: "auto", m: 0, maxHeight: "95vh", height: "auto" }),
                }
            }}
            slotProps={{
                backdrop: {
                    sx: { bgcolor: isMobile ? "rgba(0,0,0,0.5)" : undefined, backdropFilter: isMobile ? "blur(4px)" : undefined }
                }
            }}
        >
            <EditJobHeader
                editItem={editItem} setEditItem={setEditItem}
                statusColor={statusColor} isMobile={isMobile} isDark={isDark}
            />

            <EditJobBody
                editItem={editItem} setEditItem={setEditItem} isAdmin={isAdmin}
                isMobile={isMobile} isDark={isDark} theme={theme} statusColor={statusColor}
            />

            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 },
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, gap: 1,
                    ...(isMobile && {
                        position: "sticky", bottom: 0, bgcolor: isDark ? "rgba(18,18,18,0.95)" : "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(12px)", pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
                        flexDirection: "row", zIndex: 10,
                    }),
                }}
            >
                <Button
                    onClick={() => setEditItem(null)}
                    sx={{
                        color: "text.secondary", borderRadius: "12px", textTransform: "none", fontWeight: 600,
                        px: 2.5, py: { xs: 1.2, sm: 1 }, flex: isMobile ? 1 : "none", fontSize: { xs: "0.9rem", sm: "0.875rem" },
                        border: isMobile ? `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` : "none",
                        "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained" onClick={handleEditSave} startIcon={<SaveIcon sx={{ fontSize: "1.1rem !important" }} />}
                    sx={{
                        borderRadius: "12px", textTransform: "none", fontWeight: 700, px: 3, py: { xs: 1.2, sm: 1 },
                        flex: isMobile ? 2 : "none", fontSize: { xs: "0.9rem", sm: "0.875rem" },
                        background: `linear-gradient(135deg, ${statusColor}, ${alpha(statusColor, 0.8)})`, boxShadow: `0 4px 14px ${alpha(statusColor, 0.35)}`,
                        "&:hover": { background: `linear-gradient(135deg, ${statusColor}, ${statusColor})`, boxShadow: `0 6px 20px ${alpha(statusColor, 0.5)}` }
                    }}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(EditJobDialog);
