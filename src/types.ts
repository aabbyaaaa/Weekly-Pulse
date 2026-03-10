export interface Task {
  id: string;
  name: string;
  category: string;
  estimatedTime: number; // in minutes
  completed: boolean;
  createdAt: number;
}

export interface Routine {
  id: string;
  title: string;
  time: string;
  duration: number; // in minutes
  type: 'fixed' | 'slot';
  category?: string;
  order: number;
}

export interface DailyRoutineState {
  id: string; // Format: YYYY-MM-DD_routineId
  date: string; // YYYY-MM-DD
  routineId: string;
  filledTaskId: string | null;
  customText?: string | null; // 新增：如果是 slot，使用者輸入的自訂文字
  completed: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AppState {
  tasks: Task[];
  routines: Routine[];
  dailyRoutines: Record<string, DailyRoutineState>; // Key is YYYY-MM-DD_routineId
  user: User | null;
  loading: boolean;
  error: string | null;
}
