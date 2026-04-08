import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.MAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
        });
    }

    async sendPasswordReset(to: string, token: string, name: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${token}`;

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #0a0f1e; color: #fff; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: #111827; border-radius: 16px; padding: 32px; border: 1px solid #1f2937;">
    <h2 style="color: #22c55e; margin-top: 0;">Сброс пароля</h2>
    <p>Привет, <strong>${name || 'игрок'}</strong>!</p>
    <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
    <p>Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна <strong>1 час</strong>.</p>
    <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #22c55e; color: #000; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Сбросить пароль
    </a>
    <p style="color: #6b7280; font-size: 13px;">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
    <hr style="border-color: #1f2937; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">FootballBaku — игровая платформа</p>
  </div>
</body>
</html>`;

        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM || `"Topin" <${process.env.MAIL_USER}>`,
                to,
                subject: 'Сброс пароля — FootballBaku',
                html,
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            throw error;
        }
    }
}
