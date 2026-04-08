import { Controller, Post, Body, UseGuards, Get, Put, Patch, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('login-phone')
    loginPhone(@Body('idToken') idToken: string) {
        return this.authService.loginWithPhone(idToken);
    }

    @Post('login-google')
    loginGoogle(@Body('idToken') idToken: string) {
        return this.authService.loginWithGoogle(idToken);
    }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('logout')
    logout() {
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
