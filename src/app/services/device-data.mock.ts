export type CategorySlug =
  | 'camera'
  | 'camera-lens'
  | 'mic-wireless'
  | 'studio-lighting'
  | 'tripod-gimbals'
  | 'drone'
  | 'other';

export interface DeviceItem {
  name: string;
  serial: string;
  available: number;
  imageUrl: string;
}

export const CATEGORY_META: Record<CategorySlug, { title: string; subtitle: string }> = {
  'camera':          { title: 'Camera',            subtitle: 'ค้นหาและเลือกกล้องที่ต้องการยืม' },
  'camera-lens':     { title: 'Camera Lens',       subtitle: 'เลนส์และอุปกรณ์เสริม' },
  'mic-wireless':    { title: 'Microphone Wireless', subtitle: 'ไมค์ไร้สายและชุดรับส่ง' },
  'studio-lighting': { title: 'Studio Lighting',   subtitle: 'ไฟสตูดิโอและอุปกรณ์แสง' },
  'tripod-gimbals':  { title: 'Tripod & Gimbals',  subtitle: 'ขาตั้งกล้องและกิมบอล' },
  'drone':           { title: 'Drone',             subtitle: 'โดรนและอุปกรณ์เสริม' },
  'other':           { title: 'Other equipment',   subtitle: 'อุปกรณ์อื่น ๆ' },
};

export const DEVICE_DATA: Record<CategorySlug, DeviceItem[]> = {
  'camera': [
    { name: 'Canon 650D + Lens 16-55MM', serial: 'C011', available: 5, imageUrl: 'https://via.placeholder.com/300x220.png?text=Canon+650D' },
    { name: 'Canon 80D + Lens 18-135 IS', serial: 'C012', available: 3, imageUrl: 'https://via.placeholder.com/300x220.png?text=Canon+80D' },
    { name: 'Sony A6400 + Kit 16-50',     serial: 'C021', available: 2, imageUrl: 'https://via.placeholder.com/300x220.png?text=Sony+A6400' },
    { name: 'Nikon D5600 + Lens 18-55',   serial: 'C031', available: 4, imageUrl: 'https://via.placeholder.com/300x220.png?text=Nikon+D5600' },
  ],
  'camera-lens': [
    { name: 'Canon EF 50mm f/1.8',   serial: 'L101', available: 7, imageUrl: 'https://via.placeholder.com/300x220.png?text=EF+50mm' },
    { name: 'Sony FE 24-70mm f/2.8', serial: 'L102', available: 2, imageUrl: 'https://via.placeholder.com/300x220.png?text=FE+24-70' },
  ],
  'mic-wireless': [
    { name: 'Rode Wireless GO II', serial: 'M201', available: 5, imageUrl: 'https://via.placeholder.com/300x220.png?text=Rode+Wireless+GO+II' },
    { name: 'BOYA BY-WM4 Pro',     serial: 'M202', available: 8, imageUrl: 'https://via.placeholder.com/300x220.png?text=BOYA+WM4+Pro' },
  ],
  'studio-lighting': [
    { name: 'Godox SL60W', serial: 'SL301', available: 4, imageUrl: 'https://via.placeholder.com/300x220.png?text=Godox+SL60W' },
  ],
  'tripod-gimbals': [
    { name: 'Manfrotto Compact', serial: 'T401', available: 6, imageUrl: 'https://via.placeholder.com/300x220.png?text=Manfrotto' },
    { name: 'DJI RS 3',          serial: 'G402', available: 1, imageUrl: 'https://via.placeholder.com/300x220.png?text=DJI+RS+3' },
  ],
  'drone': [
    { name: 'DJI Mini 3', serial: 'D501', available: 2, imageUrl: 'https://via.placeholder.com/300x220.png?text=DJI+Mini+3' },
  ],
  'other': [
    { name: 'SD Card 64GB', serial: 'O601', available: 24, imageUrl: 'https://via.placeholder.com/300x220.png?text=SD+64GB' },
  ],
};
