import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment'; // ⬅️ เส้นทางที่ถูกต้องจาก src/app/services

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'ect_admin_token';
  private inMemoryToken: string | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  async login(username: string, password: string, remember = false): Promise<boolean> {
    // ✅ DEV FIRST: ถ้าเปิด devAuth ให้ตรวจ local ก่อน (จะไม่ยิง /api)
    if (environment.devAuth?.enabled) {
      const uOk = this.cte(username, environment.devAuth.username || '');
      const pOk = await this.verifyPassword(password, environment.devAuth.passwordSha256 || '');
      if (uOk && pOk) {
        this.setToken('dev-token', remember);
        return true;
      }
      // ถ้าตรวจไม่ผ่าน ค่อยลองไป backend ต่อ (ถ้าอยากหยุดแค่นี้ก็ return false ได้)
    }
  
    // PROD / หรือ dev อยากเทส backend จริง
    try {
      const res: any = await firstValueFrom(
        this.http.post('/api/auth/login', { username, password }, { withCredentials: true })
      );
      if (res?.token) {
        this.setToken(res.token, remember);
      } else {
        this.setToken('cookie', remember); // สำหรับเซิร์ฟเวอร์ที่ตั้ง httpOnly cookie
      }
      return true;
    } catch {
      return false;
    }
  }

  logout() {
    this.inMemoryToken = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  isAuthenticated(): boolean {
    if (this.inMemoryToken) return true;
    if (isPlatformBrowser(this.platformId)) {
      const t = localStorage.getItem(this.tokenKey);
      if (t) { this.inMemoryToken = t; return true; }
    }
    return false;
  }

  getToken(): string | null {
    if (this.inMemoryToken) return this.inMemoryToken;
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private setToken(token: string, remember: boolean) {
    this.inMemoryToken = token;
    if (isPlatformBrowser(this.platformId) && remember) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  // constant-time compare
  private cte(a: string, b: string): boolean {
    const aBytes = new TextEncoder().encode(a);
    const bBytes = new TextEncoder().encode(b);
    const len = Math.max(aBytes.length, bBytes.length);
    let diff = 0;
    for (let i = 0; i < len; i++) diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
    return diff === 0 && aBytes.length === bBytes.length;
  }

  private async verifyPassword(plain: string, expectedSha256Hex: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || !('crypto' in globalThis) || !('subtle' in (crypto as any))) {
      return false;
    }
    const dig = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    const gotHex = Array.from(new Uint8Array(dig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return this.cte(gotHex, (expectedSha256Hex || '').toLowerCase());
  }
}
