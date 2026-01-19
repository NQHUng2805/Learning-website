// POST /attempts/:id/proctoring
export const logProctoring = async (req, res) => {
  const { interval, cameraOn, faceDetected, emotion, tabSwitched } = req.body;

  const attempt = await ExamAttempt.findById(req.params.id);
  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  // 1️⃣ Camera
  if (!cameraOn) {
    attempt.proctoring.cameraOffSeconds += interval;
  }

  // 2️⃣ Face
  if (!faceDetected) {
    attempt.proctoring.faceMissingSeconds += interval;
  }

  // 3️⃣ Emotion
  if (faceDetected && emotion) {
    attempt.proctoring.emotions[emotion] += interval;
  }

  // 4️⃣ Tab switch
  if (tabSwitched) {
    attempt.proctoring.tabSwitchCount += 1;
  }

  // 5️⃣ Frames count
  attempt.proctoring.framesAnalyzed += 1;

  await attempt.save();

  return res.json({ success: true });
};