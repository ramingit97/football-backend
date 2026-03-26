"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const users_service_1 = require("../users/users.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
        if (admin.apps.length === 0) {
            try {
                let credential = admin.credential.applicationDefault();
                try {
                    const serviceAccount = require('../../firebase-adminsdk.json');
                    credential = admin.credential.cert(serviceAccount);
                }
                catch (e) {
                    this.logger.warn('Service account file not found, trying default credentials');
                }
                admin.initializeApp({ credential });
                this.logger.log('Firebase Admin initialized successfully');
            }
            catch (error) {
                this.logger.warn('Failed to initialize Firebase Admin. Phone auth will not work.', error);
            }
        }
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findOneByEmail(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
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
    async verifyFirebaseToken(idToken) {
        try {
            return await admin.auth().verifyIdToken(idToken);
        }
        catch (error) {
            this.logger.error('Error verifying Firebase token', error);
            throw new common_1.UnauthorizedException('Invalid Firebase token');
        }
    }
    async loginWithPhone(idToken) {
        const decodedToken = await this.verifyFirebaseToken(idToken);
        const phoneNumber = decodedToken.phone_number;
        if (!phoneNumber) {
            throw new common_1.UnauthorizedException('Phone number not found in token');
        }
        let user = await this.usersService.findOneByPhone(phoneNumber);
        if (!user) {
            const placeholderEmail = `${phoneNumber}@phone.auth`;
            user = await this.usersService.create({
                email: placeholderEmail,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                phone: phoneNumber,
                role: 'player',
            });
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, password: undefined },
        };
    }
    async getUserProfile(userId) {
        const user = await this.usersService.findOneById(userId);
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async updateUserProfile(userId, updateData) {
        return this.usersService.update(userId, updateData);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map