import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [RouterLink,],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class DevicesComponent {}
