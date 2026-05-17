import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NODE_ENV } from '../../utils/config';

type PrismaKnownError = Error & {
  code?: string;
  meta?: {
    target?: string[];
    [key: string]: unknown;
  };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isDevelopment = NODE_ENV !== 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode: string | undefined;
    let details: unknown;
    let originalErrorMessage: string | undefined;

    if (exception instanceof HttpException) {
      originalErrorMessage = exception.message;
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message;
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
        if (typeof responseObj.errorCode === 'string') {
          errorCode = responseObj.errorCode;
        }
      }

      if (!this.isDevelopment && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        message = 'Internal server error';
      }
    } else if (exception instanceof Error) {
      originalErrorMessage = exception.message;
      const isDatabaseError = this.isDatabaseError(exception);

      if (isDatabaseError) {
        const mappedError = this.mapDatabaseError(exception);
        status = mappedError.status;
        message = mappedError.message;
        errorCode = mappedError.errorCode;
      } else {
        message = this.isDevelopment
          ? exception.message
          : 'Internal server error';
      }

      details = this.isDevelopment
        ? {
            name: exception.name,
            message: exception.message,
            ...(exception.stack && { stack: exception.stack }),
          }
        : undefined;
    } else {
      this.logger.error(
        `Unknown exception: ${JSON.stringify(exception)}`,
        undefined,
        `${request.method} ${request.originalUrl || request.url}`,
      );
    }

    const errorResponse: {
      statusCode: number;
      timestamp: string;
      path: string;
      method: string;
      message: string | string[];
      errorCode?: string;
      details?: unknown;
      requestId?: string;
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      message,
    };

    if (errorCode) {
      errorResponse.errorCode = errorCode;
    }

    if (details && this.isDevelopment) {
      errorResponse.details = details;
    }

    const pickHeader = (v: unknown) => (typeof v === 'string' ? v : undefined);

    const requestId =
      pickHeader(request.headers['x-request-id']) ||
      pickHeader(request.headers['x-correlation-id']);
    if (requestId) {
      errorResponse.requestId = requestId;
    }

    const messageStr = Array.isArray(message) ? message.join('; ') : message;
    const errorName =
      exception instanceof Error ? exception.name : 'UnknownError';
    const path = request.originalUrl || request.url;
    const logContext: Record<string, unknown> = {
      status,
      errorName,
      message: messageStr,
      path,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (originalErrorMessage && originalErrorMessage !== messageStr) {
      logContext.originalErrorMessage = originalErrorMessage;
    }

    if (exception instanceof Error) {
      logContext.originalErrorName = exception.name;
      if (this.isDatabaseError(exception)) {
        const prismaError = exception as PrismaKnownError;
        if (prismaError.code) {
          logContext.prismaCode = prismaError.code;
        }
      }
    }

    if (requestId) {
      logContext.requestId = requestId;
    }

    if (request.user) {
      const user = request.user as { userId?: number };
      if (user.userId) {
        logContext.userId = user.userId;
      }
    }

    if (errorCode) {
      logContext.errorCode = errorCode;
    }

    const logMessage = `HTTP ${status} ${errorName}: ${messageStr} | ${JSON.stringify(logContext)}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack =
        this.isDevelopment && exception instanceof Error
          ? exception.stack
          : undefined;
      this.logger.error(logMessage, stack);
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(logMessage);
    }

    response.status(status).json(errorResponse);
  }

  private isDatabaseError(error: Error): boolean {
    const errorName = error.name;
    return (
      errorName === 'PrismaClientKnownRequestError' ||
      errorName === 'PrismaClientValidationError' ||
      errorName === 'MongoError' ||
      errorName === 'MongoServerError' ||
      errorName === 'CastError'
    );
  }

  private mapDatabaseError(error: Error): {
    status: number;
    message: string;
    errorCode?: string;
  } {
    const errorName = error.name;
    const prismaError = error as PrismaKnownError;

    if (errorName === 'PrismaClientKnownRequestError' && prismaError.code) {
      switch (prismaError.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'Resource already exists',
            errorCode: 'DUPLICATE_ENTRY',
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
            errorCode: 'NOT_FOUND',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid reference to related resource',
            errorCode: 'FOREIGN_KEY_CONSTRAINT',
          };
        case 'P2014':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Required relation violation',
            errorCode: 'REQUIRED_RELATION',
          };
        case 'P2000':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Value too long',
            errorCode: 'VALUE_TOO_LONG',
          };
        case 'P2011':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Null constraint violation',
            errorCode: 'NULL_CONSTRAINT',
          };
      }
    }

    if (errorName === 'PrismaClientValidationError') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid input data',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const errorMessage = error.message.toLowerCase();

    if (errorName === 'MongoError' || errorName === 'MongoServerError') {
      if (
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('e11000')
      ) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          errorCode: 'DUPLICATE_ENTRY',
        };
      }
    }

    if (errorName === 'CastError') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid ID format',
        errorCode: 'INVALID_ID_FORMAT',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
