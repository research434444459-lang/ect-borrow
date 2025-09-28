// Mock data สำหรับหน้า "รายการวันนี้ (Admin)"

export type TodayRow = {
    name: string;
    id: string;
    dateBorrow: string;   // YYYY-MM-DD
    time: string;         // HH:mm
    dateReturn?: string;  // YYYY-MM-DD | ''
    giver?: string;
    receiver?: string;
    note?: string;
  };
  
  export function todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  
  const TODAY = todayIso();
  
  // === Mock รายการเข้ารับอุปกรณ์ของวันนี้ ===
  export const BORROW_TODAY_MOCK: TodayRow[] = [
    { name: 'สมชาย ใจดี',     id: '65012345', dateBorrow: TODAY, time: '10:00', dateReturn: '', giver: 'อ.เกรียงไกร', receiver: '' },
    { name: 'สมหญิง ยิ้มแย้ม', id: '65054321', dateBorrow: TODAY, time: '11:30', dateReturn: '', giver: 'อ.เกรียงไกร', receiver: '' },
    { name: 'วิชัย กล้าหาญ',   id: '65099999', dateBorrow: TODAY, time: '13:00', dateReturn: '', giver: 'คุณศิริพร', receiver: '' },
  ];
  
  // === Mock รายการที่กำหนดคืนของวันนี้ ===
  export const RETURN_TODAY_MOCK: TodayRow[] = [
    { name: 'รัตน์ธิดา มั่งมี', id: '66011122', dateBorrow: '2025-09-01', time: '09:20', dateReturn: TODAY, giver: '', receiver: 'คุณศิริพร' },
    { name: 'อัครเดช ตั้งใจ',  id: '64022233', dateBorrow: '2025-09-02', time: '10:10', dateReturn: TODAY, giver: '', receiver: 'อ.เกรียงไกร' },
  ];
  
  // ฟังก์ชันดึงข้อมูล (เตรียมพร้อมเปลี่ยนเป็นเรียก API ในอนาคต)
  export function getBorrowToday(dateISO: string = TODAY): TodayRow[] {
    return BORROW_TODAY_MOCK.filter(r => r.dateBorrow === dateISO);
  }
  export function getReturnToday(dateISO: string = TODAY): TodayRow[] {
    return RETURN_TODAY_MOCK.filter(r => r.dateReturn === dateISO);
  }
  