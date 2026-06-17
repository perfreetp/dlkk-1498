import type { CaseInfo, QueueItem, DailyStats, ExceptionReasonStat, DepartmentStats, SupplementTemplate, ScenarioItem, MaterialItem, SelectedItem, FlowRecord } from '@/types';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const mockCases: CaseInfo[] = [
  {
    id: '1',
    caseNo: 'CS202606170001',
    type: 'newborn',
    status: 'processing',
    queueNo: 'A001',
    applicant: {
      name: '张伟',
      idCard: '310101199001011234',
      phone: '13800138001',
      relation: '父亲',
    },
    babyInfo: {
      name: '张小明',
      gender: 'male',
      birthDate: '2026-06-10',
      birthCertificateNo: 'O123456789',
      birthPlace: '上海市第一妇婴保健院',
    },
    parents: {
      father: {
        name: '张伟',
        idCard: '310101199001011234',
        idCardVerified: true,
        phone: '13800138001',
      },
      mother: {
        name: '李娜',
        idCard: '310102199203045678',
        idCardVerified: true,
        phone: '13900139002',
      },
      consistencyCheck: 'passed',
    },
    materials: [
      { id: 'm1', name: '出生医学证明', required: true, provided: true, category: '基础材料' },
      { id: 'm2', name: '父母双方身份证', required: true, provided: true, category: '基础材料' },
      { id: 'm3', name: '父母双方户口簿', required: true, provided: true, category: '基础材料' },
      { id: 'm4', name: '结婚证', required: true, provided: true, category: '基础材料' },
      { id: 'm5', name: '生育服务证', required: false, provided: false, category: '补充材料' },
    ],
    selectedItems: [
      { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: true, scenario: '新生儿报户口', handlingTime: 3 },
      { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: true, scenario: '新生儿参保', handlingTime: 15 },
      { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: true, scenario: '新生儿参保', handlingTime: 5 },
      { id: 's4', name: '预防接种证办理', department: '卫健委', type: '卫健', selected: true, scenario: '基础免疫', handlingTime: 1 },
    ],
    supplements: [],
    exceptions: [],
    flowRecords: [
      { id: 'f1', status: 'pending', operator: '叫号系统', department: '政务中心', action: '叫号', timestamp: '2026-06-17 09:00:00' },
      { id: 'f2', status: 'verifying', operator: '王芳', department: '综合窗口', action: '信息核验', timestamp: '2026-06-17 09:05:00' },
      { id: 'f3', status: 'arranging', operator: '王芳', department: '综合窗口', action: '联办编排', timestamp: '2026-06-17 09:08:00' },
      { id: 'f4', status: 'processing', operator: '王芳', department: '综合窗口', action: '受理提交', timestamp: '2026-06-17 09:10:00' },
    ],
    results: {
      paper: { type: 'paper', registered: false },
      electronic: { type: 'electronic', registered: false },
    },
    createdAt: '2026-06-17 09:00:00',
    updatedAt: '2026-06-17 09:10:00',
    deadline: '2026-06-24',
    windowNo: '01',
    handler: '王芳',
  },
  {
    id: '2',
    caseNo: 'CS202606170002',
    type: 'parents',
    status: 'supplement',
    queueNo: 'A002',
    applicant: {
      name: '陈静',
      idCard: '310103199105058765',
      phone: '13700137003',
      relation: '母亲',
    },
    babyInfo: {
      name: '王小雨',
      gender: 'female',
      birthDate: '2026-06-08',
      birthCertificateNo: 'O123456790',
      birthPlace: '上海市国际和平妇幼保健院',
    },
    parents: {
      father: {
        name: '王强',
        idCard: '310104198812123456',
        idCardVerified: true,
        phone: '13600136004',
      },
      mother: {
        name: '陈静',
        idCard: '310103199105058765',
        idCardVerified: true,
        phone: '13700137003',
      },
      consistencyCheck: 'passed',
    },
    materials: [
      { id: 'm1', name: '出生医学证明', required: true, provided: true, category: '基础材料' },
      { id: 'm2', name: '父母双方身份证', required: true, provided: true, category: '基础材料' },
      { id: 'm3', name: '父母双方户口簿', required: true, provided: false, category: '基础材料', remark: '缺父亲户口簿' },
      { id: 'm4', name: '结婚证', required: true, provided: true, category: '基础材料' },
      { id: 'm6', name: '房产证', required: false, provided: false, category: '补充材料', remark: '落户需要' },
    ],
    selectedItems: [
      { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: true, scenario: '新生儿报户口', handlingTime: 3 },
      { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: true, scenario: '新生儿参保', handlingTime: 15 },
      { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: true, scenario: '新生儿参保', handlingTime: 5 },
    ],
    supplements: [
      {
        id: 'sup1',
        materialName: '父母双方户口簿（父亲户口簿缺失）',
        reason: '办理出生登记需提供父亲户口簿原件',
        templateId: 'tpl1',
        deadline: '2026-06-24',
        status: 'pending',
      },
    ],
    exceptions: [],
    flowRecords: [
      { id: 'f1', status: 'pending', operator: '叫号系统', department: '政务中心', action: '叫号', timestamp: '2026-06-17 09:15:00' },
      { id: 'f2', status: 'verifying', operator: '李明', department: '综合窗口', action: '信息核验', timestamp: '2026-06-17 09:20:00' },
      { id: 'f3', status: 'supplement', operator: '李明', department: '综合窗口', action: '材料补正通知', remark: '缺父亲户口簿', timestamp: '2026-06-17 09:25:00' },
    ],
    results: {
      paper: { type: 'paper', registered: false },
      electronic: { type: 'electronic', registered: false },
    },
    createdAt: '2026-06-17 09:15:00',
    updatedAt: '2026-06-17 09:25:00',
    deadline: '2026-06-24',
    windowNo: '02',
    handler: '李明',
  },
  {
    id: '3',
    caseNo: 'CS202606170003',
    type: 'newborn',
    status: 'exception',
    queueNo: 'A003',
    applicant: {
      name: '刘芳',
      idCard: '310105199303037654',
      phone: '13500135005',
      relation: '母亲',
    },
    babyInfo: {
      name: '赵小宝',
      gender: 'male',
      birthDate: '2026-06-05',
      birthCertificateNo: 'O123456791',
      birthPlace: '上海市长宁区妇幼保健院',
    },
    parents: {
      father: {
        name: '赵刚',
        idCard: '310106199002026543',
        idCardVerified: false,
        phone: '13400134006',
      },
      mother: {
        name: '刘芳',
        idCard: '310105199303037654',
        idCardVerified: true,
        phone: '13500135005',
      },
      consistencyCheck: 'pending',
    },
    materials: [
      { id: 'm1', name: '出生医学证明', required: true, provided: true, category: '基础材料' },
      { id: 'm2', name: '父母双方身份证', required: true, provided: false, category: '基础材料', remark: '父亲身份证无法读取' },
      { id: 'm3', name: '父母双方户口簿', required: true, provided: true, category: '基础材料' },
      { id: 'm4', name: '结婚证', required: true, provided: true, category: '基础材料' },
    ],
    selectedItems: [
      { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: true, scenario: '新生儿报户口', handlingTime: 3 },
      { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: true, scenario: '新生儿参保', handlingTime: 15 },
      { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: true, scenario: '新生儿参保', handlingTime: 5 },
      { id: 's4', name: '预防接种证办理', department: '卫健委', type: '卫健', selected: true, scenario: '基础免疫', handlingTime: 1 },
    ],
    supplements: [],
    exceptions: [
      {
        id: 'ex1',
        type: '身份证件异常',
        reason: '父亲身份证芯片损坏，无法读取电子信息，需人工核验',
        submitter: '王芳',
        status: 'pending',
        createdAt: '2026-06-17 10:00:00',
      },
    ],
    flowRecords: [
      { id: 'f1', status: 'pending', operator: '叫号系统', department: '政务中心', action: '叫号', timestamp: '2026-06-17 09:30:00' },
      { id: 'f2', status: 'verifying', operator: '王芳', department: '综合窗口', action: '信息核验', timestamp: '2026-06-17 09:35:00' },
      { id: 'f3', status: 'exception', operator: '王芳', department: '综合窗口', action: '提交异常复核', remark: '父亲身份证无法读取', timestamp: '2026-06-17 10:00:00' },
    ],
    results: {
      paper: { type: 'paper', registered: false },
      electronic: { type: 'electronic', registered: false },
    },
    createdAt: '2026-06-17 09:30:00',
    updatedAt: '2026-06-17 10:00:00',
    deadline: '2026-06-24',
    windowNo: '01',
    handler: '王芳',
  },
  {
    id: '4',
    caseNo: 'CS202606160008',
    type: 'newborn',
    status: 'completed',
    queueNo: 'A108',
    applicant: {
      name: '黄磊',
      idCard: '310107198707075432',
      phone: '13300133007',
      relation: '父亲',
    },
    babyInfo: {
      name: '黄思琪',
      gender: 'female',
      birthDate: '2026-06-01',
      birthCertificateNo: 'O123456780',
      birthPlace: '上海市第六人民医院',
    },
    parents: {
      father: {
        name: '黄磊',
        idCard: '310107198707075432',
        idCardVerified: true,
        phone: '13300133007',
      },
      mother: {
        name: '周婷',
        idCard: '310108198909094321',
        idCardVerified: true,
        phone: '13200132008',
      },
      consistencyCheck: 'passed',
    },
    materials: [
      { id: 'm1', name: '出生医学证明', required: true, provided: true, category: '基础材料' },
      { id: 'm2', name: '父母双方身份证', required: true, provided: true, category: '基础材料' },
      { id: 'm3', name: '父母双方户口簿', required: true, provided: true, category: '基础材料' },
      { id: 'm4', name: '结婚证', required: true, provided: true, category: '基础材料' },
    ],
    selectedItems: [
      { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: true, scenario: '新生儿报户口', handlingTime: 3 },
      { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: true, scenario: '新生儿参保', handlingTime: 15 },
      { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: true, scenario: '新生儿参保', handlingTime: 5 },
      { id: 's4', name: '预防接种证办理', department: '卫健委', type: '卫健', selected: true, scenario: '基础免疫', handlingTime: 1 },
    ],
    supplements: [],
    exceptions: [],
    flowRecords: [
      { id: 'f1', status: 'pending', operator: '叫号系统', department: '政务中心', action: '叫号', timestamp: '2026-06-16 09:00:00' },
      { id: 'f2', status: 'verifying', operator: '李明', department: '综合窗口', action: '信息核验', timestamp: '2026-06-16 09:05:00' },
      { id: 'f3', status: 'arranging', operator: '李明', department: '综合窗口', action: '联办编排', timestamp: '2026-06-16 09:08:00' },
      { id: 'f4', status: 'processing', operator: '李明', department: '综合窗口', action: '受理提交', timestamp: '2026-06-16 09:10:00' },
      { id: 'f5', status: 'completed', operator: '系统', department: '各部门', action: '全部事项办结', timestamp: '2026-06-17 14:30:00' },
    ],
    results: {
      paper: { type: 'paper', registered: true, registeredBy: '王芳', registeredAt: '2026-06-17 15:00:00', documentNo: 'HZ202606170001' },
      electronic: { type: 'electronic', registered: true, registeredBy: '系统', registeredAt: '2026-06-17 14:30:00', documentNo: 'DZ202606170001' },
    },
    createdAt: '2026-06-16 09:00:00',
    updatedAt: '2026-06-17 15:00:00',
    deadline: '2026-06-23',
    windowNo: '02',
    handler: '李明',
  },
  {
    id: '5',
    caseNo: 'CS202606160015',
    type: 'other',
    status: 'archived',
    queueNo: 'B015',
    applicant: {
      name: '孙国华',
      idCard: '310109196001013210',
      phone: '13100131009',
      relation: '祖父',
    },
    babyInfo: {
      name: '孙梓轩',
      gender: 'male',
      birthDate: '2026-05-28',
      birthCertificateNo: 'O123456770',
      birthPlace: '上海市第一人民医院',
    },
    parents: {
      father: {
        name: '孙伟',
        idCard: '310109198808086543',
        idCardVerified: true,
        phone: '13000130010',
      },
      mother: {
        name: '林小美',
        idCard: '350102199002027654',
        idCardVerified: true,
        phone: '13000130011',
      },
      consistencyCheck: 'passed',
    },
    materials: [
      { id: 'm1', name: '出生医学证明', required: true, provided: true, category: '基础材料' },
      { id: 'm2', name: '父母双方身份证', required: true, provided: true, category: '基础材料' },
      { id: 'm3', name: '父母双方户口簿', required: true, provided: true, category: '基础材料' },
      { id: 'm4', name: '结婚证', required: true, provided: true, category: '基础材料' },
      { id: 'm7', name: '代办人身份证', required: true, provided: true, category: '代办材料' },
      { id: 'm8', name: '委托书', required: true, provided: true, category: '代办材料' },
    ],
    selectedItems: [
      { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: true, scenario: '新生儿报户口', handlingTime: 3 },
      { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: true, scenario: '新生儿参保', handlingTime: 15 },
      { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: true, scenario: '新生儿参保', handlingTime: 5 },
    ],
    supplements: [],
    exceptions: [],
    flowRecords: [
      { id: 'f1', status: 'pending', operator: '叫号系统', department: '政务中心', action: '叫号', timestamp: '2026-06-16 10:00:00' },
      { id: 'f2', status: 'verifying', operator: '王芳', department: '综合窗口', action: '信息核验', timestamp: '2026-06-16 10:05:00' },
      { id: 'f3', status: 'arranging', operator: '王芳', department: '综合窗口', action: '联办编排', timestamp: '2026-06-16 10:10:00' },
      { id: 'f4', status: 'processing', operator: '王芳', department: '综合窗口', action: '受理提交', timestamp: '2026-06-16 10:15:00' },
      { id: 'f5', status: 'completed', operator: '系统', department: '各部门', action: '全部事项办结', timestamp: '2026-06-17 10:00:00' },
      { id: 'f6', status: 'archived', operator: '李明', department: '档案科', action: '归档完成', timestamp: '2026-06-17 11:00:00' },
    ],
    results: {
      paper: { type: 'paper', registered: true, registeredBy: '李明', registeredAt: '2026-06-17 10:30:00', documentNo: 'HZ202606170002' },
      electronic: { type: 'electronic', registered: true, registeredBy: '系统', registeredAt: '2026-06-17 10:00:00', documentNo: 'DZ202606170002' },
    },
    createdAt: '2026-06-16 10:00:00',
    updatedAt: '2026-06-17 11:00:00',
    deadline: '2026-06-23',
    windowNo: '01',
    handler: '王芳',
  },
];

export const mockQueue: QueueItem[] = [
  { id: 'q1', queueNo: 'A004', name: '吴敏', type: 'newborn', status: 'waiting', estimatedTime: 15 },
  { id: 'q2', queueNo: 'A005', name: '郑浩', type: 'parents', status: 'waiting', estimatedTime: 12 },
  { id: 'q3', queueNo: 'A006', name: '冯丽', type: 'newborn', status: 'waiting', estimatedTime: 8 },
  { id: 'q4', queueNo: 'A007', name: '许文', type: 'other', status: 'waiting', estimatedTime: 20 },
  { id: 'q5', queueNo: 'A008', name: '何静', type: 'newborn', status: 'waiting', estimatedTime: 10 },
  { id: 'q6', queueNo: 'A009', name: '罗军', type: 'parents', status: 'waiting', estimatedTime: 5 },
];

export const mockDailyStats: DailyStats[] = [
  { date: '06-11', total: 18, completed: 15, supplement: 2, exception: 1 },
  { date: '06-12', total: 22, completed: 19, supplement: 2, exception: 1 },
  { date: '06-13', total: 25, completed: 21, supplement: 3, exception: 1 },
  { date: '06-14', total: 20, completed: 18, supplement: 1, exception: 1 },
  { date: '06-15', total: 28, completed: 24, supplement: 3, exception: 1 },
  { date: '06-16', total: 32, completed: 28, supplement: 3, exception: 1 },
  { date: '06-17', total: 15, completed: 8, supplement: 4, exception: 3 },
];

export const mockExceptionReasons: ExceptionReasonStat[] = [
  { reason: '材料缺失', count: 12, percentage: 35.3 },
  { reason: '身份证件异常', count: 8, percentage: 23.5 },
  { reason: '信息不一致', count: 6, percentage: 17.6 },
  { reason: '特殊情形需复核', count: 5, percentage: 14.7 },
  { reason: '政策不明确', count: 3, percentage: 8.8 },
];

export const mockDepartmentStats: DepartmentStats[] = [
  { department: '公安局', total: 120, completed: 110, avgTime: 2.5 },
  { department: '人社局', total: 115, completed: 105, avgTime: 12 },
  { department: '医保局', total: 118, completed: 112, avgTime: 4 },
  { department: '卫健委', total: 110, completed: 108, avgTime: 0.8 },
];

export const mockSupplementTemplates: SupplementTemplate[] = [
  {
    id: 'tpl1',
    category: '身份证明类',
    title: '户口簿缺失补正通知',
    content: '您申请办理的出生一件事联办事项中，缺少【户口簿】原件及复印件。请您在收到本通知之日起5个工作日内，携带以下材料至原受理窗口补正：\n\n1. 父母双方户口簿原件及首页、本人页复印件\n2. 如无法提供原件，可提供户籍所在地派出所出具的户籍证明\n\n如有疑问，请拨打咨询电话：12345',
  },
  {
    id: 'tpl2',
    category: '身份证明类',
    title: '身份证无法读取补正通知',
    content: '您申请办理的出生一件事联办事项中，【居民身份证】芯片损坏无法读取电子信息。请您在收到本通知之日起3个工作日内，携带以下材料至原受理窗口办理：\n\n1. 本人有效身份证件原件\n2. 如身份证损坏，请先至公安部门换领新证\n\n如有疑问，请拨打咨询电话：12345',
  },
  {
    id: 'tpl3',
    category: '婚姻证明类',
    title: '结婚证缺失补正通知',
    content: '您申请办理的出生一件事联办事项中，缺少【结婚证】原件及复印件。请您在收到本通知之日起5个工作日内，携带以下材料至原受理窗口补正：\n\n1. 父母双方结婚证原件及复印件\n2. 如结婚证遗失，可提供婚姻登记机关出具的婚姻登记证明\n\n如有疑问，请拨打咨询电话：12345',
  },
  {
    id: 'tpl4',
    category: '出生证明类',
    title: '出生医学证明补正通知',
    content: '您申请办理的出生一件事联办事项中，【出生医学证明】存在以下问题需补正：\n\n1. 出生医学证明信息填写不完整，请补充完善\n2. 出生医学证明复印件不清晰，请重新提供\n\n请在收到本通知之日起5个工作日内，携带补正材料至原受理窗口。\n\n如有疑问，请拨打咨询电话：12345',
  },
  {
    id: 'tpl5',
    category: '委托代办类',
    title: '代办材料补正通知',
    content: '您申请办理的出生一件事联办事项中，代办材料不齐全。请您在收到本通知之日起5个工作日内，携带以下材料至原受理窗口补正：\n\n1. 代办人居民身份证原件及复印件\n2. 新生儿父母签字的授权委托书原件\n3. 委托人与代办人亲属关系证明（如适用）\n\n如有疑问，请拨打咨询电话：12345',
  },
];

export const mockScenarios: ScenarioItem[] = [
  {
    id: 'sc1',
    name: '标准套餐（推荐）',
    description: '包含出生登记、社保卡、医保参保、预防接种证四项',
    itemIds: ['s1', 's2', 's3', 's4'],
  },
  {
    id: 'sc2',
    name: '基础套餐',
    description: '包含出生登记、社保卡、医保参保三项',
    itemIds: ['s1', 's2', 's3'],
  },
  {
    id: 'sc3',
    name: '仅户口登记',
    description: '仅办理出生登记（报户口）',
    itemIds: ['s1'],
  },
  {
    id: 'sc4',
    name: '医保社保套餐',
    description: '包含社保卡申领和医保参保登记',
    itemIds: ['s2', 's3'],
  },
];

export const mockMaterials: MaterialItem[] = [
  { id: 'm1', name: '出生医学证明', required: true, provided: false, category: '基础材料' },
  { id: 'm2', name: '父母双方身份证', required: true, provided: false, category: '基础材料' },
  { id: 'm3', name: '父母双方户口簿', required: true, provided: false, category: '基础材料' },
  { id: 'm4', name: '结婚证', required: true, provided: false, category: '基础材料' },
  { id: 'm5', name: '生育服务证', required: false, provided: false, category: '补充材料' },
  { id: 'm6', name: '房产证/居住证明', required: false, provided: false, category: '补充材料' },
  { id: 'm7', name: '代办人身份证', required: false, provided: false, category: '代办材料' },
  { id: 'm8', name: '授权委托书', required: false, provided: false, category: '代办材料' },
];

export const mockAvailableItems: SelectedItem[] = [
  { id: 's1', name: '出生登记（报户口）', department: '公安局', type: '户籍', selected: false, scenario: '新生儿报户口', handlingTime: 3, fee: 0 },
  { id: 's2', name: '社保卡申领', department: '人社局', type: '社保', selected: false, scenario: '新生儿参保', handlingTime: 15, fee: 0 },
  { id: 's3', name: '城乡居民基本医疗保险参保登记', department: '医保局', type: '医保', selected: false, scenario: '新生儿参保', handlingTime: 5, fee: 0 },
  { id: 's4', name: '预防接种证办理', department: '卫健委', type: '卫健', selected: false, scenario: '基础免疫', handlingTime: 1, fee: 0 },
  { id: 's5', name: '生育保险待遇申领', department: '医保局', type: '医保', selected: false, scenario: '生育保险', handlingTime: 10, fee: 0 },
  { id: 's6', name: '出生医学证明首次签发', department: '卫健委', type: '卫健', selected: false, scenario: '证件办理', handlingTime: 2, fee: 0 },
];

export const mockUser = {
  id: 'u001',
  name: '王芳',
  role: 'reception' as const,
  department: '政务服务中心',
  windowNo: '01',
};
