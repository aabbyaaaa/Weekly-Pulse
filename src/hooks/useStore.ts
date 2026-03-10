import { useState, useEffect } from "react";
import { AppState, Task, CategoryDef, WeeklyRecord, RoutineItem, DailyRecord, DailyRoutineState } from "../types";
import { db, auth } from "../firebase";
import { User } from "firebase/auth";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  writeBatch
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const defaultCategories: CategoryDef[] = [
  { id: 'health', name: 'Health', color: 'emerald' },
  { id: 'hygiene', name: 'Hygiene', color: 'cyan' },
  { id: 'exercise', name: 'Exercise', color: 'orange' },
  { id: 'learning', name: 'Learning', color: 'blue' },
  { id: 'other', name: 'Other', color: 'stone' },
];

export function useStore(user: User) {
  const userId = user.uid;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>(defaultCategories);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);

  useEffect(() => {
    if (!userId) return;

    // 1. Listen to User Profile (for categories)
    const userRef = doc(db, "users", userId);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        // Initialize user profile
        setDoc(userRef, { email: user.email || "user@example.com", categories: defaultCategories }, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, `users/${userId}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));

    // 2. Listen to Tasks
    const tasksRef = collection(db, `users/${userId}/tasks`);
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const newTasks: Task[] = [];
      snapshot.forEach((doc) => {
        newTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(newTasks);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`));

    // 3. Listen to Weekly Records
    const recordsRef = collection(db, `users/${userId}/weekly_records`);
    const unsubRecords = onSnapshot(recordsRef, (snapshot) => {
      const newRecords: WeeklyRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Flatten records map to array of WeeklyRecord for the UI
        if (data.records) {
          Object.entries(data.records).forEach(([taskId, recordData]: [string, any]) => {
            newRecords.push({
              weekId: doc.id,
              taskId,
              count: recordData.count || 0,
              timestamps: recordData.timestamps || []
            });
          });
        }
      });
      setRecords(newRecords);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/weekly_records`));

    // 4. Listen to Routines
    const routinesRef = collection(db, `users/${userId}/routines`);
    const unsubRoutines = onSnapshot(routinesRef, (snapshot) => {
      const newRoutines: RoutineItem[] = [];
      snapshot.forEach((doc) => {
        newRoutines.push({ id: doc.id, ...doc.data() } as RoutineItem);
      });
      setRoutines(newRoutines);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/routines`));

    // 5. Listen to Daily Records
    const dailyRecordsRef = collection(db, `users/${userId}/daily_records`);
    const unsubDailyRecords = onSnapshot(dailyRecordsRef, (snapshot) => {
      const newDailyRecords: DailyRecord[] = [];
      snapshot.forEach((doc) => {
        newDailyRecords.push({ date: doc.id, routines: doc.data().routines || {} });
      });
      setDailyRecords(newDailyRecords);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/daily_records`));

    return () => {
      unsubUser();
      unsubTasks();
      unsubRecords();
      unsubRoutines();
      unsubDailyRecords();
    };
  }, [userId]);

  const addTask = async (task: Omit<Task, "id" | "createdAt">) => {
    try {
      const newTaskRef = doc(collection(db, `users/${userId}/tasks`));
      const now = new Date().toISOString();
      await setDoc(newTaskRef, {
        ...task,
        createdAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/tasks`);
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => {
    try {
      const taskRef = doc(db, `users/${userId}/tasks`, id);
      await updateDoc(taskRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${id}`);
    }
  };

  const toggleArchiveTask = async (id: string, currentArchivedStatus: boolean | undefined) => {
    try {
      const taskRef = doc(db, `users/${userId}/tasks`, id);
      await updateDoc(taskRef, { archived: !currentArchivedStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const taskRef = doc(db, `users/${userId}/tasks`, id);
      await deleteDoc(taskRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tasks/${id}`);
    }
  };

  const incrementRecord = async (weekId: string, taskId: string) => {
    try {
      const recordRef = doc(db, `users/${userId}/weekly_records`, weekId);
      const recordSnap = await getDoc(recordRef);
      
      const now = new Date().toISOString();
      if (recordSnap.exists()) {
        const data = recordSnap.data();
        const currentRecord = data.records?.[taskId] || { count: 0, timestamps: [] };
        await updateDoc(recordRef, {
          [`records.${taskId}`]: {
            count: currentRecord.count + 1,
            timestamps: [...(currentRecord.timestamps || []), now]
          },
          updatedAt: now
        });
      } else {
        await setDoc(recordRef, {
          weekId,
          records: { 
            [taskId]: { count: 1, timestamps: [now] } 
          },
          updatedAt: now
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/weekly_records/${weekId}`);
    }
  };

  const decrementRecord = async (weekId: string, taskId: string) => {
    try {
      const recordRef = doc(db, `users/${userId}/weekly_records`, weekId);
      const recordSnap = await getDoc(recordRef);
      
      if (recordSnap.exists()) {
        const data = recordSnap.data();
        const currentRecord = data.records?.[taskId];
        if (currentRecord && currentRecord.count > 0) {
          await updateDoc(recordRef, {
            [`records.${taskId}`]: {
              count: currentRecord.count - 1,
              timestamps: (currentRecord.timestamps || []).slice(0, -1)
            },
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/weekly_records/${weekId}`);
    }
  };

  const addCategory = async (category: Omit<CategoryDef, "id">) => {
    try {
      const newCategory = { ...category, id: crypto.randomUUID() };
      const newCategories = [...categories, newCategory];
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { categories: newCategories });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Omit<CategoryDef, "id">>) => {
    try {
      const newCategories = categories.map(c => c.id === id ? { ...c, ...updates } : c);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { categories: newCategories });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const fallbackId = categories.find(c => c.id !== id)?.id || 'other';
      const newCategories = categories.filter(c => c.id !== id);
      
      const batch = writeBatch(db);
      const userRef = doc(db, "users", userId);
      batch.update(userRef, { categories: newCategories });

      // Reassign tasks
      tasks.forEach(t => {
        if (t.category === id) {
          const taskRef = doc(db, `users/${userId}/tasks`, t.id);
          batch.update(taskRef, { category: fallbackId });
        }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId} (batch)`);
    }
  };

  const addRoutine = async (routine: Omit<RoutineItem, "id">) => {
    try {
      const newRoutineRef = doc(collection(db, `users/${userId}/routines`));
      await setDoc(newRoutineRef, routine);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/routines`);
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Omit<RoutineItem, "id">>) => {
    try {
      const routineRef = doc(db, `users/${userId}/routines`, id);
      await updateDoc(routineRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/routines/${id}`);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const routineRef = doc(db, `users/${userId}/routines`, id);
      await deleteDoc(routineRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/routines/${id}`);
    }
  };

  const updateDailyRoutine = async (date: string, routineId: string, state: Partial<DailyRoutineState>) => {
    try {
      const dailyRecordRef = doc(db, `users/${userId}/daily_records`, date);
      const dailyRecordSnap = await getDoc(dailyRecordRef);
      
      if (dailyRecordSnap.exists()) {
        const data = dailyRecordSnap.data();
        const currentRoutines = data.routines || {};
        const currentRoutineState = currentRoutines[routineId] || { completed: false };
        
        await updateDoc(dailyRecordRef, {
          [`routines.${routineId}`]: {
            ...currentRoutineState,
            ...state
          }
        });
      } else {
        await setDoc(dailyRecordRef, {
          date,
          routines: {
            [routineId]: {
              completed: false,
              ...state
            }
          }
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/daily_records/${date}`);
    }
  };

  return {
    tasks,
    records,
    categories,
    routines,
    dailyRecords,
    addTask,
    updateTask,
    toggleArchiveTask,
    deleteTask,
    incrementRecord,
    decrementRecord,
    addCategory,
    updateCategory,
    deleteCategory,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    updateDailyRoutine,
  };
}
