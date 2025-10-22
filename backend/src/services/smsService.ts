import twilio from 'twilio';
import { config } from '../config/env';

class SMSService {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      this.client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    } else {
      console.warn('⚠️  Twilio not configured. SMS sending will be logged only.');
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your Cogito verification code is: ${otp}. This code will expire in 10 minutes.`;

    if (!this.client) {
      console.log('📱 [SMS SIMULATION]');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      return;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to: phoneNumber
      });
      console.log(`✅ SMS sent to ${phoneNumber}`);
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }
}

export const smsService = new SMSService();
