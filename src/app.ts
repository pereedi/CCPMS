import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import directoratesRoutes from './directorates/directorates.routes';
import projectsRoutes from './projects/projects.routes';
import kpiRoutes from './kpis/kpis.routes';
import reportsRoutes from './reports/reports.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import notificationsRoutes from './notifications/notifications.routes';
import auditRoutes from './audit/audit.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Static Assets
app.use(express.static(path.join(__dirname, '../public')));

// System Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    system: 'CCPMS Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/directorates', directoratesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);

// SPA Client Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  next();
});

// 404 Fallback for unhandled API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error Handler
app.use(errorHandler);
