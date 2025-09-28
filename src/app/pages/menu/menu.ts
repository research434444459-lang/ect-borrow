import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink], // ⬅️ เพิ่ม RouterLinkActive
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss'],
})
export class MenuComponent {}
