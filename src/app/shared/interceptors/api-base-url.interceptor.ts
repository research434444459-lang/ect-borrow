// src/app/shared/interceptors/api-base-url.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * เติม BASE URL ของ Backend ให้ทุก request ที่เริ่มด้วย "/api"
 * เช่น GET /api/requests → https://ect-borrow-be.onrender.com/api/requests
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // ถ้าเป็น absolute URL (http/https) ไม่ต้องยุ่ง
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  // เฉพาะ path ที่ขึ้นด้วย /api เท่านั้น
  if (req.url.startsWith('/api')) {
    // environment.apiBaseUrl ของคุณลงท้ายด้วย "/api" อยู่แล้ว
    // เลยต่อ path ที่เหลือหลัง "/api"
    const suffix = req.url.replace(/^\/api/, ''); // "/requests?..." → "?..." หรือ "/requests"
    const target = `${environment.apiBaseUrl}${suffix}`;

    const cloned = req.clone({ url: target });
    return next(cloned);
  }

  // อย่างอื่นผ่านต่อไป
  return next(req);
};
