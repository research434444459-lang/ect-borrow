import { ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient } from '@angular/common/http'; // ✅ เพิ่ม

export const appConfigServer: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideHttpClient(), // ✅ เพิ่ม
  ],
};
