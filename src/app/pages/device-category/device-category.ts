import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DeviceService, DeviceItem, CategorySlug } from '../../services/device.service';
import { CATEGORY_META } from '../../services/device-data.mock'; // ยังใช้ meta ชื่อหมวดได้เหมือนเดิม

@Component({
  selector: 'app-device-category',
  standalone: true,
  imports: [CommonModule, RouterLink,],
  templateUrl: './device-category.html',
  styleUrl: './device-category.scss',
})
export class DeviceCategoryComponent implements OnDestroy {
  slug!: CategorySlug;
  title = '';
  subtitle = '';
  query = '';
  items: DeviceItem[] = [];
  filtered: DeviceItem[] = [];
  loading = false;
  error = '';

  private sub?: Subscription;

  constructor(private route: ActivatedRoute, private devices: DeviceService) {
    this.sub = this.route.paramMap.subscribe((pm: ParamMap) => {
      const s = (pm.get('category') || '').toLowerCase() as CategorySlug;
      this.initForSlug(s);
    });
  }

  initForSlug(s: CategorySlug) {
    this.slug = s;
    const meta = CATEGORY_META[s] ?? { title: 'Unknown', subtitle: '' };
    this.title = meta.title;
    this.subtitle = meta.subtitle;
    this.loadFromApi(); // เรียก API ครั้งแรกตามหมวด
  }

  onInput(value: string) {
    this.query = value;
    // เลือกได้ 2 แบบ:
    // 1) กรองบน FE (ไม่ยิง API ซ้ำ)
    this.applyFilter(value);
    // 2) ถ้าอยากให้ backend ค้นหาด้วย ให้ uncomment บรรทัดล่าง
    // this.loadFromApi();
  }

  private loadFromApi() {
    this.loading = true;
    this.error = '';
    this.devices.getByCategory(this.slug, this.query).subscribe({
      next: (items) => {
        this.items = items;
        this.applyFilter(this.query);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = 'ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้';
        console.error(e);
      }
    });
  }

  applyFilter(q: string) {
    const norm = (x: string) => (x || '').toLowerCase().trim();
    const needle = norm(q);
    this.filtered = !needle
      ? this.items
      : this.items.filter(it =>
          norm(it.name).includes(needle) || norm(it.serial).includes(needle)
        );
  }

  bySerial = (_: number, it: DeviceItem) => it.serial;

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
