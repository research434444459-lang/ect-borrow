// Mock data สำหรับหน้า "จัดการคำขออุปกรณ์ (Admin)"
export type AdminRequestStatus =
  | 'อนุมัติ'
  | 'ไม่อนุมัติ'
  | 'สละสิทธิ์'
  | 'อุปกรณ์ไม่พร้อมใช้งาน'
  | 'คืนของแล้ว'
  | 'รับของแล้ว';

export type AdminRequestRow = {
  name: string;
  id: string;           // student id
  dateBorrow: string;   // YYYY-MM-DD
  time: string;         // HH:mm
  dateReturn?: string;  // YYYY-MM-DD | ''
  giver?: string;
  receiver?: string;
  status: AdminRequestStatus; // ⬅️ เพิ่ม
};

export const ADMIN_REQUESTS_MOCK: AdminRequestRow[] = [
  { name: 'สมชาย ใจดี',     id: '65012345', dateBorrow: '2025-09-07', time: '10:00', dateReturn: '',            giver: 'อ.เกรียงไกร', receiver: '',            status: 'อนุมัติ' },
  { name: 'สมหญิง ยิ้มแย้ม', id: '65054321', dateBorrow: '2025-09-07', time: '11:30', dateReturn: '',            giver: 'อ.เกรียงไกร', receiver: '',            status: 'รับของแล้ว' },
  { name: 'วิชัย กล้าหาญ',   id: '65099999', dateBorrow: '2025-09-07', time: '13:00', dateReturn: '',            giver: 'คุณศิริพร',  receiver: '',            status: 'อุปกรณ์ไม่พร้อมใช้งาน' },
  { name: 'รัตน์ธิดา มั่งมี', id: '66011122', dateBorrow: '2025-09-01', time: '09:20', dateReturn: '2025-09-07', giver: '',            receiver: 'คุณศิริพร',  status: 'คืนของแล้ว' },
  { name: 'อัครเดช ตั้งใจ',  id: '64022233', dateBorrow: '2025-09-02', time: '10:10', dateReturn: '2025-09-07', giver: '',            receiver: 'อ.เกรียงไกร', status: 'ไม่อนุมัติ' },
  { name: 'กชกร สง่า',        id: '67044556', dateBorrow: '2025-08-30', time: '14:00', dateReturn: '2025-09-03', giver: 'คุณศิริพร',  receiver: 'คุณศิริพร',  status: 'สละสิทธิ์' },
];

const norm = (s: string) => (s || '').toLowerCase().trim();

export function filterAdminRequests(opts: { q?: string; student?: string; date?: string; status?: AdminRequestStatus | '' }) {
  const qv = norm(opts.q || opts.student || '');
  const dv = (opts.date || '').trim();
  const sv = (opts.status || '').trim() as AdminRequestStatus | '';

  return ADMIN_REQUESTS_MOCK.filter(r => {
    const matchText = !qv || norm(r.name).includes(qv) || norm(r.id).includes(qv);
    const matchDate = !dv || r.dateBorrow === dv || (r.dateReturn || '') === dv;
    const matchStatus = !sv || r.status === sv; // เทียบตรงตัวตาม label ภาษาไทย
    return matchText && matchDate && matchStatus;
  });
}
