export interface ForecastBaseItem {
    name: string;
    serial: string;
    imageUrl: string;
    baseRemaining: number;
  }
  
  export interface ForecastItem {
    name: string;
    serial: string;
    imageUrl: string;
    remaining: number;
  }
  
  /** ตัวอย่างฐานข้อมูลคร่าว ๆ (จะเปลี่ยนเป็นเรียก API ภายหลัง) */
  const BASE_ITEMS: ForecastBaseItem[] = [
    { name: 'Canon 650D + Lens 16-55MM', serial: 'C011', imageUrl: 'https://via.placeholder.com/300x220.png?text=Canon+650D', baseRemaining: 5 },
    { name: 'Canon 80D + Lens 18-135 IS', serial: 'C012', imageUrl: 'https://via.placeholder.com/300x220.png?text=Canon+80D', baseRemaining: 3 },
    { name: 'Sony A6400 + Kit 16-50',     serial: 'C021', imageUrl: 'https://via.placeholder.com/300x220.png?text=Sony+A6400', baseRemaining: 2 },
  ];
  
  /** สร้างผลคาดการณ์จากวันที่ (สูตรจำลองง่าย ๆ) */
  export function forecastForDate(dateISO?: string): ForecastItem[] {
    const date = dateISO ? new Date(dateISO) : new Date();
    const tweak = (date.getDate() % 3); // 0..2
    return BASE_ITEMS.map(it => ({
      name: it.name,
      serial: it.serial,
      imageUrl: it.imageUrl,
      remaining: Math.max(0, it.baseRemaining - tweak),
    }));
  }
  