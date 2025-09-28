import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { RequestService, RequestDetail, RequestStatusCode } from '../../services/request.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  studentId = '';
  dateISO = '';
  updatedAt = new Date();
  loading = false;
  error = '';
  detail: RequestDetail | null = null;

  constructor(private route: ActivatedRoute, private api: RequestService) {
    const pm = this.route.snapshot.paramMap;
    this.studentId = pm.get('studentId') ?? '';
    this.dateISO = pm.get('date') ?? '';
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.api.detail(this.studentId, this.dateISO).subscribe({
      next: (d: RequestDetail | null) => {
        this.detail = d;
        this.loading = false;
      },
      error: (e: unknown) => {
        this.loading = false;
        this.error = 'โหลดรายละเอียดไม่สำเร็จ';
        console.error(e);
      },
    });
  }

  // วันที่
  fmtThai(dateISO: string): string {
    if (!dateISO) return '-';
    try { return new Intl.DateTimeFormat('th-TH').format(new Date(dateISO)); }
    catch { return dateISO; }
  }
  fmtDateTimeThai(d: Date): string {
    try { return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
    catch { return d.toISOString(); }
  }

  // Normalize & Map สถานะ
  private normStatus(
    s?: RequestStatusCode
  ): 'approved'|'rejected'|'waived'|'unavailable'|'returned'|'picked'|'pending' {
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
    if (['approved','rejected','waived','unavailable','returned','picked'].includes(t)) return t as any;
    return 'pending';
  }

  statusText(s?: RequestStatusCode): string {
    const key = this.normStatus(s);
    if (key === 'approved')    return 'อนุมัติ';
    if (key === 'rejected')    return 'ไม่อนุมัติ';
    if (key === 'waived')      return 'สละสิทธิ์';
    if (key === 'unavailable') return 'อุปกรณ์ไม่พร้อมใช้งาน';
    if (key === 'returned')    return 'คืนของแล้ว';
    if (key === 'picked')      return 'รับของแล้ว';
    return 'ระหว่างดำเนินการ';
  }

  statusClass(s?: RequestStatusCode): string {
    const key = this.normStatus(s);
    if (key === 'approved')    return 'status-card ok';
    if (key === 'rejected')    return 'status-card bad';
    if (key === 'waived')      return 'status-card waive';
    if (key === 'unavailable') return 'status-card na';
    if (key === 'returned')    return 'status-card return';
    if (key === 'picked')      return 'status-card pick';
    return 'status-card wait';
  }
}
