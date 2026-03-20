import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { ErrorOutline as ErrorIcon } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "100vh",
                        bgcolor: "background.default",
                        p: 3,
                    }}
                >
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 4, md: 6 },
                            maxWidth: 500,
                            textAlign: "center",
                            borderRadius: "var(--radius, 16px)",
                            bgcolor: "var(--surface, background.paper)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                        <Typography variant="h4" fontWeight="800" gutterBottom>
                            Oops! Something went wrong.
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                            We're sorry, but the application encountered an unexpected error.
                            Please try reloading the page or go back to the dashboard.
                        </Typography>
                        {/* Only show error details in development or if useful */}
                        {import.meta.env.MODE !== "production" && this.state.error && (
                            <Box
                                sx={{
                                    mb: 4,
                                    p: 2,
                                    bgcolor: "error.light",
                                    color: "error.dark",
                                    borderRadius: 1,
                                    textAlign: "left",
                                    overflowX: "auto",
                                    fontSize: "0.8rem",
                                    fontFamily: "monospace",
                                }}
                            >
                                {this.state.error.toString()}
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={this.handleReload}
                            sx={{ fontWeight: "bold", borderRadius: 2, px: 4 }}
                        >
                            Refresh Page
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
