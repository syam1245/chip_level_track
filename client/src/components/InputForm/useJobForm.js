import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createItem } from "../../services/items.api";
import { jobCreateSchema } from "chip-level-track-shared";

export default function useJobForm() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        jobNumber: "", customerName: "", brand: "",
        phoneNumber: "", issue: "",
    });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [visionOpen, setVisionOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phoneNumber" && !/^\d*$/.test(value)) return;

        let finalValue = value;
        if (name === "customerName" || name === "issue") {
            finalValue = value.toUpperCase();
        }
        setForm((prev) => ({ ...prev, [name]: finalValue }));
    };

    const handleBrandChange = (_event, newValue) => setForm((prev) => ({ ...prev, brand: newValue }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Zod Pre-flight Validation
        const result = jobCreateSchema.safeParse(form);
        if (!result.success) {
            // Grab the first error message to display in the snackbar
            const errorMessage = result.error.errors[0]?.message || "Validation failed";
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
            return;
        }

        setLoading(true);
        try {
            await createItem(form);
            setSnackbar({ open: true, message: "✅ Job created! Redirecting...", severity: "success" });
            setForm({ jobNumber: "", customerName: "", brand: "", phoneNumber: "", issue: "" });
            setTimeout(() => navigate("/items"), 1500);
        } catch (err) {
            setSnackbar({ open: true, message: err.message || "Failed to save data.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleVisionExtractSuccess = (extracted) => {
        setForm((prev) => ({
            ...prev,
            jobNumber: extracted.jobNumber || prev.jobNumber,
            customerName: extracted.customerName || prev.customerName,
            brand: extracted.brand || prev.brand,
            phoneNumber: extracted.phoneNumber || prev.phoneNumber,
            issue: extracted.issue || prev.issue,
        }));
        setSnackbar({ open: true, message: "✨ Data extracted successfully!", severity: "success" });
        setVisionOpen(false);
    };

    const handleVisionExtractError = (errorMsg) => setSnackbar({ open: true, message: errorMsg, severity: "error" });

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    return {
        form, setForm, loading, snackbar, setSnackbar, visionOpen, setVisionOpen,
        handleChange, handleBrandChange, handleSubmit,
        handleVisionExtractSuccess, handleVisionExtractError, handleCloseSnackbar,
        navigate,
    };
}
