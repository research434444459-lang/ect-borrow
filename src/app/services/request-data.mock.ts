export type RequestStatus = 'อนุมัติ' | 'รออนุมัติ' | 'ไม่อนุมัติ';

export interface RequestRecord {
  name: string;       // ชื่อ-นามสกุล
  studentId: string;  // รหัสนักศึกษา
  date: string;       // YYYY-MM-DD
  status: RequestStatus;
}

export const REQUESTS: RequestRecord[] = [
  { name: 'สมชาย ใจดี',     studentId: '65012345', date: '2025-08-30', status: 'อนุมัติ' },
  { name: 'สมหญิง ยิ้มแย้ม', studentId: '65054321', date: '2025-08-31', status: 'รออนุมัติ' },
  { name: 'วิชัย กล้าหาญ',   studentId: '65099999', date: '2025-09-01', status: 'ไม่อนุมัติ' },
  { name: 'รัตน์ธิดา มั่งมี', studentId: '66011122', date: '2025-09-01', status: 'อนุมัติ' },
];
