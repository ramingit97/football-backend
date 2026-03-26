import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {
        if (admin.apps.length === 0) {
            try {
                let credential = admin.credential.applicationDefault();
                try {
                    const serviceAccount = require('../../firebase-adminsdk.json');
                    credential = admin.credential.cert(serviceAccount);
                } catch (e) {
                    this.logger.warn('Service account file not found, trying default credentials');
                }
                admin.initializeApp({ credential });
                this.logger.log('Firebase Admin initialized successfully');
            } catch (error) {
                this.logger.warn('Failed to initialize Firebase Admin. Phone auth will not work.', error);
            }
        }
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
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
        try {
            return await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            this.logger.error('Error verifying Firebase token', error);
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
