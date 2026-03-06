/**
 * useItemsActions — handles item CRUD actions, WhatsApp, print, bulk operations,
 * and backup download. Separated from data-fetching concerns.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import API_BASE_URL from "../../api";
import { updateItem, deleteItem, bulkUpdateStatus, bulkDeleteItems } from "../../services/items.api";
import { generateWhatsAppMessage } from "../../utils/whatsapp";

export default function useItemsActions({ items, setItems, setSnackbar, refetch, notify }) {
    // ── Dialog state ───────────────────────────────────────────────────
    const [editItem, setEditItem] = useState(null);
    const [printItem, setPrintItem] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // ── Bulk selection ─────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState("");

    const onSelectChange = useCallback((id, checked) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setBulkStatus("");
    }, []);

    // ── Print ──────────────────────────────────────────────────────────
    const printComponentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: printComponentRef,
        documentTitle: printItem ? `JobSheet_${printItem.jobNumber}` : "JobSheet",
        onAfterPrint: () => setPrintItem(null),
    });

    useEffect(() => {
        if (printItem && printComponentRef.current) handlePrint();
    }, [printItem, handlePrint]);

    // ── Delete ─────────────────────────────────────────────────────────
    const handleDelete = useCallback((id) => setDeleteConfirmId(id), []);

    const confirmDelete = async () => {
        const id = deleteConfirmId;
        setDeleteConfirmId(null);
        try {
            const { ok } = await deleteItem(id);
            if (ok) {
                setItems((prev) => prev.filter((item) => item._id !== id));
                setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
                refetch();
            } else {
                setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
            }
        } catch {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    };

    // ── Edit / Save ────────────────────────────────────────────────────
    const handleEditSave = async () => {
        if (!editItem) return;
        const prevStatus = items.find((i) => i._id === editItem._id)?.status;

        try {
            const { ok, error } = await updateItem(editItem._id, editItem);
            if (ok) {
                setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
                if (editItem.status && editItem.status !== prevStatus) {
                    notify(
                        `Job ${editItem.jobNumber} — ${editItem.status}`,
                        { body: `${editItem.customerName} · ${editItem.brand}` }
                    );
                }
                setEditItem(null);
                refetch();
            } else {
                setSnackbar({ open: true, message: error || "Update failed", severity: "error" });
            }
        } catch {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    };

    // ── WhatsApp ───────────────────────────────────────────────────────
    const handleWhatsApp = useCallback((item) => {
        // Strip everything but digits
        let cleanNumber = String(item.phoneNumber || "").replace(/\D/g, "");
        // If the number doesn't start with 91 and looks like a standard 10-digit Indian mobile, append it
        if (cleanNumber.length === 10 && !cleanNumber.startsWith("91")) {
            cleanNumber = `91${cleanNumber}`;
        }
        const message = generateWhatsAppMessage(item);
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
    }, []);

    // ── Backup ─────────────────────────────────────────────────────────
    const downloadBackup = useCallback(() => {
        window.open(`${API_BASE_URL}/api/items/backup`, "_blank");
    }, []);

    // ── Bulk status update ─────────────────────────────────────────────
    const handleBulkApply = useCallback(async () => {
        if (!bulkStatus || selectedIds.size === 0) return;
        try {
            const { ok, data, error } = await bulkUpdateStatus([...selectedIds], bulkStatus);
            if (ok) {
                setSnackbar({ open: true, message: `${data.modifiedCount} job(s) updated to "${bulkStatus}"`, severity: "success" });
                clearSelection();
                refetch();
            } else {
                setSnackbar({ open: true, message: error || "Bulk update failed", severity: "error" });
            }
        } catch {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    }, [bulkStatus, selectedIds, clearSelection, refetch, setSnackbar]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} jobs? This action cannot be undone.`)) return;

        try {
            const { ok, data, error } = await bulkDeleteItems([...selectedIds]);
            if (ok) {
                setSnackbar({ open: true, message: `Successfully deleted ${data.deletedCount} job(s)`, severity: "success" });
                clearSelection();
                refetch();
            } else {
                setSnackbar({ open: true, message: error || "Bulk delete failed", severity: "error" });
            }
        } catch {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    }, [selectedIds, clearSelection, refetch, setSnackbar]);

    return {
        // Edit
        editItem, setEditItem, handleEditSave,
        // Delete
        deleteConfirmId, setDeleteConfirmId, handleDelete, confirmDelete,
        // Print
        printItem, setPrintItem, printComponentRef,
        // Bulk
        selectedIds, bulkStatus, setBulkStatus, onSelectChange, clearSelection, handleBulkApply, handleBulkDelete,
        // Misc actions
        handleWhatsApp, downloadBackup,
    };
}
