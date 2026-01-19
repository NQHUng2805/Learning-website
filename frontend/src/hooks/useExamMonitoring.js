import { useState, useEffect, useRef, useCallback } from 'react';
import * as monitoring from '../../ai/monitor.js';

/**
 * React hook for exam monitoring with AI face and emotion detection
 * @returns {Object} Monitoring state and controls
 */
export function useExamMonitoring() {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState({ status: 'idle', message: '' });
    const [logs, setLogs] = useState(null);
    
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    /**
     * Handle status updates from monitoring system
     */
    const handleStatusChange = useCallback((newStatus) => {
        setStatus(newStatus);
    }, []);

    /**
     * Request camera access and initialize video stream
     */
    const initializeCamera = useCallback(async () => {
        try {
            setError(null);
            
            // Check if mediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;

            // Set video element source
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            } else {
                throw new Error('Video element not available');
            }

            // Camera is ready - user can start exam
            setIsCameraReady(true);
            setStatus({ status: 'ready', message: 'Camera ready' });
            
            // Load AI model in background (don't block camera)
            monitoring.initializeMonitoring(videoRef.current, handleStatusChange).catch(err => {
                console.error('Model loading error:', err);
                setError('AI model failed to load, but camera is active');
            });
        } catch (err) {
            console.error('Camera initialization error:', err);
            let errorMessage = 'Failed to initialize camera';
            
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access to take the exam.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Camera does not support the required settings.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            setStatus({ status: 'error', message: errorMessage });
            setIsCameraReady(false);
        }
    }, [handleStatusChange]);

    /**
     * Start monitoring
     */
    const startMonitoring = useCallback(() => {
        if (!isCameraReady) {
            setError('Camera not ready. Please initialize camera first.');
            return;
        }

        try {
            monitoring.startMonitoring();
            setIsMonitoring(true);
            setStatus({ status: 'monitoring', message: 'Monitoring started' });
        } catch (err) {
            console.error('Start monitoring error:', err);
            setError(err.message);
            setStatus({ status: 'error', message: err.message });
        }
    }, [isCameraReady]);

    /**
     * Stop monitoring
     */
    const stopMonitoring = useCallback(() => {
        try {
            monitoring.stopMonitoring();
            setIsMonitoring(false);
            setStatus({ status: 'stopped', message: 'Monitoring stopped' });
        } catch (err) {
            console.error('Stop monitoring error:', err);
        }
    }, []);

    /**
     * Get current logs
     */
    const getLogs = useCallback(() => {
        const currentLogs = monitoring.getExamLogs();
        setLogs(currentLogs);
        return currentLogs;
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            // Stop monitoring
            if (isMonitoring) {
                monitoring.stopMonitoring();
            }
            
            // Stop camera stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            // Clear video source
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [isMonitoring]);

    return {
        videoRef,
        isCameraReady,
        isMonitoring,
        error,
        status,
        logs,
        initializeCamera,
        startMonitoring,
        stopMonitoring,
        getLogs
    };
}
