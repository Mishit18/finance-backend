import { Router } from 'express';
import { body, param } from 'express-validator';
import { Role } from '../types';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';

const router = Router();
const transactionController = new TransactionController();

// All transaction routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List transactions (paginated, filterable, searchable)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (ISO 8601)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in description and category
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  transactionController.getTransactions
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction details
 *       403:
 *         description: Access denied (not owner and not admin)
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid transaction ID is required'),
    validate,
  ],
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  transactionController.getTransactionById
);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction (Analyst/Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: INCOME
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T00:00:00.000Z"
 *               description:
 *                 type: string
 *                 example: Monthly salary payment
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Viewers cannot create transactions
 */
router.post(
  '/',
  [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').optional().isString(),
    validate,
  ],
  authorize(Role.ANALYST, Role.ADMIN),
  transactionController.createTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction (Analyst/Admin — own or admin)
 *     tags: [Transactions]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid transaction ID is required'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('type').optional().isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('description').optional().isString(),
    validate,
  ],
  authorize(Role.ANALYST, Role.ADMIN),
  transactionController.updateTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Soft-delete a transaction (Admin only)
 *     tags: [Transactions]
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
 *         description: Transaction soft-deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid transaction ID is required'),
    validate,
  ],
  authorize(Role.ADMIN),
  transactionController.deleteTransaction
);

export default router;
