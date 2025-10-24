import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/local-user.dto';
import { LocalGuard } from './guard/local/local.guard';
import { JWTGuard } from './guard/jwt/jwt.guard';
import { RefreshTokenGuard } from './guard/refresh-jwt/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: RegisterDto) {
    return await this.authService.LocalRegister(user);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user.id);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Request() req) {
    return this.authService.refresh(req.user.id);
  }

  @UseGuards(JWTGuard)
  @Post('signout')
  signOut(@Request() req) {
    return this.authService.singOut(req.user.id);
  }

  @Post('google-auth')
  googleAuth(@Body() AuthToken: { idToken: string }) {
    return this.authService.googleAuth(AuthToken);
  }

  @UseGuards(JWTGuard)
  @Get('me')
  me(@Request() req) {
    return {
      id: req.user.id,
    };
  }

  @UseGuards(JWTGuard)
  @Post('change-password')
  changePassword(
    @Request() req,
    @Body() changePasswordDto: { password: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.password,
    );
  }
}
