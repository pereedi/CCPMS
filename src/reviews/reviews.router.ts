import { Router } from 'express';
import { authMiddleware, requireAuth, requireRole } from '../middleware/auth.middleware';
import { ReviewsService } from './reviews.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const svc = new ReviewsService();

router.use(authMiddleware);

/**
 * POST /api/reviews/process
 * OFEM Executive Action: Approve or Return a report with comments.
 * Body: { recordId, action: 'APPROVE' | 'RETURN', comment? }
 */
router.post('/process', requireAuth, requireRole('OFEM'), async (req: any, res) => {
  try {
    const { recordId, action, comment } = req.body;
    if (!recordId || !['APPROVE', 'RETURN'].includes(action)) {
      return sendError(res, 'recordId and valid action (APPROVE or RETURN) are required', 400);
    }

    const review = await svc.processExecutiveReview({
      recordId,
      reviewersUsername: req.user!.username,
      action,
      comment,
    });

    return sendSuccess(res, review, `Report ${action === 'APPROVE' ? 'approved' : 'returned with comments'}`);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

/**
 * POST /api/reviews
 * OFEM creates a review row directly.
 */
router.post('/', requireAuth, requireRole('OFEM'), async (req: any, res) => {
  try {
    const { username, report_url, status } = req.body;
    if (!username || !report_url) return sendError(res, 'username and report_url are required', 400);

    const review = await svc.createReview({
      username,
      reviewersUsername: req.user!.username,
      report_url,
      status,
    });
    return sendSuccess(res, review, 'Review created', 201);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

/**
 * GET /api/reviews
 * OFEM → all reviews. AD → reviews on their own records.
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const reviews = await svc.getReviews(req.user!.username, req.user!.role);
    return sendSuccess(res, reviews, 'Reviews retrieved');
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

/**
 * PATCH /api/reviews/:id
 * OFEM updates status to APPROVED, REJECTED, or RETURNED.
 */
router.patch('/:id', requireAuth, requireRole('OFEM'), async (req: any, res) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(status)) {
      return sendError(res, 'status must be APPROVED, REJECTED, or RETURNED', 400);
    }
    const review = await svc.updateReviewStatus(req.params.id, status);
    return sendSuccess(res, review, `Review ${status.toLowerCase()}`);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

export default router;
