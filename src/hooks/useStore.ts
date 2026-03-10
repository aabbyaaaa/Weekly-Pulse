import { create } from 'zustand';
import { AppState, Task, Routine, DailyRoutineState, User } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface StoreActions {
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  
  updateDailyRoutine: (date: string, routineId: string, updates: Partial<DailyRoutineState>) => void;
  
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  
  initializeListeners: () => void;
}

const initialState: AppState = {
  tasks: [],
  routines: [],
  dailyRoutines: {},
  user: null,
  loading: true,
  error: null,
};

export const useStore = create<AppState & StoreActions>((set, get) => {
  let unsubTasks: (() => void) | null = null;
  let unsubRoutines: (() => void) | null = null;
  let unsubDailyRoutines: (() => void) | null = null;

  const cleanupListeners = () => {
    if (unsubTasks) unsubTasks();
    if (unsubRoutines) unsubRoutines();
    if (unsubDailyRoutines) unsubDailyRoutines();
  };

  // Setup auth listener immediately
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      set({ 
        user: { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        } 
      });
      get().initializeListeners();
    } else {
      cleanupListeners();
      set({ ...initialState, loading: false });
    }
  });

  return {
    ...initialState,

    setUser: (user) => set({ user }),
    
    logout: async () => {
      try {
        await signOut(auth);
        cleanupListeners();
        set({ ...initialState, loading: false });
      } catch (error) {
        console.error("Error logging out:", error);
      }
    },

    initializeListeners: () => {
      const { user } = get();
      if (!user) return;

      set({ loading: true });

      // Listen to Tasks
      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        set({ tasks });
      }, (error) => {
        console.error("Error fetching tasks:", error);
        set({ error: error.message });
      });

      // Listen to Routines
      const routinesQuery = query(collection(db, 'routines'), where('userId', '==', user.uid));
      unsubRoutines = onSnapshot(routinesQuery, (snapshot) => {
        const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));
        set({ routines });
      }, (error) => {
        console.error("Error fetching routines:", error);
        set({ error: error.message });
      });

      // Listen to Daily Routines
      const dailyRoutinesQuery = query(collection(db, 'dailyRoutines'), where('userId', '==', user.uid));
      unsubDailyRoutines = onSnapshot(dailyRoutinesQuery, (snapshot) => {
        const dailyRoutines: Record<string, DailyRoutineState> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data() as DailyRoutineState;
          dailyRoutines[data.id] = data;
        });
        set({ dailyRoutines, loading: false });
      }, (error) => {
        console.error("Error fetching daily routines:", error);
        set({ error: error.message, loading: false });
      });
    },

    addTask: async (taskData) => {
      const { user } = get();
      if (!user) return;

      try {
        const newTaskRef = doc(collection(db, 'tasks'));
        const task = {
          ...taskData,
          id: newTaskRef.id,
          createdAt: Date.now(),
          userId: user.uid
        };
        await setDoc(newTaskRef, task);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    },

    updateTask: async (id, updates) => {
      const { user } = get();
      if (!user) return;

      try {
        const taskRef = doc(db, 'tasks', id);
        await setDoc(taskRef, updates, { merge: true });
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },

    deleteTask: async (id) => {
      const { user } = get();
      if (!user) return;

      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },

    addRoutine: async (routineData) => {
      const { user } = get();
      if (!user) return;

      try {
        const newRoutineRef = doc(collection(db, 'routines'));
        const routine = {
          ...routineData,
          id: newRoutineRef.id,
          userId: user.uid
        };
        await setDoc(newRoutineRef, routine);
      } catch (error) {
        console.error("Error adding routine:", error);
      }
    },

    updateRoutine: async (id, updates) => {
      const { user } = get();
      if (!user) return;

      try {
        const routineRef = doc(db, 'routines', id);
        await setDoc(routineRef, updates, { merge: true });
      } catch (error) {
        console.error("Error updating routine:", error);
      }
    },

    deleteRoutine: async (id) => {
      const { user } = get();
      if (!user) return;

      try {
        await deleteDoc(doc(db, 'routines', id));
        
        // Also delete associated daily routines
        const dailyRoutinesQuery = query(
          collection(db, 'dailyRoutines'), 
          where('userId', '==', user.uid),
          where('routineId', '==', id)
        );
        const snapshot = await getDocs(dailyRoutinesQuery);
        snapshot.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, 'dailyRoutines', docSnapshot.id));
        });
        
      } catch (error) {
        console.error("Error deleting routine:", error);
      }
    },

    updateDailyRoutine: async (date, routineId, updates) => {
      const { user } = get();
      if (!user) return;

      try {
        const id = `${date}_${routineId}`;
        const dailyRoutineRef = doc(db, 'dailyRoutines', id);
        
        const data = {
          ...updates,
          id,
          date,
          routineId,
          userId: user.uid
        };
        
        await setDoc(dailyRoutineRef, data, { merge: true });
      } catch (error) {
        console.error("Error updating daily routine:", error);
      }
    },
  };
});
