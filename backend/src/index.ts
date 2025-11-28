import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { SocketService } from './services/socketService';
import authRoutes from './routes/authRoutes';
import conversationRoutes from './routes/conversationRoutes';

const app: Application = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
// CORS configuration - allow localhost with any port in development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In development, allow any localhost origin
    if (config.nodeEnv === 'development') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
    }
    // In production, use configured origin
    if (origin === config.corsOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Additional request logging for debugging
app.use((req, _res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, req.query, req.body ? `(body: ${JSON.stringify(req.body).substring(0, 100)})` : '');
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Import Vapi routes
import vapiRoutes from './vapi/routes';
// Import Microcontroller routes
import microcontrollerRoutes from './microcontroller/routes';
// Import Reminder routes
import reminderRoutes from './routes/reminderRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/vapi', vapiRoutes);
app.use('/api/microcontroller', microcontrollerRoutes);
app.use('/api/reminders', reminderRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Initialize Socket.io (service is initialized and manages connections)
// @ts-ignore - Service is created for side effects (initializing socket.io)
new SocketService(httpServer);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log('');
      console.log('🚀 ===============================');
      console.log(`🚀 Cogito Backend Server Running`);
      console.log('🚀 ===============================');
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔌 Port: ${config.port}`);
      console.log(`📡 HTTP: http://localhost:${config.port}`);
      console.log(`🔌 WebSocket: ws://localhost:${config.port}`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
      console.log('🚀 ===============================');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
