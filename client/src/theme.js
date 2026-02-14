import { createTheme } from "@mui/material/styles";

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: {
            main: mode === "dark" ? "#2997ff" : "#0071e3", // Apple-like Blue
        },
        secondary: {
            main: mode === "dark" ? "#86868b" : "#86868b", // Apple-like Gray
        },
        background: {
            default: mode === "dark" ? "#000000" : "#f5f5f7",
            paper: mode === "dark" ? "#1c1c1e" : "#ffffff",
        },
        text: {
            primary: mode === "dark" ? "#f5f5f7" : "#1d1d1f",
            secondary: mode === "dark" ? "#86868b" : "#86868b",
        },
        success: {
            main: mode === "dark" ? "#30d158" : "#34c759",
        },
        error: {
            main: mode === "dark" ? "#ff453a" : "#ff3b30",
        },
        warning: {
            main: mode === "dark" ? "#ff9f0a" : "#ff9500",
        },
        info: {
            main: mode === "dark" ? "#64d2ff" : "#5ac8fa",
        },
    },
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
        ].join(","),
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 500 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20, // Rounded but not full pill for all buttons, unless pill requested. Let's do rounded rect like Apple.
                    textTransform: "none",
                    fontWeight: 600,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'dark'
                        ? '0 4px 24px -1px rgba(0, 0, 0, 0.4)'
                        : '0 4px 24px -1px rgba(0, 0, 0, 0.04)', // Softer shadows
                }
            }
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                }
            }
        }
    },
});

export const lightTheme = createTheme(getDesignTokens("light"));
export const darkTheme = createTheme(getDesignTokens("dark"));
