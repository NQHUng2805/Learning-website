import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken, isAdmin, isTeacher } from '../middleware/authMiddleware.js'; 
import otpController from '../controllers/otpController.js';
import resetPasswordController from '../controllers/resetPasswordController.js';

import { 
    loginLimiter, 
    registrationLimiter, 
    otpRequestLimiter, 
    otpVerificationLimiter, 
    passwordResetLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Authentication routes
router.post('/register-pending', registrationLimiter, authController.registerPending);
router.post('/register', otpVerificationLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Reset password routes
router.post('/reset-password', passwordResetLimiter, resetPasswordController.resetPassword);

// Google OAuth route
router.post('/google', authController.loginWithGoogle);

// OTP routes
router.post('/otp/request', otpRequestLimiter, otpController.requestOTP);
router.post('/otp/verify', otpVerificationLimiter, otpController.verifyOtp);

// User management routes
router.post('/logout', authController.logout);
router.get('/user', authenticateToken, authController.getCurrentUser); 
router.put('/profile', authenticateToken, authController.updateProfile); 
router.put('/change-password', authenticateToken, authController.changePassword); 
router.post('/refresh', authController.refresh);
router.get('/experience', authenticateToken, authController.getExperience);

// Get students (Teachers and Admins can access)
router.get('/students', authenticateToken, isTeacher, authController.getStudents);

// ⚠️ IMPORTANT: Specific user routes MUST come BEFORE generic /users routes
// Get single user (Admin only) - specific route
router.get('/users/:userId', authenticateToken, isAdmin, authController.getUser);

// Update user (Admin only) - specific route  
router.put('/users/:userId', authenticateToken, isAdmin, authController.updateUserById);

// Elevate user role (Admin only) - specific route
router.put('/users/:userId/role', authenticateToken, isAdmin, authController.elevateUserRole);

// List all users (Admin only) - generic route MUST come last
router.get('/users', authenticateToken, isAdmin, authController.getAllUsers);

export default router;
