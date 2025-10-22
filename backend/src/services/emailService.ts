import nodemailer from 'nodemailer';
import { config } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (config.emailService === 'sendgrid' && config.sendgridApiKey) {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: config.sendgridApiKey
        }
      });
    } else if (config.smtpHost && config.smtpUser) {
      // SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });
    } else {
      console.warn('⚠️  Email service not configured. Email sending will be logged only.');
    }
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const subject = 'Your Cogito Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName || 'there';
    const subject = 'Welcome to Cogito!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Cogito, ${name}!</h2>
        <p>We're excited to have you on board.</p>
        <p>Cogito is your AI-powered voice radio companion. Start exploring and enjoy the experience!</p>
        <p>Best regards,<br>The Cogito Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      console.log('📧 [EMAIL SIMULATION]');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html.replace(/<[^>]*>/g, '')}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.emailFrom,
        to,
        subject,
        html
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}

export const emailService = new EmailService();
