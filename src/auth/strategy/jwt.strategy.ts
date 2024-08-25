import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly logger: Logger,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      algorithms: configService.get('jwt.verifyOptions.algorithms'),
      secretOrKey: configService.get('jwt.publicKey'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, input: any): Promise<any> {  // input: parse from jwt token
    const user = await this.authService.validate(
      input.userId
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
