/**
 * Face detection using face-api.js
 * Note: This module is available for future use but not currently integrated
 * into the monitoring system which uses emotion detection only.
 */

// Uncomment when face-api.js is installed
// import * as faceapi from 'face-api.js';

/**
 * Load face detection model
 * @returns {Promise<void>}
 */
export async function loadFaceModel() {
  // Uncomment when face-api.js is installed
  // await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  throw new Error('face-api.js not installed. Install with: npm install face-api.js');
}

/**
 * Detect face in video element
 * @param {HTMLVideoElement} video - Video element
 * @returns {Promise<Object|null>} Face detection result
 */
export async function detectFace(video) {
  // Uncomment when face-api.js is installed
  // return await faceapi.detectSingleFace(
  //   video,
  //   new faceapi.TinyFaceDetectorOptions()
  // );
  throw new Error('face-api.js not installed. Install with: npm install face-api.js');
}
