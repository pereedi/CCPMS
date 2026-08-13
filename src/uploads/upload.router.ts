import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from '../config/env';
import { authMiddleware, requireAuth, requireRole } from '../middleware/auth.middleware';
import { RecordsService } from '../records/records.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const recordsSvc = new RecordsService();

// ── Multer: memory storage (no disk write — bytes go straight to R2) ──────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter(_req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg', 'image/png', 'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: PDF, DOCX, DOC, JPEG, PNG, WEBP'));
    }
  },
});

// ── R2 / B2 S3-compatible client ─────────────────────────────────────────────
function buildS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint  = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`       // Cloudflare R2
    : (process.env.S3_ENDPOINT ?? 'https://s3.us-west-001.backblazeb2.com'); // B2 fallback

  return new S3Client({
    region:      process.env.R2_REGION ?? 'auto',
    endpoint,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

router.use(authMiddleware);

/**
 * POST /api/upload/records/:recordId
 * AD uploads a file and attaches its URL to an existing record.
 * Form field: `file` (single file, multipart/form-data)
 */
router.post('/records/:recordId', requireAuth, requireRole('AD'), upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400);

    const { recordId } = req.params;
    const directorate  = req.user!.directorate ?? 'unknown';
    const username     = req.user!.username;

    // Sanitize filename
    const ext      = req.file.originalname.split('.').pop() ?? 'bin';
    const safeFile = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const key      = `${directorate}/${username}/${recordId}/${safeFile}`;

    const s3 = buildS3Client();
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME ?? '',
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // Public URL: either R2 custom domain or B2 CDN base
    const baseUrl  = process.env.R2_PUBLIC_URL ?? process.env.S3_PUBLIC_URL ?? '';
    const fileUrl  = `${baseUrl}/${key}`;

    // Patch the record's payload with the file URL
    const updated = await recordsSvc.attachFileUrl(recordId, fileUrl);
    return sendSuccess(res, { file_url: fileUrl, record: updated }, 'File uploaded and attached to record');
  } catch (e: any) {
    return sendError(res, `Upload failed: ${e.message}`, 500);
  }
});

export default router;
