import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200, meta?: any) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 400, errors?: any) {
  const response: ApiResponse = {
    success: false,
    message,
    data: errors,
  };
  return res.status(statusCode).json(response);
}
