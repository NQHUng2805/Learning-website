import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadEmotionModel, predictEmotion, isModelLoaded } from './emotionmodel.js';

// State variables
let isCameraOn = false;
let missingFaceSeconds = 0;
let emotionCounts = {};
let totalFrames = 0;
let currentMissingStreak = 0;
let videoElement = null;
let monitoringInterval = null;
let statusCallback = null;

const WARNING_THRESHOLD = 5; // Warning if face missing for more than 5 seconds continuously
const emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'];

/**
 * Initialize monitoring system
 * @param {HTMLVideoElement} video - Video element for camera stream
 * @param {Function} onStatusChange - Callback for status updates
 * @returns {Promise<void>}
 */
export async function initializeMonitoring(video, onStatusChange = null) {
    if (!video) {
        throw new Error('Video element is required');
    }
    
    videoElement = video;
    statusCallback = onStatusChange;
    
    // Load emotion model if not already loaded
    if (!isModelLoaded()) {
        await loadEmotionModel();
    }
}

/**
 * Start monitoring
 */
export function startMonitoring() {
    if (!videoElement) {
        throw new Error('Monitoring not initialized. Call initializeMonitoring() first.');
    }
    
    if (isCameraOn) {
        return; // Already monitoring
    }
    
    isCameraOn = true;
    resetStats();
    
    // Start prediction loop
    predictEmotionLoop();
}

/**
 * Stop monitoring
 */
export function stopMonitoring() {
    isCameraOn = false;
    if (monitoringInterval) {
        clearTimeout(monitoringInterval);
        monitoringInterval = null;
    }
}

/**
 * Reset statistics
 */
export function resetStats() {
    missingFaceSeconds = 0;
    emotionCounts = {};
    totalFrames = 0;
    currentMissingStreak = 0;
}

/**
 * Main prediction loop
 */
async function predictEmotionLoop() {
    if (!isCameraOn || !videoElement) {
        return;
    }

    try {
        // Get image from webcam
        const tensor = tf.browser.fromPixels(videoElement)
            .resizeNearestNeighbor([96, 96])
            .mean(2)
            .toFloat()
            .expandDims(0)
            .expandDims(-1)
            .div(tf.scalar(255.0));

        const prediction = await predictEmotion(tensor);
        tensor.dispose();

        const maxScore = Math.max(...prediction);
        
        if (maxScore < 0.4) {
            handleFaceMissing();
        } else {
            handleFaceDetected(prediction);
        }

    } catch (err) {
        console.error('AI prediction error:', err);
        if (statusCallback) {
            statusCallback({ 
                status: 'error', 
                message: 'AI monitoring error: ' + err.message 
            });
        }
    }

    // Schedule next prediction
    if (isCameraOn) {
        monitoringInterval = setTimeout(predictEmotionLoop, 1000);
    }
}

/**
 * Handle face missing
 */
function handleFaceMissing() {
    missingFaceSeconds++;
    currentMissingStreak++;
    
    const status = {
        status: 'face_missing',
        message: `WARNING: Face not detected! (${missingFaceSeconds}s total)`,
        faceMissingDuration: missingFaceSeconds,
        currentStreak: currentMissingStreak
    };
    
    if (statusCallback) {
        statusCallback(status);
    }

    if (currentMissingStreak > WARNING_THRESHOLD) {
        if (statusCallback) {
            statusCallback({
                status: 'critical_warning',
                message: 'Please return to camera view!'
            });
        }
        currentMissingStreak = 0; // Reset to avoid continuous alerts
    }
}

/**
 * Handle face detected
 */
function handleFaceDetected(prediction) {
    currentMissingStreak = 0;
    totalFrames++;

    const maxIndex = prediction.indexOf(Math.max(...prediction));
    const emotion = emotions[maxIndex];

    if (emotionCounts[emotion]) {
        emotionCounts[emotion]++;
    } else {
        emotionCounts[emotion] = 1;
    }

    if (statusCallback) {
        statusCallback({
            status: 'monitoring',
            message: `Monitoring: ${emotion}`,
            currentEmotion: emotion
        });
    }
}

/**
 * Get exam logs for submission
 * @returns {Object} Exam logs with face missing duration and emotion stats
 */
export function getExamLogs() {
    const stats = {};
    for (const emo in emotionCounts) {
        if (totalFrames > 0) {
            stats[emo] = Math.round((emotionCounts[emo] / totalFrames) * 100) + "%";
        } else {
            stats[emo] = "0%";
        }
    }

    return {
        faceMissingDuration: missingFaceSeconds,
        emotionStats: stats,
        totalFrames: totalFrames,
        timestamp: new Date().toISOString()
    };
}

/**
 * Get current monitoring status
 * @returns {Object}
 */
export function getMonitoringStatus() {
    return {
        isMonitoring: isCameraOn,
        missingFaceSeconds,
        emotionCounts,
        totalFrames
    };
}