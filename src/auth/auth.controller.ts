import { Controller, Post, Body, UseGuards, Get, Put, Request } from '@nestjs/common';
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

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('logout')
    logout() {
        return { message: 'Logged out successfully' };
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
