// Routes: Authentication - Public and protected auth endpoints
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// Public routes (no authentication required)
router.post('/register', (req, res) => {
  const controller = req.app.locals.authController as AuthController;
  return controller.register(req, res);
});

router.post('/login', (req, res) => {
  const controller = req.app.locals.authController as AuthController;
  return controller.login(req, res);
});

router.post('/refresh', (req, res) => {
  const controller = req.app.locals.authController as AuthController;
  return controller.refreshToken(req, res);
});

// Protected routes (authentication required)
router.post('/logout', (req, res) => {
  const controller = req.app.locals.authController as AuthController;
  return controller.logout(req, res);
});

router.get('/profile', (req, res) => {
  const authMiddleware = req.app.locals.authMiddleware as AuthMiddleware;
  authMiddleware.authenticate(req, res, () => {
    const controller = req.app.locals.authController as AuthController;
    return controller.getProfile(req, res);
  });
});

// Admin only routes
router.get('/users', (req, res) => {
  const authMiddleware = req.app.locals.authMiddleware as AuthMiddleware;
  authMiddleware.authenticate(req, res, () => {
    authMiddleware.authorize(['admin'])(req, res, () => {
      // Admin controller would handle this
      res.status(200).json({
        success: true,
        message: 'Admin users endpoint'
      });
    });
  });
});

export default router;