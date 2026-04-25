import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from './mail.service';
import { UsersModule } from '../users/users.module';
import { StadiumsModule } from '../stadiums/stadiums.module';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
    imports: [
        UsersModule,
        StadiumsModule,
        PassportModule,
        TypeOrmModule.forFeature([RefreshToken]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') || '15m' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, JwtStrategy, MailService],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
