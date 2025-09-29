import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RequestService, RequestRecord, RequestStatusCode } from '../../services/request.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './requests.html',
  styleUrl: './requests.scss',
})
export class RequestsComponent {
  query = '';               // ชื่อ/รหัสนักศึกษา
  dateISO = '';             // YYYY-MM-DD
  loading = false;
  error = '';
  records: RequestRecord[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private api: RequestService) {
    const pm = this.route.snapshot.queryParamMap;
    this.query = pm.get('student') ?? '';
    this.dateISO = pm.get('date') ?? '';
    this.loadFromApi();
  }

  onQuery(value: string) {
    this.query = value;
    this.syncUrl();
    this.loadFromApi();
  }

  onDate(value: string) {
    this.dateISO = value;
    this.syncUrl();
    this.loadFromApi();
  }

  loadFromApi() {
    this.loading = true;
    this.error = '';
    this.api.list(this.query, this.dateISO).subscribe({
      next: (rows: RequestRecord[]) => {
        this.records = rows;
        this.loading = false;
      },
      error: (e: unknown) => {
        this.loading = false;
        this.error = 'โหลดข้อมูลไม่สำเร็จ';
        console.error(e);
      }
    });
  }

  byKey = (_i: number, r: RequestRecord) => `${r.studentId}_${r.date}`;

  // ---------- Utilities ----------
  fmtThai(dateISO: string) {
    if (!dateISO) return '-';
    try { return new Intl.DateTimeFormat('th-TH').format(new Date(dateISO)); }
    catch { return '-'; }
  }

  toYmd(d: string) {
    // รองรับทั้ง 'YYYY-MM-DD' และ ISO
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
    return d;
  }

  private syncUrl() {
    const queryParams: any = {};
    if (this.query.trim()) queryParams.student = this.query;
    if (this.dateISO)      queryParams.date = this.dateISO;
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  // ---------- สถานะ (ป้ายสี + ข้อความ) ----------
  statusText(s: RequestStatusCode) {
    const key = this.normStatus(s);
    if (key === 'approved')    return 'อนุมัติ';
    if (key === 'rejected')    return 'ไม่อนุมัติ';
    if (key === 'waived')      return 'สละสิทธิ์';
    if (key === 'unavailable') return 'อุปกรณ์ไม่พร้อมใช้งาน';
    if (key === 'returned')    return 'คืนของแล้ว';
    if (key === 'picked')      return 'รับของแล้ว';
    return 'ระหว่างดำเนินการ';
  }

  statusClass(s: RequestStatusCode) {
    const key = this.statusKey(s);
    switch (key) {
      case 'approved':    return 'b-ok';
      case 'rejected':    return 'b-bad';
      case 'waived':      return 'b-waive';
      case 'unavailable': return 'b-na';
      case 'returned':    return 'b-return';
      case 'picked':      return 'b-pick';
      default:            return 'b-warn';
    }
  }

  // ---- helpers: normalize ไทย/อังกฤษ/เว้นวรรค/“เเล้ว” ----
  private normStatus(s: RequestStatusCode): string {
    const t = String(s ?? '')
      .normalize('NFC')
      .replace(/\u200B/g, '')
      .replace(/เเล้ว/g, 'แล้ว')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const c = t.replace(/\s+/g, '');
    if (t === 'อนุมัติ') return 'approved';
    if (t === 'ไม่อนุมัติ') return 'rejected';
    if (t === 'สละสิทธิ์') return 'waived';
    if (t === 'อุปกรณ์ไม่พร้อมใช้งาน') return 'unavailable';
    if (c === 'คืนของแล้ว' || c === 'คืนแล้ว') return 'returned';
    if (c === 'รับของแล้ว' || c === 'รับแล้ว') return 'picked';
    if (['approved','rejected','waived','unavailable','returned','picked','pending'].includes(t)) return t;
    return t;
  }
  private statusKey(s: RequestStatusCode): 'approved'|'rejected'|'waived'|'unavailable'|'returned'|'picked'|'pending' {
    const t = this.normStatus(s);
    if (['approved','rejected','waived','unavailable','returned','picked'].includes(t)) return t as any;
    return 'pending';
  }
}
