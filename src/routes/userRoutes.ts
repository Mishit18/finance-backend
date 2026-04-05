import { Router } from 'express';
import { body, param } from 'express-validator';
import { Role } from '../types';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';

const router = Router();
const userController = new UserController();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(authorize(Role.ADMIN));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users (excludes soft-deleted)
 *       403:
 *         description: Admin access required
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Valid user ID is required'), validate],
  userController.getUserById
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/role',
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    body('role').isIn(['VIEWER', 'ANALYST', 'ADMIN']).withMessage('Invalid role'),
    validate,
  ],
  userController.updateUserRole
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    validate,
  ],
  userController.updateUserStatus
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Soft-delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User soft-deleted
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Valid user ID is required'), validate],
  userController.deleteUser
);

export default router;
