import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let model = null;

/**
 * Loads the emotion detection model
 * @returns {Promise<void>}
 */
export async function loadEmotionModel() {
  if (!model) {
    model = await tf.loadLayersModel('/web_model/model.json');
  }
  return model;
}

/**
 * Predicts emotion from a face tensor
 * @param {tf.Tensor} faceTensor - Preprocessed face tensor
 * @returns {Promise<number[]>} - Array of emotion probabilities
 */
export async function predictEmotion(faceTensor) {
  if (!model) {
    throw new Error('Emotion model not loaded. Call loadEmotionModel() first.');
  }
  const preds = model.predict(faceTensor);
  const data = await preds.data();
  preds.dispose();
  return Array.from(data);
}

/**
 * Gets the current model instance
 * @returns {tf.LayersModel|null}
 */
export function getModel() {
  return model;
}

/**
 * Checks if model is loaded
 * @returns {boolean}
 */
export function isModelLoaded() {
  return model !== null;
}
