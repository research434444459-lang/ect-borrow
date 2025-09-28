import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TodayRow, getBorrowToday, getReturnToday } from './admin-today-data.mock';

// รูปแบบซองจดหมายจาก backend
interface ApiEnvelope<T> {
  data: T | null;
  meta?: any | null;
  error?: { code: string; message: string } | null;
}

// รูปแบบ payload ตามที่ตกลง
interface AdminTodayRow {
  requestId?: string;
  studentId: string;
  name: string;
  dateBorrow: string;            // YYYY-MM-DD
  time: string;                  // HH:mm
  dateReturn: string | null;     // YYYY-MM-DD | null
  giver: string | null;
  receiver: string | null;
  borrowAt?: string | null;
  returnAt?: string | null;
}
interface AdminTodayData {
  date: string;
  borrow: AdminTodayRow[];
  returns: AdminTodayRow[];
}

@Injectable({ providedIn: 'root' })
export class AdminTodayService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /** ดึงข้อมูลของวัน dateISO; ถ้า API ใช้ไม่ได้ จะ fallback เป็น mock */
  load(dateISO: string): Observable<{ borrow: TodayRow[]; returns: TodayRow[] }> {
    // SSR-safe: ไม่ยิงตอน SSR (ค่อย hydrate ฝั่ง browser)
    if (!isPlatformBrowser(this.platformId)) {
      return of({ borrow: getBorrowToday(dateISO), returns: getReturnToday(dateISO) });
    }

    const params = new HttpParams().set('date', dateISO);
    return this.http.get<ApiEnvelope<AdminTodayData>>('/api/admin/today', { params, withCredentials: true }).pipe(
      map(res => {
        if (!res?.data) {
          // ไม่มีข้อมูลจาก API → ใช้ mock
          return { borrow: getBorrowToday(dateISO), returns: getReturnToday(dateISO) };
        }
        const toRow = (x: AdminTodayRow): TodayRow => ({
          name: x.name,
          id: x.studentId,
          dateBorrow: x.dateBorrow,
          time: x.time,
          dateReturn: x.dateReturn || '',
          giver: x.giver || '',
          receiver: x.receiver || '',
        });
        return {
          borrow: (res.data.borrow || []).map(toRow),
          returns: (res.data.returns || []).map(toRow),
        };
      }),
      // error network/500 → mock
      catchError(() => of({ borrow: getBorrowToday(dateISO), returns: getReturnToday(dateISO) })),
    );
  }
}
