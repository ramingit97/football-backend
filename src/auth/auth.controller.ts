import { Controller, Post, Body, UseGuards, Get, Put, Patch, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    login(@Body() loginDto: LoginDto, @Request() req: any) {
        return this.authService.login(loginDto, req.headers['user-agent']);
    }

    @Post('login-phone')
    loginPhone(@Body('idToken') idToken: string, @Request() req: any) {
        return this.authService.loginWithPhone(idToken, req.headers['user-agent']);
    }

    @Post('login-google')
    loginGoogle(@Body('idToken') idToken: string, @Request() req: any) {
        return this.authService.loginWithGoogle(idToken, req.headers['user-agent']);
    }

    @Post('register')
    register(@Body() registerDto: RegisterDto, @Request() req: any) {
        return this.authService.register(registerDto, req.headers['user-agent']);
    }

    @Post('refresh')
    async refresh(@Body('refresh_token') refreshToken: string, @Request() req: any) {
        return this.authService.refresh(refreshToken, req.headers['user-agent']);
    }

    @Post('logout')
    async logout(@Body('refresh_token') refreshToken: string) {
        await this.authService.revokeRefreshToken(refreshToken);
        return { message: 'Logged out successfully' };
    }

    @Post('forgot-password')
    forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    resetPassword(@Body('token') token: string, @Body('password') password: string) {
        return this.authService.resetPassword(token, password);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    changePassword(
        @Request() req: any,
        @Body('oldPassword') oldPassword: string,
        @Body('newPassword') newPassword: string,
    ) {
        return this.authService.changePassword(req.user.userId, oldPassword, newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        return this.authService.getUserProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    updateProfile(@Request() req: any, @Body() updateData: any) {
        return this.authService.updateUserProfile(req.user.userId, updateData);
    }
}
