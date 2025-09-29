// src/app/pages/forecast/forecast.ts

import { CommonModule, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  inject,
  InjectionToken,
  PLATFORM_ID,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';

/** ---------------- Config: รูปแบบวันในชีต ----------------
 * ถ้าในชีตเป็น "1/9/65" = 1 ก.ย. 2565 ให้ใช้ 'DMY' (ค่าเริ่มต้น)
 * ถ้าชีตเป็น "9/1/25" = 1 ก.ย. 2025 ให้ใช้ 'MDY'
 */
const DATE_ORDER: 'DMY' | 'MDY' = 'DMY';

/** ---------------- Types ---------------- */
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
  [k: string]: unknown; // คอลัมน์ O..X (หรือ item1.., อุปกรณ์ชิ้นที่ …) ต้องใส่ serial ของอุปกรณ์
}
export interface BackendResponse {
  items?: ForecastItem[];
  inventoryRows?: InventoryRow[];
  formRows?: FormRow[];
  // fallback keys ที่ backend อาจใช้
  devices?: ForecastItem[];
  inventory?: InventoryRow[];
  forms?: FormRow[];
  formResponses?: FormRow[];
  data?: any;
}

/** คอลัมน์อุปกรณ์ (O..X / item1.. / อุปกรณ์ชิ้นที่ …) */
const ITEM_COL_KEYS = [
  'O','P','Q','R','S','T','U','V','W','X',
  'อุปกรณ์ชิ้นที่ 1','อุปกรณ์ชิ้นที่ 2','อุปกรณ์ชิ้นที่ 3',
  'item1','item2','item3','item4','item5','item6','item7','item8','item9','item10'
];

/** API base สำหรับ SSR/CSR */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const pid = inject(PLATFORM_ID);
    if (isPlatformServer(pid)) {
      const env = (globalThis as any)?.process?.env ?? {};
      return env['API_TARGET'] ?? 'https://ect-borrow-be.onrender.com';
    }
    return ''; // browser ยิงแบบ relative เพื่อให้ proxy.conf.json ทำงาน
  },
});

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forecast.html',
  styleUrls: ['./forecast.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);

  /** ฟอร์มค้นหา */
  readonly form = this.fb.nonNullable.group({
    date: this.todayISO(),
    q: '',
  });

  loading = false;
  errorMsg = '';
  items: ForecastItem[] = [];

  /** raw ชีต (ใช้คำนวณฝั่ง client เมื่อ backend ไม่คำนวณให้) */
  private inventoryRows: InventoryRow[] = [];
  private formRows: FormRow[] = [];

  private destroy$ = new Subject<void>();

  get dateStr(): string {
    return this.form.controls.date.value || this.todayISO();
  }

  ngOnInit(): void {
    this.fetchData(); // โหลดรอบแรก

    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.onSearchChanged());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** โหลดข้อมูลจาก backend: ส่ง ?date=YYYY-MM-DD (&q=...) เสมอ */
  private fetchData(): void {
    this.loading = true;
    this.errorMsg = '';

    const dateISO = this.form.controls.date.value || this.todayISO();
    const q = (this.form.controls.q.value || '').trim();

    let params = new HttpParams().set('date', dateISO);
    if (q) params = params.set('q', q);

    this.http
      .get<BackendResponse>(`${this.apiBase}/api/forecast`, { params })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (raw: BackendResponse) => {
          const res = raw?.data ? (raw.data as BackendResponse) : raw;

          let items = res?.items ?? res?.devices ?? [];
          this.inventoryRows = res?.inventoryRows ?? res?.inventory ?? [];
          this.formRows      = res?.formRows ?? res?.forms ?? res?.formResponses ?? [];

          // ถ้า items ว่าง แต่มี inventory → สร้างจาก inventory
          if ((!items || items.length === 0) && this.inventoryRows.length > 0) {
            items = this.buildItemsFromInventory(this.inventoryRows, q);
          }
          this.items = items ?? [];

          // ถ้ามี raw sheets → คำนวณ remaining ฝั่ง client
          if (this.inventoryRows.length && this.formRows.length) {
            this.recomputeRemainingForDate(this.toDateOnly(dateISO));
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMsg = 'โหลดข้อมูลไม่สำเร็จ';
          console.error('[forecast] GET /api/forecast failed:', err);
          this.cdr.markForCheck();
        },
      });
  }

  /** เมื่อเปลี่ยน date/q ให้ refetch จาก backend */
  private onSearchChanged(): void {
    this.fetchData();
  }

  /** trackBy ของ *ngFor */
  trackByIdx(i: number): number { return i; }

  /** handler รูป */
  onImgError(e: Event): void {
    const el = e.target as HTMLImageElement | null;
    if (el) el.src = 'assets/no-image.png';
  }

  // ---------------- Fallback logic: คำนวณ “คงเหลือ” จาก raw sheets ----------------

  /** สร้างรายการ item จาก inventory (กรณี backend ไม่ส่ง items มา) */
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
    const qq = q.trim().toLowerCase();
    if (qq) {
      items = items.filter(it =>
        it.serial.toLowerCase().includes(qq) ||
        (it.name ?? '').toLowerCase().includes(qq)
      );
    }
    return items;
  }

  /** ————— Utilities: วัน/ช่วงวัน (ใช้ YMD string ป้องกัน timezone) ————— */

  /** ตัดเวลาออก ให้เป็นวันที่ล้วน (Date local) */
  private toDateOnly(d: Date | string | null | undefined): Date {
    if (!d) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const s = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, dd] = s.split('-').map(Number);
      return new Date(y, m - 1, dd);
    }
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let Y = +m[3]; if (Y < 100) Y += (Y >= 70 ? 1900 : 2000);
      return new Date(Y, +m[2] - 1, +m[1]);
    }
    const d2 = new Date(s);
    return new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  }

  /** แปลง input -> 'YYYY-MM-DD' โดยไม่ใช้ timezone และไม่ fallback ไป Date.parse (กันเพี้ยน)
   *  รองรับ: 'YYYY-MM-DD', 'DD/MM/YY', 'DD/MM/YYYY', 'DD-MM-YY', 'DD-MM-YYYY'
   *  - ปี 4 หลัก >= 2400 => พ.ศ. → ลบ 543
   *  - ปี 2 หลัก: >= 50 → 1900+YY, <50 → 2000+YY
   *  - ใช้ค่าคงที่ DATE_ORDER เพื่อระบุ DMY/MDY
   */
  private toYMD(input: string | Date | null | undefined): string {
    if (!input) return '';
    if (input instanceof Date) {
      const y = input.getFullYear();
      const m = String(input.getMonth() + 1).padStart(2, '0');
      const d = String(input.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    let s = String(input).trim();

    // ตัดเวลาที่ต่อท้าย เช่น "1/9/65 00:00"
    if (s.includes(' ')) s = s.split(' ')[0];

    // ISO 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // DMY/MDY: 1/9/65, 01-09-2025 ฯลฯ
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (!m) return ''; // ไม่ parse รูปแบบอื่น เพื่อกัน timezone เพี้ยน

    let d = +m[1], mo = +m[2], y = +m[3];

    // สลับวัน/เดือนตามการตั้งค่า
    if (DATE_ORDER === 'MDY') { const t = d; d = mo; mo = t; }

    // แก้ปีไทย/ปี 2 หลัก
    if (m[3].length === 4 && y >= 2400) y -= 543;      // 2568 -> 2025
    else if (m[3].length === 2) y = y >= 50 ? 1900 + y : 2000 + y;

    const D = String(d).padStart(2, '0');
    const M = String(mo).padStart(2, '0');
    return `${y}-${M}-${D}`;
  }

  /** เพิ่มวัน (รีเทิร์นเป็น YMD string) */
  private addDaysYMD(ymd: string, days: number): string {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  /** ระบุคอลัมน์อุปกรณ์ (O..X / item1.. / อุปกรณ์ชิ้นที่ …) */
  private isItemCol(key: string): boolean {
    const k = String(key).trim().toLowerCase();
    return ITEM_COL_KEYS.some(h => k === String(h).toLowerCase())
        || /อุปกรณ์ชิ้น|item\s*\d+|^\s*[opqrstuvwx]\s*$/.test(k);
  }

  /** >>> ตัด “จอง” เฉพาะวันยืม และวันถัดไป เท่านั้น <<< */
  private buildReservedMap(rows: FormRow[], target: Date): Map<string, number> {
    const t = this.toYMD(target);
    const map = new Map<string, number>();

    for (const row of rows ?? []) {
      const startRaw =
        (row.start ?? row['วันยืม'] ?? row['borrow'] ?? row['startDate']) as string | undefined;
      const s = this.toYMD(startRaw);
      if (!s) continue;

      const sPlus1 = this.addDaysYMD(s, 1);
      if (t !== s && t !== sPlus1) continue; // ← คัดวันอื่นออกทั้งหมด

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

  /** รวมสต็อก “พร้อมใช้งาน” ตาม serial */
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

  /** คำนวณ remaining สำหรับทุก item ตามวันที่กำหนด */
  private recomputeRemainingForDate(target: Date): void {
    if (!this.items || this.items.length === 0) return;

    const availableMap = this.buildAvailableMap(this.inventoryRows);
    const reservedMap  = this.buildReservedMap(this.formRows, target);

    for (const it of this.items) {
      const avail  = availableMap.get(it.serial) ?? (it.available ?? 0);
      const reserv = reservedMap.get(it.serial) ?? 0;
      it.remaining = Math.max(avail - reserv, 0);
    }
    this.items = [...this.items]; // trigger OnPush
    this.cdr.markForCheck();
  }

  /** 'YYYY-MM-DD' วันนี้ (โลคัลไทม์) */
  private todayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
