import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {
        getAuthApp(this.logger);
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

    async login(loginDto: LoginDto) {
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
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, password: undefined },
        };
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

    async loginWithPhone(idToken: string) {
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
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, password: undefined },
        };
    }

    async loginWithGoogle(idToken: string) {
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
            } as any);
        } else if (decodedToken.picture && !user.avatar) {
            await this.usersService.update(user.id, { avatar: decodedToken.picture } as any);
            user = await this.usersService.findOneById(user.id);
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, password: undefined },
            isNewUser,
        };
    }

    async getUserProfile(userId: string) {
        const user = await this.usersService.findOneById(userId);
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async updateUserProfile(userId: string, updateData: any) {
        return this.usersService.update(userId, updateData);
    }
}
