import { Router } from 'express';
import { authMiddleware, requireAuth, requireRole } from '../middleware/auth.middleware';
import { RecordsService } from './records.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const svc = new RecordsService();

router.use(authMiddleware);

/**
 * POST /api/records
 * AD submits a new record for their directorate.
 * Body: { type, period, summary, kpi_results }
 */
router.post('/', requireAuth, requireRole('AD'), async (req: any, res) => {
  try {
    const { type, period, summary, kpi_results } = req.body;
    if (!type || !period || !summary) {
      return sendError(res, 'type, period and summary are required', 400);
    }
    const record = await svc.createRecord({
      username:    req.user!.username,
      type,
      period,
      summary,
      kpi_results: kpi_results ?? [],
      file_url:    null,
    });
    return sendSuccess(res, record, 'Record submitted', 201);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

/**
 * GET /api/records
 * OFEM → all records. AD → own records only.
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const records = await svc.getRecords(req.user!.username, req.user!.role);
    return sendSuccess(res, records, 'Records retrieved');
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

/**
 * GET /api/records/:id
 */
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const record = await svc.getRecord(req.params.id, req.user!.username, req.user!.role);
    if (!record) return sendError(res, 'Record not found', 404);
    return sendSuccess(res, record, 'Record retrieved');
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

export default router;
