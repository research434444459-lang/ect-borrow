// src/app/services/forecast.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export interface ForecastItem {
  serial: string;
  name?: string;
  imageUrl?: string;
  available?: number;
  remaining?: number;
  [k: string]: unknown;
}
export interface InventoryRow {
  serial?: string; code?: string;
  name?: string; ชื่อ?: string; อุปกรณ์?: string; device?: string;
  imageUrl?: string; image?: string; รูป?: string;
  สถานะ?: string; status?: string;
  จำนวนพร้อมใช้งาน?: number; qty?: number;
  [k: string]: unknown;
}
export interface FormRow {
  start?: string; end?: string; 'วันยืม'?: string; 'วันคืน'?: string;
  borrow?: string; startDate?: string;
  // ต้องมีคอลัมน์ O..X หรือ item1.., อุปกรณ์ชิ้นที่ … ที่ใส่ serial ของอุปกรณ์
  [k: string]: unknown;
}
export interface BackendResponse {
  date?: string;
  items?: ForecastItem[];
  // raw sheets (ถ้าอยากคำนวณฝั่ง client)
  inventoryRows?: InventoryRow[];
  formRows?: FormRow[];
  // ชื่อสำรองที่อาจใช้
  devices?: ForecastItem[];
  inventory?: InventoryRow[];
  forms?: FormRow[];
  formResponses?: FormRow[];
  data?: any;
}
export interface ForecastData {
  date: string;
  items: ForecastItem[];
}

/** ตั้งรูปแบบวันจากชีต: 'DMY' = 1/9/65 คือ 1 ก.ย. 2565 (ค่าเริ่มต้น) ; 'MDY' = 9/1/25 คือ 1 ก.ย. 2025 */
const DATE_ORDER: 'DMY' | 'MDY' = 'DMY';

const ITEM_COL_KEYS = [
  'O','P','Q','R','S','T','U','V','W','X',
  'อุปกรณ์ชิ้นที่ 1','อุปกรณ์ชิ้นที่ 2','อุปกรณ์ชิ้นที่ 3',
  'item1','item2','item3','item4','item5','item6','item7','item8','item9','item10',
];

@Injectable({ providedIn: 'root' })
export class ForecastService {
  private http = inject(HttpClient);
  private readonly base = '/api/forecast';

  /** เรียก backend แล้ว “คำนวณฝั่ง client” ถ้ามี raw sheets มาให้ */
  fetch(dateISO: string, q: string): Observable<ForecastData> {
    let params = new HttpParams().set('date', dateISO);
    if (q?.trim()) params = params.set('q', q.trim());

    return this.http.get<BackendResponse>(this.base, { params }).pipe(
      map((resp) => {
        const envelope = resp ?? {};
        if ((envelope as any)?.error) {
          throw new Error((envelope as any).error?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
        }
        const payload: BackendResponse = 'data' in envelope ? (envelope as any).data : envelope;

        // 1) อ่าน items จาก backend ถ้ามี
        let items: ForecastItem[] = payload.items ?? payload.devices ?? [];

        // 2) ดึง raw sheets ถ้ามี (จะใช้คำนวณเอง)
        const inventoryRows: InventoryRow[] = payload.inventoryRows ?? payload.inventory ?? [];
        const formRows: FormRow[]          = payload.formRows ?? payload.forms ?? payload.formResponses ?? [];

        // 3) ถ้า items ว่าง แต่มี inventory -> สร้างจาก inventory
        if ((!items || items.length === 0) && inventoryRows.length > 0) {
          items = this.buildItemsFromInventory(inventoryRows, q);
        }

        // 4) ถ้ามี raw ทั้งสอง -> คำนวณ remaining ตามกฎ “วันยืม และวัน+1”
        if (items.length && inventoryRows.length && formRows.length) {
          const target = this.toYMD(dateISO);
          const avail  = this.buildAvailableMap(inventoryRows);
          const reserv = this.buildReservedMap(formRows, target); // ← ตัดเฉพาะวันยืม & วันถัดไป

          for (const it of items) {
            const a = avail.get(it.serial) ?? it.available ?? 0;
            const r = reserv.get(it.serial) ?? 0;
            it.available = a;
            it.remaining = Math.max(a - r, 0);
          }
        }

        return { date: payload.date ?? dateISO, items: items ?? [] };
      }),
      catchError((err) => {
        const msg =
          err?.error?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'โหลดข้อมูลไม่สำเร็จ';
        return throwError(() => new Error(msg));
      })
    );
  }

  // ----------------- Helpers: วัน/เวลา -----------------

  /** แปลง input -> 'YYYY-MM-DD' โดยไม่พึ่ง timezone; รองรับ DMY/MDY, พ.ศ., ปี 2 หลัก */
  private toYMD(input: string | Date | null | undefined): string {
    if (!input) return '';
    if (input instanceof Date) {
      const y = input.getFullYear();
      const m = String(input.getMonth() + 1).padStart(2, '0');
      const d = String(input.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    let s = String(input).trim();
    if (s.includes(' ')) s = s.split(' ')[0]; // ตัดเวลา เช่น "1/9/65 00:00"

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // ISO

    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (!m) return '';

    let d = +m[1], mo = +m[2], y = +m[3];
    if (DATE_ORDER === 'MDY') { const t = d; d = mo; mo = t; }

    if (m[3].length === 4 && y >= 2400) y -= 543;           // พ.ศ.
    else if (m[3].length === 2) y = y >= 50 ? 1900 + y : 2000 + y;

    const D = String(d).padStart(2, '0');
    const M = String(mo).padStart(2, '0');
    return `${y}-${M}-${D}`;
  }

  private addDaysYMD(ymd: string, days: number): string {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  // ----------------- Helpers: โครงสร้าง/คำนวณ -----------------

  private isItemCol(key: string): boolean {
    const k = String(key).trim().toLowerCase();
    return ITEM_COL_KEYS.some(h => k === String(h).toLowerCase())
        || /อุปกรณ์ชิ้น|item\s*\d+|^\s*[opqrstuvwx]\s*$/.test(k);
  }

  /** รวม “พร้อมใช้งาน” จาก inventory (เฉพาะสถานะ = พร้อมใช้งาน) */
  private buildAvailableMap(rows: InventoryRow[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of rows ?? []) {
      const serial = (r.serial ?? r.code ?? '').toString().trim();
      if (!serial) continue;
      const status = (r.สถานะ ?? r.status ?? '').toString().trim();
      if (status !== 'พร้อมใช้งาน') continue;

      const qty = Number(r.จำนวนพร้อมใช้งาน ?? r.qty ?? 1);
      map.set(serial, (map.get(serial) ?? 0) + (Number.isFinite(qty) ? qty : 1));
    }
    return map;
  }

  /**
   * รวม “จำนวนที่จอง” ณ วันเป้าหมาย ตามกฎใหม่:
   *   - ตัดเฉพาะวันยืม (start) และวันถัดไป (start+1) เท่านั้น
   *   - ไม่สนใจวันคืน ไม่ลากยาวช่วง
   */
  private buildReservedMap(rows: FormRow[], targetYMD: string): Map<string, number> {
    const map = new Map<string, number>();

    for (const row of rows ?? []) {
      const startRaw = (row.start ?? row['วันยืม'] ?? row['borrow'] ?? row['startDate']) as string | undefined;
      const s = this.toYMD(startRaw);
      if (!s) continue;

      const sPlus1 = this.addDaysYMD(s, 1);
      const isTargetDay = (targetYMD === s || targetYMD === sPlus1);
      if (!isTargetDay) continue;

      // นับอุปกรณ์ในคอลัมน์ O..X: 1 ช่อง = 1 ชิ้น
      for (const key of Object.keys(row)) {
        if (!this.isItemCol(key)) continue;
        const val = String(row[key] ?? '').trim();
        if (!val) continue;
        map.set(val, (map.get(val) ?? 0) + 1);
      }
    }

    return map;
  }

  /** สร้าง items จาก inventory (กรณี backend ไม่ส่ง items มา) */
  private buildItemsFromInventory(rows: InventoryRow[], q: string): ForecastItem[] {
    const map = new Map<string, ForecastItem>();
    for (const r of rows ?? []) {
      const serial = (r.serial ?? r.code ?? '').toString().trim();
      if (!serial) continue;
      const name = (r.name ?? (r as any)['ชื่อ'] ?? (r as any)['อุปกรณ์'] ?? (r as any)['device'] ?? '').toString().trim();
      const image = (r.imageUrl ?? (r as any)['image'] ?? (r as any)['รูป'] ?? '').toString().trim();
      if (!map.has(serial)) {
        map.set(serial, { serial, name: name || undefined, imageUrl: image || undefined });
      }
    }
    let items = Array.from(map.values());
    const qq = (q ?? '').trim().toLowerCase();
    if (qq) {
      items = items.filter(it =>
        it.serial.toLowerCase().includes(qq) ||
        (it.name ?? '').toLowerCase().includes(qq)
      );
    }
    return items;
  }
}
