export type CaseType = 'newborn' | 'parents' | 'other';
export type CaseStatus = 'pending' | 'verifying' | 'arranging' | 'supplement' | 'exception' | 'processing' | 'completed' | 'archived';
export type ConsistencyCheckResult = 'passed' | 'failed' | 'pending';
export type SupplementStatus = 'pending' | 'replied' | 'passed';
export type ExceptionStatus = 'pending' | 'approved' | 'rejected';
export type ResultType = 'paper' | 'electronic';

export interface ApplicantInfo {
  name: string;
  idCard: string;
  phone: string;
  relation: string;
}

export interface BabyInfo {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthCertificateNo: string;
  birthPlace: string;
}

export interface ParentInfo {
  name: string;
  idCard: string;
  idCardVerified: boolean;
  phone?: string;
}

export interface ParentsInfo {
  father: ParentInfo;
  mother: ParentInfo;
  consistencyCheck: ConsistencyCheckResult;
}

export interface MaterialItem {
  id: string;
  name: string;
  required: boolean;
  provided: boolean;
  category: string;
  remark?: string;
}

export interface SelectedItem {
  id: string;
  name: string;
  department: string;
  type: string;
  selected: boolean;
  scenario: string;
  handlingTime: number;
  fee?: number;
}

export interface SupplementItem {
  id: string;
  materialName: string;
  reason: string;
  templateId: string;
  deadline: string;
  status: SupplementStatus;
}

export interface ExceptionItem {
  id: string;
  type: string;
  reason: string;
  submitter: string;
  reviewer?: string;
  status: ExceptionStatus;
  createdAt: string;
  reviewAt?: string;
  reviewRemark?: string;
}

export interface FlowRecord {
  id: string;
  status: CaseStatus;
  operator: string;
  department: string;
  action: string;
  remark?: string;
  timestamp: string;
}

export interface ResultRecord {
  type: ResultType;
  registered: boolean;
  registeredBy?: string;
  registeredAt?: string;
  documentNo?: string;
}

export interface CaseInfo {
  id: string;
  caseNo: string;
  type: CaseType;
  status: CaseStatus;
  queueNo?: string;
  applicant: ApplicantInfo;
  babyInfo: BabyInfo;
  parents: ParentsInfo;
  materials: MaterialItem[];
  selectedItems: SelectedItem[];
  supplements: SupplementItem[];
  exceptions: ExceptionItem[];
  flowRecords: FlowRecord[];
  results: {
    paper: ResultRecord;
    electronic: ResultRecord;
  };
  createdAt: string;
  updatedAt: string;
  deadline: string;
  windowNo?: string;
  handler?: string;
}

export interface QueueItem {
  id: string;
  queueNo: string;
  name: string;
  type: CaseType;
  status: 'waiting' | 'calling' | 'processing' | 'completed';
  calledAt?: string;
  estimatedTime?: number;
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  supplement: number;
  exception: number;
}

export interface ExceptionReasonStat {
  reason: string;
  count: number;
  percentage: number;
}

export interface DepartmentStats {
  department: string;
  total: number;
  completed: number;
  avgTime: number;
}

export interface SupplementTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface ScenarioItem {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
}

export interface UserInfo {
  id: string;
  name: string;
  role: 'reception' | 'approver' | 'admin';
  department: string;
  windowNo?: string;
  avatar?: string;
}
