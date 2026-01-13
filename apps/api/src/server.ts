import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { logger } from './infrastructure/logging/logger.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { requestLogger } from './common/middleware/request-logger.js';
import { extractTenantFromSubdomain } from './common/guards/tenant.guard.js';

// Routes
import { authRouter } from './modules/auth/auth.controller.js';
import { tenantRouter } from './modules/tenants/tenant.controller.js';
import { userRouter } from './modules/users/user.controller.js';
import { patientRouter } from './modules/patients/patient.controller.js';
import { appointmentRouter } from './modules/appointments/appointment.controller.js';
import { medicalRecordRouter } from './modules/medical-records/medical-record.controller.js';
import { billingRouter } from './modules/billing/billing.controller.js';
import { proceduresRouter } from './modules/billing/procedures.controller.js';
import { inventoryRouter } from './modules/inventory/inventory.controller.js';
import { reportsRouter } from './modules/reports/reports.controller.js';
import { settingsRouter } from './modules/settings/settings.controller.js';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.isDev ? true : config.server.webUrl,
    credentials: true,
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Extract tenant from subdomain
app.use(extractTenantFromSubdomain);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenants', tenantRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/medical-records', medicalRecordRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/procedures', proceduresRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/settings', settingsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await disconnectDatabase();
    logger.info('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(config.server.port, () => {
      logger.info(
        {
          port: config.server.port,
          env: config.env,
          url: config.server.apiUrl,
        },
        'Guilherme Machado Systems API server started'
      );
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();

export { app };
