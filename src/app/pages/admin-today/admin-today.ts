import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TodayRow, todayIso } from '../../services/admin-today-data.mock';
import { AdminTodayService } from '../../services/admin-today.service';

@Component({
  selector: 'app-admin-today',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-today.html',
  styleUrls: ['./admin-today.scss'],
})
export class AdminTodayComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private svc = inject(AdminTodayService);

  readonly todayIso = todayIso();
  readonly todayText = new Date().toLocaleDateString('th-TH');

  borrowData: TodayRow[] = [];
  returnData: TodayRow[] = [];

  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.errorMsg = '';
    this.svc.load(this.todayIso).subscribe({
      next: ({ borrow, returns }) => {
        this.borrowData = borrow;
        this.returnData = returns;
      },
      error: () => {
        // ปกติจะไม่เข้ามา เพราะ catchError ใน service คืน mock ให้แล้ว
        this.errorMsg = 'ไม่สามารถดึงข้อมูลได้ กำลังใช้ข้อมูลจำลองแทน';
      },
      complete: () => { this.loading = false; },
    });
  }

  toThai(d?: string) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('th-TH'); } catch { return d; }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
  
}

