import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

interface OrderNotification {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currency: string;
  itemsCount: number;
}

@Injectable()
export class NotificationsService {
  private twilioClient: Twilio | null = null;
  private twilioPhoneNumber: string | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || null;

    if (accountSid && authToken && this.twilioPhoneNumber) {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.isConfigured = true;
      console.log('SMS notifications enabled via Twilio');
    } else {
      console.log('SMS notifications disabled - Twilio not configured');
    }
  }

  /**
   * Send SMS notification to restaurant owner about new order
   */
  async sendOrderNotification(
    restaurantPhone: string,
    order: OrderNotification,
    lang: 'en' | 'ar' = 'en',
  ): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      console.log('SMS not sent - Twilio not configured');
      return false;
    }

    try {
      // Format phone number for Egypt
      const toPhone = this.formatEgyptianPhone(restaurantPhone);

      // Create message based on language
      const message = lang === 'ar'
        ? this.createArabicMessage(order)
        : this.createEnglishMessage(order);

      await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber!,
        to: toPhone,
      });

      console.log(`SMS sent to ${toPhone} for order #${order.orderNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  private formatEgyptianPhone(phone: string): string {
    // Remove any non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');

    // Add Egypt country code if not present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }

    return '+' + cleanPhone;
  }

  private createEnglishMessage(order: OrderNotification): string {
    return `🔔 NEW ORDER #${order.orderNumber}

Customer: ${order.customerName}
Phone: ${order.customerPhone}
Items: ${order.itemsCount}
Total: ${order.total.toFixed(2)} ${order.currency}

Check your dashboard for details.`;
  }

  private createArabicMessage(order: OrderNotification): string {
    return `🔔 طلب جديد #${order.orderNumber}

العميل: ${order.customerName}
الهاتف: ${order.customerPhone}
الأصناف: ${order.itemsCount}
الإجمالي: ${order.total.toFixed(2)} ${order.currency}

راجع لوحة التحكم للتفاصيل.`;
  }
}
