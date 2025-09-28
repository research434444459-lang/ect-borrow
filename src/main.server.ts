import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core'; // ✅ ถูกต้อง
import { AppComponent } from './app/app';         // ← ให้ตรงกับไฟล์จริง
import { appConfig } from './app/app.config';               // จาก app.config.ts  (browser)
import { appConfigServer } from './app/app.config.server';  // จากข้อ 2 (server)

const config = mergeApplicationConfig(appConfig, appConfigServer);

export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
