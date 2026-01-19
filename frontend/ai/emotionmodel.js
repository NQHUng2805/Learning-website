import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let model = null;
let modelLoadPromise = null;

/**
 * Loads the emotion detection model
 * @returns {Promise<void>}
 */
export async function loadEmotionModel() {
  if (!model && !modelLoadPromise) {
    modelLoadPromise = tf.loadLayersModel('/web_model/model.json')
      .then(loadedModel => {
        model = loadedModel;
        console.log('✅ AI emotion model loaded');
        return model;
      })
      .catch(err => {
        console.error('❌ Failed to load AI model:', err);
        modelLoadPromise = null;
        throw err;
      });
  }
  if (modelLoadPromise) await modelLoadPromise;
  return model;
}

// Auto-preload model when module is imported
if (typeof window !== 'undefined') {
  loadEmotionModel().catch(() => {});
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
