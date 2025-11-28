/**
 * PM2 Ecosystem Configuration for Cogito Smart Radio
 *
 * This file manages all services required for the Cogito system:
 * 1. Hardware Service - Manages GPIO buttons and radio control
 * 2. Button Handler - Python script for hardware button events
 * 3. Backend API - Express server with Socket.io
 * 4. Frontend Web App - React application
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'hardware-service',
      cwd: './hardware-service',
      script: 'hardware-service.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/hardware-error.log',
      out_file: './logs/hardware-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'button-handler',
      cwd: './hardware-service/python',
      script: 'button-vapi-handler.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      error_file: './logs/button-error.log',
      out_file: './logs/button-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'backend',
      cwd: './backend',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development', // Allow any localhost CORS for demos
        PORT: 4000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview -- --host --port 5174',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
