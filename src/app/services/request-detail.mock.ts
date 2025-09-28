import { RequestStatus } from './request-data.mock';

export interface RequestDetail {
  name: string;
  studentId: string;
  date: string;                // YYYY-MM-DD (วันที่ต้องการยืม)
  status: RequestStatus;
  ts: string;                  // ประทับเวลา: YYYY-MM-DD HH:mm
  year: string;                // ชั้นปี
  phone: string;
  groupMembers: string[];
  confirmedRules: boolean;

  // กำหนดการรับอุปกรณ์
  pickupDate: string;          // YYYY-MM-DD
  pickupTime: string;          // เช่น '10:00 น. (หากมาไม่ทัน จะถือว่าสละสิทธิ์)'

  // รายวิชา
  courseName: string;
  otherCourse?: string;
  teacher?: string;

  // รายการอุปกรณ์
  items: Array<{ label: string; value: string }>;

  // หมายเหตุผู้ดูแลระบบ (ไม่บังคับ)
  adminNote?: string;
}

const KEY = (sid: string, date: string) => `${sid}_${date}`;

const DETAIL_STORE: Record<string, RequestDetail> = {
  [KEY('65012345', '2025-08-30')]: {
    name: 'สมชาย ใจดี',
    studentId: '65012345',
    date: '2025-08-30',
    status: 'อนุมัติ',
    ts: '2025-08-24 09:30',
    year: 'ปี 3',
    phone: '081-234-5678',
    groupMembers: ['สมหญิง ยิ้มแย้ม', 'วิชัย กล้าหาญ'],
    confirmedRules: true,
    pickupDate: '2025-08-30',
    pickupTime: '10:00 น. (หากมาไม่ทัน จะถือว่าสละสิทธิ์)',
    courseName: 'การผลิตสื่อดิจิทัล',
    teacher: 'ผศ. ดร. ตัวอย่าง แสนดี',
    items: [
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 1', value: 'Camera: Canon 650D' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 2', value: 'Lens: 18-135 IS' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 3', value: 'Mic Wireless: Dual Set' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 4', value: 'Tripod' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 5', value: '—' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 6', value: '—' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 7', value: '—' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 8', value: '—' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 9', value: '—' },
      { label: 'อุปกรณ์สำหรับงานผลิตสื่อชิ้นที่ 10', value: '—' },
      { label: 'กรณีไม่พบอุปกรณ์ที่ต้องการ', value: '—' },
      { label: 'อุปกรณ์สำหรับงานกิจกรรม', value: '—' },
    ],
  },

  // เพิ่มตัวอย่างอื่นได้ตามต้องการ
};

export function getRequestDetail(studentId: string, date: string): RequestDetail | null {
  return DETAIL_STORE[KEY(studentId, date)] ?? null;
}
