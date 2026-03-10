export type TaskType = "target" | "limit";

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  name: string;
  goal: number;
  category: string; // Now refers to CategoryDef.id
  type?: TaskType; // Optional for backward compatibility
  createdAt: string;
  archived?: boolean;
}

export interface WeeklyRecord {
  weekId: string; // YYYY-MM-DD of the Monday
  taskId: string;
  count: number;
  timestamps?: string[]; // ISO date strings of when it was incremented
}

export type RoutineItemType = "habit" | "slot";
export type RoutineBlock = "morning" | "afternoon" | "evening";

export interface RoutineItem {
  id: string;
  title: string;
  type: RoutineItemType;
  time: string; // e.g., "08:00"
  duration?: number; // in minutes
  linkedTaskId?: string; // For habits, optional link to a weekly task
  block: RoutineBlock;
}

export interface DailyRoutineState {
  completed: boolean;
  filledTaskId?: string | null; // If it's a slot, which task was selected
  customText?: string | null; // If it's a slot, custom text entered by user
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  routines: Record<string, DailyRoutineState>;
}

export interface AppState {
  tasks: Task[];
  records: WeeklyRecord[];
  categories?: CategoryDef[]; // Optional for backward compatibility
  routines?: RoutineItem[];
  dailyRecords?: DailyRecord[];
}
