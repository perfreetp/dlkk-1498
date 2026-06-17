import { create } from 'zustand';
import type { CaseInfo, QueueItem, DailyStats, ExceptionReasonStat, DepartmentStats, CaseStatus } from '@/types';
import { mockCases, mockQueue, mockDailyStats, mockExceptionReasons, mockDepartmentStats, mockUser } from '@/mock/cases';

interface CaseStore {
  cases: CaseInfo[];
  queue: QueueItem[];
  currentCase: CaseInfo | null;
  dailyStats: DailyStats[];
  exceptionReasons: ExceptionReasonStat[];
  departmentStats: DepartmentStats[];
  currentUser: typeof mockUser;
  setCurrentCase: (caseInfo: CaseInfo | null) => void;
  getCaseById: (id: string) => CaseInfo | undefined;
  updateCaseStatus: (id: string, status: CaseStatus) => void;
  addCase: (caseInfo: CaseInfo) => void;
  updateCase: (id: string, updates: Partial<CaseInfo>) => void;
  getCasesByStatus: (status: CaseStatus) => CaseInfo[];
  getTodayStats: () => { total: number; completed: number; supplement: number; exception: number; processing: number };
  callNextNumber: () => QueueItem | null;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: mockCases,
  queue: mockQueue,
  currentCase: null,
  dailyStats: mockDailyStats,
  exceptionReasons: mockExceptionReasons,
  departmentStats: mockDepartmentStats,
  currentUser: mockUser,

  setCurrentCase: (caseInfo) => set({ currentCase: caseInfo }),

  getCaseById: (id) => get().cases.find(c => c.id === id),

  updateCaseStatus: (id, status) => set(state => ({
    cases: state.cases.map(c =>
      c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
    ),
  })),

  addCase: (caseInfo) => set(state => ({
    cases: [caseInfo, ...state.cases],
  })),

  updateCase: (id, updates) => set(state => ({
      cases: state.cases.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    })),

  getCasesByStatus: (status) => get().cases.filter(c => c.status === status),

  getTodayStats: () => {
    const { cases } = get();
    const today = new Date().toISOString().split('T')[0];
    const todayCases = cases.filter(c => c.createdAt.startsWith(today));
    return {
      total: todayCases.length,
      completed: todayCases.filter(c => c.status === 'completed' || c.status === 'archived').length,
      supplement: todayCases.filter(c => c.status === 'supplement').length,
      exception: todayCases.filter(c => c.status === 'exception').length,
      processing: todayCases.filter(c => c.status === 'processing' || c.status === 'arranging' || c.status === 'verifying').length,
    };
  },

  callNextNumber: () => {
    const { queue } = get();
    const next = queue.find(q => q.status === 'waiting');
    if (next) {
      set(state => ({
        queue: state.queue.map(q =>
          q.id === next.id ? { ...q, status: 'calling', calledAt: new Date().toISOString() } : q
        ),
      }));
      return next;
    }
    return null;
  },
}));
