import React, { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    CircularProgress,
    Box,
    Typography,
    Button,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    CameraAlt as CameraIcon,
    AutoFixHigh as MagicIcon
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { authFetch } from '../../api';

const optimizeImage = (dataUrl, maxWidth = 1024) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = dataUrl;
    });
};

const VisionScannerDialog = ({ open, onClose, onExtractSuccess, onExtractError }) => {
    const [visionLoading, setVisionLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        optimizeImage(imageSrc).then(optimizedSrc => {
            setCapturedImage(optimizedSrc);
        });
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                optimizeImage(reader.result).then(optimizedSrc => {
                    setCapturedImage(optimizedSrc);
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVisionExtract = async () => {
        if (!capturedImage) return;
        setVisionLoading(true);
        try {
            const res = await authFetch("/api/vision/extract", {
                method: "POST",
                body: JSON.stringify({ image: capturedImage }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                onExtractSuccess(data.data);
                setCapturedImage(null);
            } else {
                const errorMsg = data.error || data.message || "Extraction failed.";
                onExtractError(`❌ ${errorMsg}`);
            }
        } catch (err) {
            onExtractError("Error connecting to vision service.");
        } finally {
            setVisionLoading(false);
        }
    };

    const handleClose = () => {
        if (!visionLoading) {
            setCapturedImage(null);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: "var(--radius)", overflow: "hidden" }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant="h6" fontWeight="800">Scan Repair Info</Typography>
                <IconButton onClick={handleClose} disabled={visionLoading} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, minHeight: 300, bgcolor: '#000', position: 'relative' }}>
                {capturedImage ? (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
                        <img src={capturedImage} alt="Captured" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                        {visionLoading && (
                            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', flexWrap: 'wrap', placeContent: 'center', gap: 2, color: '#fff', zIndex: 2 }}>
                                <CircularProgress color="inherit" />
                                <Typography variant="h6" fontWeight="700">Analyzing the image...</Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current.click()}
                    disabled={visionLoading}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Upload
                </Button>
                <Stack direction="row" spacing={1}>
                    {capturedImage ? (
                        <Button
                            variant="outlined"
                            onClick={() => setCapturedImage(null)}
                            disabled={visionLoading}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Retake
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={capture}
                            startIcon={<CameraIcon />}
                            disabled={visionLoading}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                        >
                            Capture
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleVisionExtract}
                        disabled={!capturedImage || visionLoading}
                        startIcon={<MagicIcon />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                            "&:hover": { background: "linear-gradient(135deg, #4f46e5, #2563eb)" }
                        }}
                    >
                        Analyze with AI
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export default VisionScannerDialog;
