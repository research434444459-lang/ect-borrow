import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { map, switchMap, timeout, catchError, tap } from 'rxjs';

export type Item = { name: string; number?: string; non?: string; other?: string };

export interface AdminRequestDetailDTO {
  requestId: string;
  studentId: string;
  name: string;
  phone?: string;
  groupMembers?: string;
  courseName?: string;
  courseOther?: string;
  teacher?: string;
  status: string;
  timestamp: string;
  dateBorrow: string;
  time: string;
  dateReturn?: string | null;
  giver?: string | null;
  receiver?: string | null;
  items: Item[];
  attachments?: any[];

  // ใหม่ (คอลัมน์ Y/Z)
  missingItems?: string | null;
  activityItems?: string | null;
}

export interface AdminRequestDetailView {
  requestId: string;
  studentId: string;
  fullname: string;
  status: string;
  timestamp: string;
  dateBorrow: string;
  time: string;
  dateReturn?: string;
  giver?: string;
  receiver?: string;
  items: { name: string; number?: string }[]; // length = 10
  missingItems: string;
  activityItems: string;

  // ฟิลด์เสริมที่หน้า readonly ใช้
  phone?: string;
  groupMembers?: string;
  courseName?: string;
  courseOther?: string;
  teacher?: string;
  attachments?: any[];
}

export type SavePayload = {
  status: string;
  giver: string;
  receiver: string;
  items: { name: string; number?: string }[];  // map ไป O..X / AF..AO
  missingItems: string;   // Y
  activityItems: string;  // Z
};

type LoadKeys = { requestId?: string; studentId?: string; date?: string };

@Injectable({ providedIn: 'root' })
export class AdminRequestDetailService {
  private http = inject(HttpClient);
  private base = '/api/admin/requests';
  private lastId?: string;


  /** โหลดรายละเอียดคำขอ: รองรับทั้ง requestId หรือ studentId+date */
  load(keys: LoadKeys) {
    if (keys.requestId) {
      return this.http.get<any>(`${this.base}/${keys.requestId}`).pipe(
        timeout(10000),
        map(this.unwrap),
        map((d: AdminRequestDetailDTO) => this.toView(d)),
        catchError(() => throwError(() => new Error('โหลดรายละเอียดไม่สำเร็จ (timeout/เครือข่าย)')))
      );
    }

    if (keys.studentId && keys.date) {
      const qs = new URLSearchParams({ student: keys.studentId, date: keys.date, pageSize: '1' }).toString();
      return this.http.get<any>(`${this.base}?${qs}`).pipe(
        timeout(10000),
        map(this.unwrap), // -> ควรได้ {items:[...]} ตามตัวอย่างใน Network
        map((res: any) => {
          // รองรับทั้ง {items:[...]}, {rows:[...]}, หรือ array ตรง
          const list = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.rows)
              ? res.rows
              : Array.isArray(res)
                ? res
                : [];
          return list as any[];
        }),
        switchMap((list: any[]) => {
          if (!Array.isArray(list) || list.length === 0) {
            return throwError(() => new Error('ไม่พบคำขอที่ตรงกับ studentId/date'));
          }
          const first: any = list[0];
          const reqId: string | undefined =
            first?.requestId ?? first?.reqId ?? first?.request_id ?? undefined;
          if (!reqId) {
            return throwError(() => new Error('ไม่พบ requestId ในผลลัพธ์รายการ'));
          }
          return this.http.get<any>(`${this.base}/${reqId}`).pipe(
            timeout(10000),
            map(this.unwrap),
            map((d: AdminRequestDetailDTO) => this.toView(d)),
            catchError(() => throwError(() => new Error('โหลดรายละเอียดไม่สำเร็จ (timeout/เครือข่าย)')))
          );
        }),
        catchError(() => throwError(() => new Error('โหลดรายการไม่สำเร็จ (timeout/เครือข่าย)')))
      );
    }

    return throwError(() => new Error('ต้องระบุ requestId หรือ studentId+date'));
  }

  /** บันทึก (PATCH): ถ้ามี requestId ก็ยิงตรง ถ้าไม่มีจะหา id จาก studentId+date ให้ก่อน */
  save(payload: SavePayload, keys: LoadKeys) {
    const doPatch = (id: string) => {
      const itemsArr = (payload.items || []).slice(0, 10).map(it => ({
        name: (it.name ?? '').toString(),
        number: (it.number ?? '').toString() || undefined,
      }));
      const body: any = {
        status: payload.status,
        giver: payload.giver,
        receiver: payload.receiver,
        items: itemsArr,
        // ⬇️ เพิ่ม “สำรองความเข้ากันได้” กับ BE เก่า
        itemsNames: itemsArr.map(it => it.name),  // O..X
        non: payload.missingItems ?? '',          // Y (ชื่อเดิม)
        other: payload.activityItems ?? '',       // Z (ชื่อเดิม)
        // ⬇️ และคีย์ใหม่ที่ BE รุ่นล่าสุดรองรับ
        missingItems: payload.missingItems ?? '',
        activityItems: payload.activityItems ?? '',
      };
    
      return this.http.patch<any>(`${this.base}/${id}`, body).pipe(
        timeout(10000),
        map(this.unwrap),
        catchError((err) => {
          // ดึงข้อความจาก BE ถ้ามี
          const msg =
            err?.error?.message ||
            err?.message ||
            'บันทึกไม่สำเร็จ (เครือข่าย/เซิร์ฟเวอร์)';
          return throwError(() => new Error(msg));
        })
      );
    };

    const resolvedId = keys.requestId ?? this.lastId;
if (resolvedId) return doPatch(resolvedId);

    if (keys.studentId && keys.date) {
      const qs = new URLSearchParams({ student: keys.studentId, date: keys.date, pageSize: '1' }).toString();
      return this.http.get<any>(`${this.base}?${qs}`).pipe(
        timeout(10000),
        map(this.unwrap),
        map((res: any) => {
          const list = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.rows)
              ? res.rows
              : Array.isArray(res)
                ? res
                : [];
          return list as any[];
        }),
        switchMap((list: any[]) => {
          const first: any = Array.isArray(list) ? list[0] : undefined;
          const reqId: string | undefined =
            first?.requestId ?? first?.reqId ?? first?.request_id ?? undefined;
          if (!reqId) return throwError(() => new Error('ไม่พบ requestId สำหรับการบันทึก'));
          return doPatch(reqId);
        }),
        catchError(() => throwError(() => new Error('โหลดรายการไม่สำเร็จ (timeout/เครือข่าย)')))
      );
    }

    return throwError(() => new Error('ต้องระบุ requestId หรือ studentId+date สำหรับการบันทึก'));
  }

  // ===== Helpers =====

  /** รองรับ envelope ทั้ง {data: ...} และ payload ตรง */
  private unwrap<T = any>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp) return resp.data as T;
    return resp as T;
  }

  /** แปลง DTO → ViewModel ที่หน้า UI ใช้งาน */
  private toView(d: AdminRequestDetailDTO): AdminRequestDetailView {
    const items10 = Array.from({ length: 10 }).map((_, i) => {
      const src = d.items?.[i] as Item | undefined;
      return {
        name: (src?.name && src.name.trim()) ? src.name : '-',
        number: (src?.number && String(src.number).trim()) || undefined,
      };
    });

    const missing = (d.missingItems && d.missingItems.trim())
      || (d.items?.[0]?.non?.toString().trim())
      || '-';

    const activity = (d.activityItems && d.activityItems.trim())
      || (d.items?.[0]?.other?.toString().trim())
      || '-';

    return {
      requestId: d.requestId,
      studentId: d.studentId,
      fullname: d.name,
      status: d.status,
      timestamp: d.timestamp,
      dateBorrow: d.dateBorrow,
      time: d.time,
      dateReturn: d.dateReturn ?? undefined,
      giver: d.giver ?? undefined,
      receiver: d.receiver ?? undefined,
      items: items10,
      missingItems: missing,
      activityItems: activity,
      // ฟิลด์เสริม
      phone: d.phone || undefined,
      groupMembers: d.groupMembers || undefined,
      courseName: d.courseName || undefined,
      courseOther: d.courseOther || undefined,
      teacher: d.teacher || undefined,
      attachments: d.attachments || [],
    };
    
  }
}
