import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../stadiums/telegram.service';
import { MailService } from './mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

let authApp: admin.app.App | null = null;

function getAuthApp(logger: Logger): admin.app.App | null {
    if (authApp) return authApp;

    // Reuse existing 'auth' app if already initialized
    const existing = admin.apps.find(a => a?.name === 'auth');
    if (existing) {
        authApp = existing;
        return authApp;
    }

    try {
        const serviceAccount = require('../../firebase-adminsdk.json');
        authApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'auth');
        logger.log('Firebase Admin (auth) initialized successfully');
    } catch (error) {
        logger.warn('Failed to initialize Firebase Admin for auth: ' + error.message);
    }

    return authApp;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly refreshTtlDays: number;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private telegramService: TelegramService,
        private mailService: MailService,
        private configService: ConfigService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepo: Repository<RefreshToken>,
    ) {
        getAuthApp(this.logger);
        this.refreshTtlDays = parseInt(
            this.configService.get<string>('REFRESH_EXPIRATION_DAYS', '30'),
            10,
        );
    }

    private hashRefreshToken(raw: string): string {
        return crypto.createHash('sha256').update(raw).digest('hex');
    }

    private async issueTokens(user: { id: string; email: string; role: string }, userAgent?: string) {
        const access_token = this.jwtService.sign({
            email: user.email,
            sub: user.id,
            role: user.role,
        });

        const raw = crypto.randomBytes(48).toString('hex');
        const tokenHash = this.hashRefreshToken(raw);
        const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

        await this.refreshTokenRepo.save(this.refreshTokenRepo.create({
            userId: user.id,
            tokenHash,
            expiresAt,
            userAgent: userAgent ? userAgent.slice(0, 255) : null,
        }));

        return { access_token, refresh_token: raw };
    }

    async refresh(rawRefreshToken: string, userAgent?: string) {
        if (!rawRefreshToken) {
            throw new UnauthorizedException('Refresh token required');
        }
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        const record = await this.refreshTokenRepo.findOne({ where: { tokenHash } });

        if (!record || record.revokedAt || record.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findOneById(record.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Rotate: revoke old, issue new
        record.revokedAt = new Date();
        await this.refreshTokenRepo.save(record);

        const tokens = await this.issueTokens(
            { id: user.id, email: user.email, role: user.role },
            userAgent,
        );

        // Best-effort cleanup of expired tokens for this user
        this.refreshTokenRepo
            .delete({ userId: user.id, expiresAt: LessThan(new Date()) })
            .catch(() => {});

        return tokens;
    }

    async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
        if (!rawRefreshToken) return;
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        await this.refreshTokenRepo.update({ tokenHash }, { revokedAt: new Date() });
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async validateUserByPhone(phone: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByPhone(phone);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto, userAgent?: string) {
        let user: any = null;
        if (loginDto.phone) {
            // Normalize: strip leading 0 and spaces, prepend +994 if no country code
            let phone = loginDto.phone.replace(/\s/g, '');
            if (phone.startsWith('0')) phone = phone.substring(1);
            if (!phone.startsWith('+')) phone = `+994${phone}`;
            user = await this.validateUserByPhone(phone, loginDto.password);
        } else if (loginDto.email) {
            user = await this.validateUser(loginDto.email, loginDto.password);
        }
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.issueTokens(
            { id: user.id, email: user.email, role: user.role },
            userAgent,
        );
        return { ...tokens, user };
    }

    async register(registerDto: RegisterDto, userAgent?: string) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });
        this.telegramService.sendNewUser(user).catch(() => {});
        const tokens = await this.issueTokens(
            { id: user.id, email: user.email, role: user.role },
            userAgent,
        );
        return { ...tokens, user: { ...user, password: undefined } };
    }

    async verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        const app = getAuthApp(this.logger);
        if (!app) throw new UnauthorizedException('Firebase not initialized');
        try {
            return await admin.auth(app).verifyIdToken(idToken);
        } catch (error) {
            this.logger.error('Error verifying Firebase token', error.message);
            throw new UnauthorizedException('Invalid Firebase token');
        }
    }

    async loginWithPhone(idToken: string, userAgent?: string) {
        const decodedToken = await this.verifyFirebaseToken(idToken);
        const phoneNumber = decodedToken.phone_number;

        if (!phoneNumber) {
            throw new UnauthorizedException('Phone number not found in token');
        }

        let user = await this.usersService.findOneByPhone(phoneNumber);

        if (!user) {
            const placeholderEmail = `${phoneNumber}@phone.auth`;
            user = await this.usersService.create({
                email: placeholderEmail,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                phone: phoneNumber,
                role: 'player',
            } as any);
            this.telegramService.sendNewUser(user).catch(() => {});
        }

        const tokens = await this.issueTokens(
            { id: user.id, email: user.email, role: user.role },
            userAgent,
        );
        return { ...tokens, user: { ...user, password: undefined } };
    }

    async loginWithGoogle(idToken: string, userAgent?: string) {
        const decodedToken = await this.verifyFirebaseToken(idToken);

        const email = decodedToken.email;
        if (!email) {
            throw new UnauthorizedException('Email not found in Google token');
        }

        let user = await this.usersService.findOneByEmail(email);
        const isNewUser = !user;

        if (!user) {
            user = await this.usersService.create({
                email,
                name: decodedToken.name || email.split('@')[0],
                avatar: decodedToken.picture || null,
                role: 'player',
                initialBalance: 3, // Google users are pre-verified — 3 AZN bonus
            } as any);
            this.telegramService.sendNewUser(user).catch(() => {});
        } else if (decodedToken.picture && !user.avatar) {
            await this.usersService.update(user.id, { avatar: decodedToken.picture } as any);
            user = await this.usersService.findOneById(user.id);
        }

        const tokens = await this.issueTokens(
            { id: user.id, email: user.email, role: user.role },
            userAgent,
        );
        return { ...tokens, user: { ...user, password: undefined }, isNewUser };
    }

    async getUserProfile(userId: string) {
        const user = await this.usersService.findOneById(userId);
        if (user) {
            const { password, ...result } = user;
            return { ...result, hasPassword: !!password };
        }
        return null;
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        // Always return success to avoid user enumeration
        if (!user || user.email?.includes('@phone.auth')) {
            return { message: 'Если email найден, письмо отправлено' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.usersService.setResetToken(user.id, token, expires);
        await this.mailService.sendPasswordReset(user.email, token, user.name);

        return { message: 'Если email найден, письмо отправлено' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.findByResetToken(token);
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Ссылка недействительна или истекла');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.clearResetToken(user.id, hashed);

        return { message: 'Пароль успешно изменён' };
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.usersService.findOneById(userId);
        if (!user || !user.password) {
            throw new BadRequestException('Пользователь не найден');
        }

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) {
            throw new UnauthorizedException('Неверный текущий пароль');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(userId, hashed);

        return { message: 'Пароль успешно изменён' };
    }

    async updateUserProfile(userId: string, updateData: any) {
        const before = await this.usersService.findOneById(userId);
        const updated = await this.usersService.update(userId, updateData);
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Phone changed
        if (updateData.phone && updateData.phone !== before?.phone) {
            if (!before?.phoneBonusPaid) {
                const status = await this.usersService.markPhoneVerificationPending(userId);
                this.telegramService.sendPhoneVerification({
                    id: userId, name: updated.name,
                    phone: updateData.phone, email: updated.email,
                }, status === 'auto_format').catch(() => {});
            } else {
                // Just notify about the change
                const msg = [
                    `📱 <b>Telefon nömrəsi dəyişdi</b>`,
                    `👤 <b>${esc(updated.name)}</b>`,
                    `🆔 <code>${userId}</code>`,
                    ``,
                    `Əvvəl: <code>${esc(before?.phone || '—')}</code>`,
                    `İndi: <code>${esc(updateData.phone)}</code>`,
                ].join('\n');
                this.telegramService.sendMessage(process.env.TELEGRAM_CHAT_ID || '', msg).catch(() => {});
            }
        }

        // Email changed
        if (updateData.email && updateData.email !== before?.email
            && !before?.email?.includes('@phone.auth')
            && !updateData.email?.includes('@phone.auth')) {
            const msg = [
                `📧 <b>Email dəyişdi</b>`,
                `👤 <b>${esc(updated.name)}</b>`,
                `🆔 <code>${userId}</code>`,
                ``,
                `Əvvəl: <code>${esc(before?.email || '—')}</code>`,
                `İndi: <code>${esc(updateData.email)}</code>`,
            ].join('\n');
            this.telegramService.sendMessage(process.env.TELEGRAM_CHAT_ID || '', msg).catch(() => {});
        }

        return updated;
    }
}
