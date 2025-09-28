import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';
import {
  AdminRequestDetailService,
  AdminRequestDetailView,
  SavePayload,
} from '../../services/admin-request-detail.service';

// สถานะทั้งหมด (แบบ union ให้ type-check ตรง)
type StatusType =
  | 'อนุมัติ'
  | 'ไม่อนุมัติ'
  | 'สละสิทธิ์'
  | 'อุปกรณ์ไม่พร้อมใช้งาน'
  | 'คืนของแล้ว'
  | 'รับของแล้ว';

// ฟอร์มของ 1 แถวอุปกรณ์
type ItemFG = FormGroup<{
  name: FormControl<string | null>;
  number: FormControl<string | null>;
}>;

@Component({
  selector: 'app-admin-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-request-detail.html',
  styleUrls: ['./admin-request-detail.scss'],
})
export class AdminRequestDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private svc = inject(AdminRequestDetailService);

  loading = true;
  saving = false;
  errorMsg = '';

  // ตัวชี้เป้า
  requestId?: string;
  studentId = '';
  dateBorrow = '';

  // ข้อมูลที่แสดงในหน้า (ชนิดจาก service)
  detail!: AdminRequestDetailView;

  // กล่องแสดงผลแบบอ่านอย่างเดียว (รวมฟิลด์เสริม)
  readonlyBox!: {
    status: string;
    timestamp: string;
    dateBorrow: string;
    time: string;
    dateReturn?: string;
    fullname: string;
    studentId: string;
    phone?: string;
    groupMembers?: string;
    courseName?: string;
    courseOther?: string;
    teacher?: string;
    giver?: string;
    receiver?: string;
  };

  // ฟอร์มแก้ไข
  form!: FormGroup<{
    status: FormControl<StatusType>;
    giver: FormControl<string | null>;
    receiver: FormControl<string | null>;
    items: FormArray<ItemFG>;
    missingItems: FormControl<string | null>;
    activityItems: FormControl<string | null>;
  }>;

  ngOnInit(): void {
    // รองรับทั้ง requestId (query) หรือ studentId+date (path)
    this.requestId = this.route.snapshot.queryParamMap.get('requestId') || undefined;
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.dateBorrow = this.route.snapshot.paramMap.get('date') || '';

    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.errorMsg = '';
    this.svc
      .load({ requestId: this.requestId, studentId: this.studentId, date: this.dateBorrow })
      .subscribe({
        next: (d) => {
          this.detail = d;
          this.requestId = this.requestId || d.requestId;

          // เตรียมกล่องอ่านอย่างเดียว
          this.readonlyBox = {
            status: d.status,
            timestamp: d.timestamp,
            dateBorrow: d.dateBorrow,
            time: d.time,
            dateReturn: d.dateReturn,
            fullname: d.fullname,
            studentId: d.studentId,
            phone: d.phone,
            groupMembers: d.groupMembers,
            courseName: d.courseName,
            courseOther: d.courseOther,
            teacher: d.teacher,
            giver: d.giver,
            receiver: d.receiver,
          };

          // สร้างฟอร์ม
          const allow: StatusType[] = [
            'อนุมัติ',
            'ไม่อนุมัติ',
            'สละสิทธิ์',
            'อุปกรณ์ไม่พร้อมใช้งาน',
            'คืนของแล้ว',
            'รับของแล้ว',
          ];
          const initStatus: StatusType = allow.includes(d.status as StatusType)
            ? (d.status as StatusType)
            : 'อนุมัติ';

          this.form = this.fb.nonNullable.group({
            status: this.fb.nonNullable.control<StatusType>(initStatus),
            giver: this.fb.control<string | null>(d.giver ?? ''),
            receiver: this.fb.control<string | null>(d.receiver ?? ''),
            items: this.fb.array<ItemFG>([]) as FormArray<ItemFG>,
            missingItems: this.fb.control<string | null>(d.missingItems?.trim() || '-'),
            activityItems: this.fb.control<string | null>(d.activityItems?.trim() || '-'),
          });

          // เติมรายการอุปกรณ์ครบ 10 ช่อง (ไม่มี = '-')
          for (let i = 0; i < 10; i++) {
            const src = d.items?.[i];
            const name = (src?.name && src.name.trim()) ? src.name : '-';
            const number = (src?.number && String(src.number).trim()) || '';
            this.items.push(
              this.fb.group({
                name: this.fb.control<string | null>(name),
                number: this.fb.control<string | null>(number),
              })
            );
          }
        },
        error: (e: unknown) => {
          this.errorMsg = e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ';
        },
        complete: () => (this.loading = false),
      });
  }

  get items(): FormArray<ItemFG> {
    return this.form.controls.items;
  }

  badgeClass(status?: string): string {
    const v = (status ?? this.form?.controls.status.value) as
      | 'อนุมัติ'
      | 'ไม่อนุมัติ'
      | 'สละสิทธิ์'
      | 'อุปกรณ์ไม่พร้อมใช้งาน'
      | 'คืนของแล้ว'
      | 'รับของแล้ว'
      | undefined;

    switch (v) {
      case 'อนุมัติ': return 'badge b-approve';
      case 'ไม่อนุมัติ': return 'badge b-reject';
      case 'สละสิทธิ์': return 'badge b-waived';
      case 'อุปกรณ์ไม่พร้อมใช้งาน': return 'badge b-unavail';
      case 'คืนของแล้ว': return 'badge b-returned';
      case 'รับของแล้ว': return 'badge b-received';
      default: return 'badge'; // เผื่อยังไม่มีค่า
    }
  }

  // ปุ่มลบแถวในรายการอุปกรณ์ (ชิ้นที่ 1–10)
  removeItem(idx: number) {
    if (!this.form) return;
    const arr = this.items; // FormArray<ItemFG>
    if (idx >= 0 && idx < arr.length) {
      arr.removeAt(idx);
    }
  }
  
  toThai(d?: string) {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('th-TH');
    } catch {
      return d;
    }
  }

  back() {
    if (history.length > 1) history.back();
    else this.router.navigate(['/admin/requests']);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  save() {
    if (!this.form || !this.detail) return;
    this.saving = true;
    this.errorMsg = '';
  
    const payload: SavePayload = {
      status: this.form.controls.status.value,
      giver: (this.form.controls.giver.value ?? '').toString(),
      receiver: (this.form.controls.receiver.value ?? '').toString(),
      items: this.items.controls.map(g => ({
        name: (g.controls.name.value ?? '').toString().trim(),
        number: (g.controls.number.value ?? '').toString().trim(),
      })),
      missingItems: (this.form.controls.missingItems.value ?? '').toString().trim(),
      activityItems: (this.form.controls.activityItems.value ?? '').toString().trim(),
    };
  
    this.svc
      .save(payload, { 
        requestId: this.requestId || this.detail.requestId,
        studentId: this.studentId, 
        date: this.dateBorrow 
      }
    )
      .pipe(finalize(() => { this.saving = false; })) // ⬅️ ปิดสปินเสมอ
      .subscribe({
        next: () => {
          alert('บันทึกสำเร็จ');
          this.fetch();
        },
        error: (e: unknown) => {
          this.errorMsg = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ';
          console.error('save error:', e);
        },
      });
  }

  
}
