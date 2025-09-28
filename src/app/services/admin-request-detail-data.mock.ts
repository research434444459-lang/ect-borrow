// Mock รายละเอียดคำขอ (Admin)

export type AdminRequestItem = {
    name: string;    // ชื่ออุปกรณ์
    number?: string; // หมายเลขอุปกรณ์
  };
  
  export type AdminAttachment = {
    label: string;
    filename: string;
    url: string;
  };
  
  export type AdminRequestDetail = {
    status: 'อนุมัติ' | 'ไม่อนุมัติ' | 'สละสิทธิ์' | 'อุปกรณ์ไม่พร้อมใช้งาน' | 'คืนของแล้ว' | 'รับของแล้ว';
    timestamp: string;    // 2025-08-24 09:30
    dateBorrow: string;   // YYYY-MM-DD
    time: string;         // HH:mm
    dateReturn?: string;  // YYYY-MM-DD | ''
    fullname: string;
    studentId: string;
    phone?: string;
    groupMembers?: string;
    courseName?: string;
    courseOther?: string;
    teacher?: string;
    items: AdminRequestItem[];     // ยาวได้ถึง 10 ชิ้น
    attachments: AdminAttachment[];
    giver?: string;     // ผู้มอบอุปกรณ์
    receiver?: string;  // ผู้รับอุปกรณ์คืน
  };
  
  // ---- ตัวอย่างข้อมูลจำลอง 2 เรคอร์ด ----
  const MOCK_DETAIL: Record<string, AdminRequestDetail> = {
    // key: `${studentId}__${dateBorrow}`
    '65012345__2025-08-30': {
      status: 'อนุมัติ',
      timestamp: '2025-08-24 09:30',
      dateBorrow: '2025-08-30',
      time: '10:00',
      dateReturn: '',
      fullname: 'สมชาย ใจดี',
      studentId: '65012345',
      phone: '081-234-5678',
      groupMembers: 'สมหญิง ยิ้มแย้ม, วิชัย กล้าหาญ',
      courseName: 'การผลิตสื่อดิจิทัล',
      courseOther: '',
      teacher: 'ผศ. ดร. ตัวอย่าง แสนดี',
      items: [
        { name: 'Camera: Canon 650D' },
        { name: 'Lens: 18-135 IS' },
        { name: 'Mic Wireless: Dual Set' },
        { name: 'Tripod' },
        { name: '' },
        { name: '' },
        { name: '' },
        { name: '' },
        { name: '' },
        { name: '' },
      ],
      attachments: [
        { label: 'แบบฟอร์มขอยืม', filename: 'แบบฟอร์มขอยืม_สมชาย.pdf', url: '#' },
        { label: 'บัตรนักศึกษา', filename: 'student_id_65012345.jpg', url: '#' },
      ],
      giver: 'อ.เกรียงไกร',
      receiver: '',
    },
    '65054321__2025-09-07': {
      status: 'รับของแล้ว',
      timestamp: '2025-09-02 14:20',
      dateBorrow: '2025-09-07',
      time: '11:30',
      dateReturn: '',
      fullname: 'สมหญิง ยิ้มแย้ม',
      studentId: '65054321',
      phone: '081-111-2222',
      groupMembers: 'วิชัย กล้าหาญ',
      courseName: 'การผลิตสื่อดิจิทัล',
      teacher: 'ผศ. ดร. ตัวอย่าง แสนดี',
      items: [
        { name: 'Camera: Canon 650D' },
        { name: 'Lens: 18-135 IS' },
        { name: 'Mic Wireless: Dual Set' },
        { name: 'Tripod' },
        { name: '' },{ name: '' },{ name: '' },{ name: '' },{ name: '' },{ name: '' },
      ],
      attachments: [
        { label: 'แบบฟอร์มขอยืม', filename: 'แบบฟอร์มขอยืม_สมหญิง.pdf', url: '#' },
        { label: 'บัตรนักศึกษา', filename: 'student_id_65054321.jpg', url: '#' },
      ],
      giver: 'อ.เกรียงไกร',
      receiver: '',
    },
  };
  
  export function getAdminRequestDetail(studentId: string, dateBorrow: string): AdminRequestDetail {
    const key = `${studentId}__${dateBorrow}`;
    const found = MOCK_DETAIL[key];
    if (found) return structuredClone(found);
  
    // fallback mock หากหาไม่เจอ
    return {
      status: 'อนุมัติ',
      timestamp: '2025-09-01 09:00',
      dateBorrow,
      time: '10:00',
      dateReturn: '',
      fullname: `นักศึกษารหัส ${studentId}`,
      studentId,
      phone: '-',
      groupMembers: '-',
      courseName: 'การผลิตสื่อดิจิทัล',
      teacher: 'อาจารย์ผู้สอน',
      items: Array.from({ length: 10 }, (_, i) => ({ name: i < 2 ? `อุปกรณ์ชิ้นที่ ${i + 1}` : '' })),
      attachments: [],
      giver: '',
      receiver: '',
    };
  }
  
  // เดโม่บันทึก (ภายหลังจะเปลี่ยนเป็นเรียก API)
  export type SavePayload = {
    status: AdminRequestDetail['status'];
    giver?: string;
    receiver?: string;
    items: { name: string; number?: string }[];
  };
  export async function saveAdminRequestDetailMock(payload: SavePayload): Promise<void> {
    // จำลอง latency เล็กน้อย
    await new Promise(res => setTimeout(res, 250));
    console.log('[Mock Save] AdminRequestDetail:', payload);
  }
  