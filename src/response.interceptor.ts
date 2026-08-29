import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        return {
          code: statusCode,
          data: data,
          message: this.getStatusMessage(statusCode),
          metadata: {
            responseAt: new Date().toISOString(),
            method: request.method,
            route: request.originalUrl,
          },
        };
      }),
    );
  }

  private getStatusMessage(statusCode: number): string {
    const key = Object.keys(HttpStatus).find(
      (k) => HttpStatus[k as keyof typeof HttpStatus] === statusCode,
    );
    return key ? key.toLowerCase() : 'unknown';
  }
}
