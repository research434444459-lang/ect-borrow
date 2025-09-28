import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export type CategorySlug =
  | 'camera' | 'camera-lens' | 'mic-wireless'
  | 'studio-lighting' | 'tripod-gimbals' | 'drone' | 'other';

export interface DeviceItem {
  name: string;
  serial: string;
  available: number;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  // ถ้าใช้ Proxy: base = '/api'
  // ถ้าไม่ใช้ Proxy: base = 'http://localhost:8080/api'
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** ดึงรายการอุปกรณ์ตามหมวด */
  getByCategory(slug: CategorySlug, q = ''): Observable<DeviceItem[]> {
    const apiCategory = this.mapToApiCategory(slug);
    let params = new HttpParams().set('category', apiCategory);
    if (q.trim()) params = params.set('q', q.trim()); // ถ้า backend รองรับการค้นหา

    return this.http.get<any>(`${this.base}/devices`, { params }).pipe(
      map((res: any) => {
        // รองรับทั้งกรณี data เป็น array ตรง ๆ หรือเป็น { data: ..., items: ... }
        const raw = Array.isArray(res) ? res
                 : Array.isArray(res?.data?.items) ? res.data.items
                 : Array.isArray(res?.data) ? res.data
                 : [];
        return this.adaptItems(raw);
      }),
      catchError(err => {
        console.error('getByCategory failed', err);
        return of([] as DeviceItem[]);
      })
    );
  }

  /** map slug → พารามิเตอร์ที่ API ต้องการ (ตัวอย่างจาก Camera) */
  private mapToApiCategory(slug: CategorySlug): string {
    const map: Record<CategorySlug, string> = {
      'camera': 'Camera',
      'camera-lens': 'Camera Lens',
      'mic-wireless': 'Microphone Wireless',
      'studio-lighting': 'Studio Lighting',
      'tripod-gimbals': 'Tripod & Gimbals',
      'drone': 'Drone',
      'other': 'Other',
    };
    return map[slug] ?? slug;
  }

  /** แปลงฟิลด์จาก API → โครง DeviceItem ของเรา */
  private adaptItems(raw: any[]): DeviceItem[] {
    return raw.map(r => ({
      name: r.name ?? r.title ?? '',
      serial: r.serial ?? r.code ?? '',
      available: Number(r.available ?? r.qty ?? 0),
      imageUrl: r.imageUrl ?? r.image ?? '',
    }));
  }
}
