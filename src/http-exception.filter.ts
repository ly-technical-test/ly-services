import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      status === HttpStatus.NOT_FOUND
        ? 'route_not_found'
        : exception.message || 'internal_server_error';

    response.status(status).json({
      code: status,
      data: null,
      message,
      metadata: {
        responseAt: new Date().toISOString(),
        method: request.method,
        route: request.originalUrl,
      },
    });
  }
}
