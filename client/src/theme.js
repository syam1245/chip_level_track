import { createTheme, alpha } from "@mui/material/styles";

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: {
            main: mode === "dark" ? "#60a5fa" : "#2563eb", // Blue 400 : Blue 600
            light: mode === "dark" ? "#93c5fd" : "#3b82f6",
            dark: mode === "dark" ? "#3b82f6" : "#1d4ed8",
            contrastText: "#ffffff",
        },
        secondary: {
            main: mode === "dark" ? "#a78bfa" : "#7c3aed", // Violet 400 : Violet 600
            light: mode === "dark" ? "#c4b5fd" : "#8b5cf6",
            dark: mode === "dark" ? "#8b5cf6" : "#6d28d9",
            contrastText: "#ffffff",
        },
        background: {
            default: mode === "dark" ? "#0f172a" : "#f8fafc", // Slate 900 : Slate 50
            paper: mode === "dark" ? "#1e293b" : "#ffffff", // Slate 800 : White
        },
        text: {
            primary: mode === "dark" ? "#f8fafc" : "#0f172a", // Slate 50 : Slate 900
            secondary: mode === "dark" ? "#94a3b8" : "#475569", // Slate 400 : Slate 600
            disabled: mode === "dark" ? "#475569" : "#94a3b8", // Slate 600 : Slate 400
        },
        success: {
            main: mode === "dark" ? "#34d399" : "#10b981", // Emerald 400 : Emerald 500
            light: mode === "dark" ? alpha("#34d399", 0.15) : alpha("#10b981", 0.15),
            dark: mode === "dark" ? "#059669" : "#047857",
        },
        error: {
            main: mode === "dark" ? "#f87171" : "#ef4444", // Red 400 : Red 500
            light: mode === "dark" ? alpha("#f87171", 0.15) : alpha("#ef4444", 0.15),
            dark: mode === "dark" ? "#dc2626" : "#b91c1c",
        },
        warning: {
            main: mode === "dark" ? "#fbbf24" : "#f59e0b", // Amber 400 : Amber 500
            light: mode === "dark" ? alpha("#fbbf24", 0.15) : alpha("#f59e0b", 0.15),
            dark: mode === "dark" ? "#d97706" : "#b45309",
        },
        info: {
            main: mode === "dark" ? "#38bdf8" : "#0ea5e9", // Sky 400 : Sky 500
            light: mode === "dark" ? alpha("#38bdf8", 0.15) : alpha("#0ea5e9", 0.15),
            dark: mode === "dark" ? "#0284c7" : "#0369a1",
        },
        divider: mode === "dark" ? "#334155" : "#e2e8f0", // Slate 700 : Slate 200
        action: {
            hover: mode === "dark" ? alpha("#f8fafc", 0.08) : alpha("#0f172a", 0.04),
            selected: mode === "dark" ? alpha("#60a5fa", 0.16) : alpha("#2563eb", 0.08),
        },
    },
    typography: {
        fontFamily: [
            "Inter",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
        ].join(","),
        h1: { fontWeight: 800, letterSpacing: "-0.025em" },
        h2: { fontWeight: 800, letterSpacing: "-0.025em" },
        h3: { fontWeight: 700, letterSpacing: "-0.025em" },
        h4: { fontWeight: 700, letterSpacing: "-0.025em" },
        h5: { fontWeight: 600, letterSpacing: "-0.015em" },
        h6: { fontWeight: 600, letterSpacing: "-0.015em" },
        button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
        body1: { lineHeight: 1.6 },
        body2: { lineHeight: 1.6 },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: "none",
                    fontWeight: 600,
                    padding: "8px 20px",
                    transition: "all 0.2s ease-in-out",
                    "&:active": {
                        transform: "scale(0.97)",
                    },
                },
                containedPrimary: {
                    boxShadow: mode === "dark"
                        ? "0 4px 14px 0 rgba(96, 165, 250, 0.39)"
                        : "0 4px 14px 0 rgba(37, 99, 235, 0.39)",
                    "&:hover": {
                        boxShadow: mode === "dark"
                            ? "0 6px 20px rgba(96, 165, 250, 0.23)"
                            : "0 6px 20px rgba(37, 99, 235, 0.23)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
                elevation1: {
                    boxShadow: mode === "dark"
                        ? "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    backgroundImage: "none",
                    border: `1px solid ${mode === "dark" ? "#334155" : "#e2e8f0"}`,
                    boxShadow: mode === "dark"
                        ? "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)"
                        : "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: `1px solid ${mode === "dark" ? "#334155" : "#e2e8f0"}`,
                },
                head: {
                    fontWeight: 700,
                    backgroundColor: mode === "dark" ? "#0f172a" : "#f8fafc",
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    transition: "background-color 0.3s ease, color 0.3s ease",
                    "&::-webkit-scrollbar": {
                        width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                        background: mode === "dark" ? "#0f172a" : "#f1f5f9",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: mode === "dark" ? "#334155" : "#cbd5e1",
                        borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                        background: mode === "dark" ? "#475569" : "#94a3b8",
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 12,
                        transition: "all 0.2s ease-in-out",
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                },
            },
        },
    },
});

export const lightTheme = createTheme(getDesignTokens("light"));
export const darkTheme = createTheme(getDesignTokens("dark"));
