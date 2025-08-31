import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private merchantsService: MerchantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    const merchant = await this.merchantsService.findByApiKey(apiKey);

    if (!merchant) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Invalid API key',
      });
    }

    request.merchant = merchant;
    return true;
  }
}