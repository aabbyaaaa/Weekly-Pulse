import { motion } from "motion/react";
import { getWeekRangeLabel } from "../utils/date";

export default function History({ store }: any) {
  const { tasks, records } = store;

  // Group records by weekId
  const weeks = Array.from(new Set(records.map((r: any) => r.weekId))).sort(
    (a: any, b: any) => b.localeCompare(a),
  ); // descending

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">No history yet</h2>
        <p className="text-stone-500">
          Your past weeks' progress will appear here.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold mb-6">History</h2>

      <div className="space-y-8">
        {weeks.map((weekId: any) => {
          const weekRecords = records.filter((r: any) => r.weekId === weekId);

          return (
            <div
              key={weekId}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <h3 className="font-semibold text-lg mb-1">
                {getWeekRangeLabel(weekId)}
              </h3>
              <div className="h-px bg-stone-100 w-full my-3" />

              <div className="space-y-4">
                {tasks.map((task: any) => {
                  const record = weekRecords.find(
                    (r: any) => r.taskId === task.id,
                  );
                  const count = record ? record.count : 0;
                  
                  // Don't show archived tasks in history if they have no records for that week
                  if (task.archived && count === 0) return null;

                  const isCompleted = count >= task.goal;
                  const progress = Math.min((count / task.goal) * 100, 100);

                  return (
                    <div key={task.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-stone-700">
                          {task.name}
                        </span>
                        <span
                          className={
                            isCompleted
                              ? "text-emerald-600 font-medium"
                              : "text-stone-500"
                          }
                        >
                          {count} / {task.goal}
                        </span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-stone-300"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
