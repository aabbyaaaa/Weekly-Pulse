import { getMonday, getDaysLeftInWeek, getWeekRangeLabel } from "../utils/date";
import TaskCard from "./TaskCard";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard({ store, activeCategory, setActiveCategory }: any) {
  const currentWeekId = getMonday();
  const daysLeft = getDaysLeftInWeek();
  const weekLabel = getWeekRangeLabel(currentWeekId);

  const { tasks, records, incrementRecord, decrementRecord, categories } = store;

  const getCategoryName = (id: string) => {
    if (id === 'all') return 'All Tasks';
    const cat = categories.find((c: any) => c.id === id);
    return cat ? cat.name : 'Unknown';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🌱</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">No tasks yet</h2>
        <p className="text-stone-500 mb-6">
          Start building your weekly rhythm by adding a task.
        </p>
      </div>
    );
  }

  // Filter tasks by activeCategory and exclude archived tasks
  const activeTasks = tasks.filter((t: any) => !t.archived);
  const filteredTasks = activeCategory === 'all' 
    ? activeTasks 
    : activeTasks.filter((t: any) => t.category === activeCategory);

  // Sort tasks: uncompleted first, then by urgency
  const sortedTasks = [...filteredTasks].sort((a: any, b: any) => {
    const recordA = records.find((r: any) => r.weekId === currentWeekId && r.taskId === a.id);
    const countA = recordA ? recordA.count : 0;
    const isLimitA = a.type === 'limit';
    const isDoneA = isLimitA ? countA > a.goal : countA >= a.goal;

    const recordB = records.find((r: any) => r.weekId === currentWeekId && r.taskId === b.id);
    const countB = recordB ? recordB.count : 0;
    const isLimitB = b.type === 'limit';
    const isDoneB = isLimitB ? countB > b.goal : countB >= b.goal;

    // Completed targets and breached limits go to the bottom
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

    // If both are not done (or both done), sort by how close they are to their goal/limit
    const remainingA = a.goal - countA;
    const remainingB = b.goal - countB;
    return remainingA - remainingB;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
            {getCategoryName(activeCategory)}
          </h2>
          <p className="text-sm text-stone-500 mt-1">{weekLabel}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-indigo-100 text-indigo-800 text-xs md:text-sm font-bold px-3 py-1 rounded-full">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
      </div>

      {/* Mobile Horizontal Pills */}
      <div className="md:hidden flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-6 -mx-4 px-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
            activeCategory === 'all' ? "bg-indigo-600 text-white" : "bg-stone-200 text-stone-600"
          }`}
        >
          All ({activeTasks.length})
        </button>
        {categories.map((cat: any) => {
          const count = activeTasks.filter((t: any) => t.category === cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                activeCategory === cat.id ? "bg-indigo-600 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task: any) => {
            const record = records.find(
              (r: any) => r.weekId === currentWeekId && r.taskId === task.id,
            );
            const count = record ? record.count : 0;
            const categoryDef = categories.find((c: any) => c.id === task.category);
            return (
              <TaskCard
                key={task.id}
                task={task}
                categoryDef={categoryDef}
                count={count}
                timestamps={record?.timestamps || []}
                weekId={currentWeekId}
                daysLeft={daysLeft}
                onIncrement={() => incrementRecord(currentWeekId, task.id)}
                onDecrement={() => decrementRecord(currentWeekId, task.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
