import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.scss'],
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  showPw = false;
  loading = false;
  errorMsg = '';

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  togglePw() { this.showPw = !this.showPw; }

  async submit() {
    this.errorMsg = '';
    if (this.form.invalid) return;
    if (!isPlatformBrowser(this.platformId)) return;

    const { username, password, remember } = this.form.value;
    this.loading = true;
    try {
      const ok = await this.auth.login(String(username), String(password), !!remember);
      if (ok) {
        this.router.navigateByUrl('/admin'); // ✅ ไปหน้าแอดมิน
      } else {
        this.errorMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      }
    } catch (e: any) {
      this.errorMsg = e?.message || 'ไม่สามารถเข้าสู่ระบบได้';
    } finally {
      this.loading = false;
    }
  }
}
