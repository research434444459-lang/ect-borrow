import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export type RequestStatusCode =
  | 'approved' | 'pending' | 'rejected'
  | 'waived' | 'unavailable' | 'returned' | 'picked'
  | string;

export interface RequestRecord {
  name: string;
  studentId: string;
  date: string;                // YYYY-MM-DD (normalized)
  status: RequestStatusCode;
}

export interface RequestDetail {
  name: string;
  studentId: string;
  date: string;                // YYYY-MM-DD (normalized)
  status: RequestStatusCode;
  ts: string;
  year: string;
  phone: string;
  groupMembers: string[];
  confirmedRules: boolean;
  pickupDate: string;
  pickupTime: string;
  courseName: string;
  otherCourse?: string;
  teacher?: string;
  items: Array<{ label: string; value: string }>;
  adminNote?: string;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  /** ถ้าใช้ proxy dev: '/api' ; ถ้าเรียกตรง: 'http://localhost:8080/api' */
  private base = '/api';

  constructor(private http: HttpClient) {}

  /** รายการคำขอ (หน้า /requests) */
  list(student = '', dateInput = ''): Observable<RequestRecord[]> {
    let params = new HttpParams();
    if (student.trim()) params = params.set('student', student.trim());

    const qDate = this.toISODate(dateInput);
    if (qDate) params = params.set('date', qDate);

    return this.http.get<any>(`${this.base}/requests`, { params }).pipe(
      map((res) => {
        const raw = Array.isArray(res) ? res
                 : Array.isArray(res?.data) ? res.data
                 : [];
        return raw.map(this.adaptRecord);
      }),
      catchError((err) => {
        console.error('list requests failed', err);
        return of([] as RequestRecord[]);
      })
    );
  }

  /** รายละเอียดคำขอ (หน้า /requests/:studentId/:date) */
  detail(studentId: string, dateInput: string): Observable<RequestDetail | null> {
    const dateISO = this.toISODate(dateInput) || dateInput;
    return this.http.get<any>(`${this.base}/requests/${encodeURIComponent(studentId)}/${dateISO}`).pipe(
      map((res) => {
        const raw =
          res?.data ?? res?.result ?? res?.payload ??
          (Array.isArray(res) ? res[0] : res) ?? null;
        return raw ? this.adaptDetail(raw) : null;
      }),
      catchError((err) => {
        console.error('get request detail failed', err);
        return of(null);
      })
    );
  }

  /** map record จาก API → รูปแบบที่ FE ใช้ */
  private adaptRecord = (r: any): RequestRecord => {
    const rawDate =
      r.date ?? r.borrowDate ?? r.pickupDate ?? r.requestedDate ?? r.startDate ?? '';
    return {
      name: r.name ?? r.fullname ?? '',
      studentId: r.studentId ?? r.sid ?? '',
      date: this.toISODate(rawDate),
      status: r.status ?? r.state ?? 'pending',
    };
  };

  /** map detail จาก API → รูปแบบที่ FE ใช้ */
  private adaptDetail = (d: any): RequestDetail => ({
    name: d.name ?? d.fullname ?? '',
    studentId: d.studentId ?? d.sid ?? '',
    date: this.toISODate(d.date ?? d.borrowDate ?? d.requestedDate ?? ''),
    status: d.status ?? d.state ?? 'pending',
    ts: d.ts ?? d.timestamp ?? '',
    year: d.year ?? '',
    phone: d.phone ?? d.tel ?? '',
    groupMembers: Array.isArray(d.groupMembers) ? d.groupMembers : [],
    confirmedRules: Boolean(d.confirmedRules),

    pickupDate: this.toISODate(d.pickupDate ?? ''),
    pickupTime: d.pickupTime ?? '',

    courseName: d.courseName ?? '',
    otherCourse: d.otherCourse ?? '',
    teacher: d.teacher ?? '',

    items: Array.isArray(d.items)
      ? d.items.map((it: any) => ({
          label: it.label ?? it.name ?? '',
          value: it.value ?? it.desc ?? '',
        }))
      : [],

    adminNote: d.adminNote ?? '',
  });

  /** แปลงวันที่หลายรูปแบบ → 'YYYY-MM-DD' (รองรับ พ.ศ. 25xx และ ISO ที่มีเวลา) */
  private toISODate(input: any): string {
    if (!input) return '';
    let s = String(input).trim().replace(/^['"]|['"]$/g, '');

    // ถ้าเป็น ISO DateTime → ตัดเอา date ส่วนหน้า
    const isoDateTime = /^(\d{4})-(\d{2})-(\d{2})[T ]/;
    const mIsoDT = s.match(isoDateTime);
    if (mIsoDT) return `${mIsoDT[1]}-${mIsoDT[2]}-${mIsoDT[3]}`;

    // 'YYYY-MM-DD' หรือ 'YYYY/MM/DD'
    const ymd1 = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;
    const mYmd1 = s.match(ymd1);
    if (mYmd1) {
      let y = parseInt(mYmd1[1], 10);
      const m = this.pad2(mYmd1[2]);
      const d = this.pad2(mYmd1[3]);
      if (y > 2400) y -= 543; // พ.ศ. → ค.ศ.
      return `${y}-${m}-${d}`;
    }

    // 'DD/MM/YYYY' หรือ 'D-M-YYYY' (ไทยมักใช้วัน/เดือน/ปี)
    const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const mDmy = s.match(dmy);
    if (mDmy) {
      let y = parseInt(mDmy[3], 10);
      const m = this.pad2(mDmy[2]);
      const d = this.pad2(mDmy[1]);
      if (y < 100) y += 2000;
      if (y > 2400) y -= 543; // พ.ศ. → ค.ศ.
      return `${y}-${m}-${d}`;
    }

    // พยายามด้วย Date() เป็นกรณีพิเศษ
    const t = Date.parse(s);
    if (!isNaN(t)) {
      const dt = new Date(t);
      return `${dt.getFullYear()}-${this.pad2(dt.getMonth() + 1)}-${this.pad2(dt.getDate())}`;
    }

    return '';
  }

  private pad2(v: string | number): string {
    const n = typeof v === 'number' ? v : parseInt(v, 10);
    return n < 10 ? `0${n}` : String(n);
  }
}
