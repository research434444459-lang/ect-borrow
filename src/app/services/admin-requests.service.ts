import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  AdminRequestRow,
  AdminRequestStatus,
  filterAdminRequests,
} from './admin-requests-data.mock';

export interface AdminRequestsLoadResult {
  rows: AdminRequestRow[];
  page: number;
  pageSize: number;
  total: number;
}

export type LoadParams = {
  q?: string;
  student?: string;
  date?: string;
  status?: AdminRequestStatus | '';
  page?: number;
  pageSize?: number;
};

interface ApiEnvelope<T> {
  data: T | null;
  meta: any | null;
  error: { code: string; message: string } | null;
}

interface AdminRequestsItemApi {
  requestId: string;
  studentId: string;
  name: string;
  dateBorrow: string;
  time: string;
  dateReturn: string | null;
  giver: string | null;
  receiver: string | null;
  status:
    | 'อนุมัติ'
    | 'ไม่อนุมัติ'
    | 'สละสิทธิ์'
    | 'อุปกรณ์ไม่พร้อมใช้งาน'
    | 'คืนของแล้ว'
    | 'รับของแล้ว';
}

interface AdminRequestsPayload {
  items: AdminRequestsItemApi[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminRequestsService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  load(params: LoadParams): Observable<AdminRequestsLoadResult> {
    // SSR → ใช้ mock
    if (!isPlatformBrowser(this.platformId)) {
      const rows = filterAdminRequests(params);
      const n = rows.length;
      return of({ rows, page: 1, pageSize: n, total: n });
    }

    // สร้าง query string
    let hp = new HttpParams();
    if (params.q) hp = hp.set('q', params.q);
    if (params.student) hp = hp.set('student', params.student);
    if (params.date) hp = hp.set('date', params.date);
    if (params.status) hp = hp.set('status', params.status as string);
    if (params.page) hp = hp.set('page', String(params.page));
    if (params.pageSize) hp = hp.set('pageSize', String(params.pageSize));

    return this.http.get<ApiEnvelope<AdminRequestsPayload>>('/api/admin/requests', {
      params: hp,
      withCredentials: true,
    }).pipe(
      map((res): AdminRequestsLoadResult => {
        if (!res?.data) {
          const rows = filterAdminRequests(params);
          const n = rows.length;
          return { rows, page: 1, pageSize: n, total: n };
        }
        const rows: AdminRequestRow[] = (res.data.items || []).map(x => ({
          name: x.name,
          id: x.studentId,
          dateBorrow: x.dateBorrow,
          time: x.time,
          dateReturn: x.dateReturn || '',
          giver: x.giver || '',
          receiver: x.receiver || '',
          status: x.status,
        }));
        return {
          rows,
          page: res.data.page ?? 1,
          pageSize: res.data.pageSize ?? rows.length,
          total: res.data.total ?? rows.length,
        };
      }),
      catchError(() => {
        const rows = filterAdminRequests(params);
        const n = rows.length;
        return of({ rows, page: 1, pageSize: n, total: n });
      }),
    );
  }
}
