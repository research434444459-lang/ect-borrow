// src/app/pages/forecast/forecast.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** ---------------- Types ---------------- */
export interface ForecastItem {
  serial: string;
  name?: string;
  imageUrl?: string;
  available?: number;
  remaining?: number;
  group?: string;
}

interface BackendMeta {
  title?: string;
  subtitle?: string;
  dateStr?: string; // ถ้ามีส่งมาจาก BE
}

interface BackendDataBlock {
  meta?: BackendMeta | null;
  items?: ForecastItem[] | null;
}

interface BackendResponse {
  data?: BackendDataBlock | ForecastItem[] | null;
  error?: { code?: string; message?: string } | null;
}

/** ---------------- Component ---------------- */
@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    HttpClientModule,
  ],
  templateUrl: './forecast.html',
  styleUrls: ['./forecast.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  loading = false;
  errorMsg = '';
  items: ForecastItem[] = [];
  // แสดงใน UI (ถ้า BE ไม่มี meta.dateStr จะฟอร์แมตเอง)
  dateStr = '';

  form = this.fb.group({
    q: this.fb.control<string>(''),
    date: this.fb.control<string>(this.todayISO()),
  });

  ngOnInit(): void {
    // ยิงครั้งแรก
    this.fetch();

    // เปลี่ยนค่าจากฟอร์มแล้วยิงใหม่ (หน่วงเล็กน้อย)
    this.form.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.fetch());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** โหลดข้อมูลจาก BE */
  private fetch(): void {
    const q = (this.form.controls.q.value || '').trim();
    const dateISO = (this.form.controls.date.value || this.todayISO()).trim();

    const params = new HttpParams()
      .set('date', dateISO)
      .set('q', q);

    this.loading = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    // ✅ เรียกผ่าน absolute URL จาก environment (ลงท้ายด้วย /api แล้ว)
    this.http
      .get<BackendResponse>(`${environment.apiBaseUrl}/forecast`, { params })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          // รองรับทั้งแบบ {data:{items}} และ {data:[...]} หรือ {items:[...]}
          const dataBlock = (res?.data && !Array.isArray(res.data)) ? res.data as BackendDataBlock : null;
          const arrFromDataBlock = dataBlock?.items ?? null;
          const arrFromTopLevelData = Array.isArray(res?.data) ? (res?.data as ForecastItem[]) : null;
          const items = arrFromDataBlock ?? arrFromTopLevelData ?? [];

          this.items = (items ?? []).filter(Boolean) as ForecastItem[];

          // ตั้งค่า dateStr ให้สวยขึ้น
          this.dateStr =
            dataBlock?.meta?.dateStr ??
            this.fmtThaiDMY(dateISO); // เผื่อ BE ไม่ส่ง meta.dateStr มา

          if (res?.error) {
            this.errorMsg = res.error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
          }
        },
        error: (err) => {
          this.errorMsg = (err?.error?.error?.message) || err?.message || 'ผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
        },
      });
  }

  /** 'YYYY-MM-DD' วันนี้ (โลคัลไทม์) */
  private todayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** แปลง YYYY-MM-DD → D/M/YYYY (ไม่ใส่ศูนย์นำหน้า) */
  private fmtThaiDMY(iso: string): string {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return `${d}/${mo}/${y}`;
  }
}
