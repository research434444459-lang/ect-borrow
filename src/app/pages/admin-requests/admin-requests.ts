import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

import {
  AdminRequestRow,
  AdminRequestStatus,
} from '../../services/admin-requests-data.mock';
import {
  AdminRequestsService,
  AdminRequestsLoadResult,
} from '../../services/admin-requests.service';

const STATUSES = [
  'อนุมัติ',
  'ไม่อนุมัติ',
  'สละสิทธิ์',
  'อุปกรณ์ไม่พร้อมใช้งาน',
  'คืนของแล้ว',
  'รับของแล้ว',
] as const;

function isStatus(s: string): s is AdminRequestStatus {
  return (STATUSES as readonly string[]).includes(s);
}

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-requests.html',
  styleUrls: ['./admin-requests.scss'],
})
export class AdminRequestsComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private svc = inject(AdminRequestsService);

  // ฟิลเตอร์
  q = '';
  date = '';
  status: AdminRequestStatus | '' = '';

  // ตาราง
  rows: AdminRequestRow[] = [];

  // หน้า/จำนวน
  page = 1;
  pageSize = 50;
  total = 0;

  // state สำหรับ template
  loading = false;
  errorMsg = '';

  // สถานะทั้งหมด (สำหรับดร็อปดาวน์)
  readonly statuses: readonly AdminRequestStatus[] = STATUSES;

  // สำหรับ sort หัวคอลัมน์ "สถานะ"
  sort: { key: string; dir: 1 | -1 } = { key: '', dir: 1 };

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;

    this.q = (p.get('q') || p.get('student') || '').trim();
    this.date = (p.get('date') || '').trim();

    const svRaw = (p.get('status') || '').trim();
    this.status = isStatus(svRaw) ? svRaw as AdminRequestStatus : '';

    const pageRaw = Number(p.get('page') || 1);
    const pageSizeRaw = Number(p.get('pageSize') || 50);
    this.page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    this.pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1 ? pageSizeRaw : 50;

    this.fetch(false);
  }

  applyFilter(pushUrl = true) {
    this.page = 1;
    this.fetch(pushUrl);
  }

  fetch(pushUrl = true) {
    this.loading = true;
    this.errorMsg = '';

    if (pushUrl) {
      const qp: any = {};
      if (this.q) { qp.q = this.q; qp.student = this.q; }
      if (this.date) qp.date = this.date;
      if (this.status) qp.status = this.status;
      if (this.page && this.page !== 1) qp.page = this.page;
      if (this.pageSize && this.pageSize !== 50) qp.pageSize = this.pageSize;
      this.router.navigate([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: '' });
    }

    this.svc.load({
      q: this.q,
      student: this.q,
      date: this.date,
      status: this.status,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (res: AdminRequestsLoadResult) => {
        const { rows, page, pageSize, total } = res;
        this.rows = rows;
        this.page = page;
        this.pageSize = pageSize;
        this.total = total;

        // ถ้าก่อนหน้าผู้ใช้กด sort ไว้ ให้คงลำดับไว้
        if (this.sort.key === 'status') {
          this.sortByStatus(this.sort.dir);
        }
      },
      error: (e: unknown) => {
        this.errorMsg = e instanceof Error ? e.message : 'ไม่สามารถดึงข้อมูลได้';
      },
      complete: () => { this.loading = false; },
    });
  }

  toThai(d?: string) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('th-TH'); } catch { return d; }
  }

  // สี badge สถานะ (ใช้ ngStyle เพื่อไม่ไปพึ่ง SCSS เดิม)
  statusBadgeStyle(status?: string) {
    const s = (status || '').trim();
    // พาเลตต์โทนอ่อน อ่านง่ายบนพื้นหลัง
    const styles: Record<string, { background: string; color: string; border?: string }> = {
      'อนุมัติ': { background: '#dcfce7', color: '#166534' },              // เขียวอ่อน
      'ไม่อนุมัติ': { background: '#fee2e2', color: '#991b1b' },           // แดงอ่อน
      'สละสิทธิ์': { background: '#e5e7eb', color: '#374151' },            // เทา
      'อุปกรณ์ไม่พร้อมใช้งาน': { background: '#fef3c7', color: '#92400e' }, // เหลือง
      'รับของแล้ว': { background: '#dbeafe', color: '#1e3a8a' },           // น้ำเงิน
      'คืนของแล้ว': { background: '#ede9fe', color: '#5b21b6' },           // ม่วง
      'DEFAULT': { background: '#f1f5f9', color: '#334155' },               // Slate อ่อน
    };
    return styles[s] || styles['DEFAULT'];
  }

  // กดหัวคอลัมน์ "สถานะ" เพื่อเรียง
  onSort(key: 'status') {
    if (this.sort.key === key) {
      this.sort.dir = this.sort.dir === 1 ? -1 : 1;
    } else {
      this.sort.key = key;
      this.sort.dir = 1;
    }
    this.sortByStatus(this.sort.dir);
  }

  private sortByStatus(dir: 1 | -1) {
    // ลำดับกลุ่มสถานะ (ปรับได้ตามที่ต้องการ)
    const order = [
      'อนุมัติ',
      'รับของแล้ว',
      'คืนของแล้ว',
      'อุปกรณ์ไม่พร้อมใช้งาน',
      'ไม่อนุมัติ',
      'สละสิทธิ์',
    ];
    const idx = (s?: string) => {
      const i = order.indexOf((s || '').trim());
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    this.rows = [...this.rows].sort((a, b) => (idx(a.status) - idx(b.status)) * dir);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  getRequestId(r: any): string | undefined {
    return r?.requestId ?? r?.reqId ?? r?.request_id ?? undefined;
  }
}
