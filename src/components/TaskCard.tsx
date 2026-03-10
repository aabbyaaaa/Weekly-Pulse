import { useRef } from "react";
import { motion } from "motion/react";
import { Plus, CheckCircle2, Flame, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { getDaysOfWeek } from "../utils/date";
import { getCategoryColorClasses } from "../utils/colors";

export default function TaskCard({
  task,
  categoryDef,
  count,
  timestamps = [],
  weekId,
  daysLeft,
  onIncrement,
  onDecrement,
}: any) {
  const isLimit = task.type === 'limit';
  
  // Target Logic
  const isCompleted = !isLimit && count >= task.goal;
  const isOverAchieved = !isLimit && count > task.goal;
  const isUrgent = !isLimit && !isCompleted && daysLeft <= 2 && daysLeft > 0 && count < task.goal;
  
  // Limit Logic
  const isWarning = isLimit && count === task.goal;
  const isBreached = isLimit && count > task.goal;

  const progress = Math.min((count / task.goal) * 100, 100);
  
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const weekDays = getDaysOfWeek(weekId);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      if (count > 0) {
        onDecrement();
        toast.info(`Undid one ${task.name}`);
      }
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!isLongPress.current) {
      handleIncrement();
    }
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleIncrement = () => {
    if (navigator.vibrate) {
      if (isLimit && count >= task.goal) {
        navigator.vibrate([50, 100, 50]); // Heavy warning vibration
      } else if (!isLimit && count + 1 >= task.goal && !isCompleted) {
        navigator.vibrate([50, 50, 100]); // Success vibration
      } else {
        navigator.vibrate(20); // Light tap
      }
    }

    onIncrement();

    if (!isLimit) {
      if (count + 1 === task.goal) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
        toast.success(`Goal reached for ${task.name}! 🎉`);
      } else if (count + 1 > task.goal) {
        toast.success(`Overachiever! Keep it up! 🔥`);
      }
    } else {
      if (count + 1 === task.goal) {
        toast.warning(`Limit reached for ${task.name}. Be careful!`);
      } else if (count + 1 > task.goal) {
        toast.error(`You've exceeded your limit for ${task.name}.`);
      }
    }
  };

  // Styling logic
  let ringColor = "text-indigo-500";
  let btnColor = "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20";
  let cardStyle = "border-stone-100";
  let titleColor = "text-stone-800";
  let statusText = "";
  let statusColor = "text-stone-500";
  let countColor = "text-stone-700";

  if (isLimit) {
    if (isBreached) {
      ringColor = "text-red-500";
      btnColor = "bg-red-500 hover:bg-red-600 shadow-red-500/20";
      cardStyle = "border-red-200 bg-red-50/30";
      titleColor = "text-red-900";
      statusText = `Over limit by ${count - task.goal}`;
      statusColor = "text-red-600";
      countColor = "text-red-600";
    } else if (isWarning) {
      ringColor = "text-orange-500";
      btnColor = "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20";
      cardStyle = "border-orange-200 bg-orange-50/30";
      titleColor = "text-orange-900";
      statusText = "Limit reached";
      statusColor = "text-orange-600";
      countColor = "text-orange-600";
    } else {
      ringColor = "text-stone-400";
      btnColor = "bg-stone-400 hover:bg-stone-500 shadow-stone-400/20";
      titleColor = "text-stone-800";
      statusText = `${task.goal - count} limits left`;
      statusColor = "text-stone-500";
      countColor = "text-stone-700";
    }
  } else {
    if (isOverAchieved) {
      ringColor = "text-amber-500";
      btnColor = "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/40";
      cardStyle = "border-amber-300 bg-amber-50/30 shadow-amber-500/10";
      titleColor = "text-amber-900";
      statusText = "Extra effort! 🔥";
      statusColor = "text-amber-600";
      countColor = "text-amber-600";
    } else if (isCompleted) {
      ringColor = "text-emerald-500";
      btnColor = "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20";
      cardStyle = "border-emerald-200 bg-emerald-50/40 opacity-70";
      titleColor = "text-emerald-900";
      statusText = "Goal reached!";
      statusColor = "text-emerald-600";
      countColor = "text-emerald-600";
    } else if (isUrgent) {
      ringColor = "text-orange-500";
      btnColor = "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20";
      cardStyle = "border-orange-200 bg-orange-50/30";
      titleColor = "text-stone-800";
      statusText = `Urgent: ${task.goal - count} more to go`;
      statusColor = "text-orange-600";
      countColor = "text-stone-700";
    } else {
      statusText = `${task.goal - count} more to go`;
    }
  }

  const catName = categoryDef?.name || 'Unknown';
  const catColorClasses = getCategoryColorClasses(categoryDef?.color || 'stone');

  return (
    <motion.div 
      layout
      animate={isBreached ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-3xl p-5 shadow-sm border transition-all duration-500 ${cardStyle}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-semibold text-lg ${titleColor}`}>
              {task.name}
            </h3>
            {isOverAchieved ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Flame className="w-5 h-5 text-amber-500" />
              </motion.div>
            ) : isCompleted ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </motion.div>
            ) : isBreached ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </motion.div>
            ) : null}
          </div>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${catColorClasses}`}
          >
            {catName}
          </span>
          
          <div className={`mt-3 text-xs font-medium ${statusColor}`}>
            {statusText}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-stone-100"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className={ringColor}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-sm font-bold ${countColor}`}>
                {count}
              </span>
              <span className="text-[8px] text-stone-400 font-medium -mt-1">/{task.goal}</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors select-none touch-none ${btnColor}`}
          >
            <Plus className="w-7 h-7" />
          </motion.button>
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div className="flex gap-1 mt-5">
        {weekDays.map((day, i) => {
          const countForDay = timestamps.filter((t: string) => {
            const d = new Date(t);
            const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return localDate === day;
          }).length;

          let bgClass = "bg-stone-100";
          if (isLimit) {
            if (countForDay === 1) bgClass = "bg-red-200";
            if (countForDay === 2) bgClass = "bg-red-400";
            if (countForDay >= 3) bgClass = "bg-red-600";
          } else {
            if (countForDay === 1) bgClass = isOverAchieved ? "bg-amber-200" : "bg-indigo-200";
            if (countForDay === 2) bgClass = isOverAchieved ? "bg-amber-400" : "bg-indigo-400";
            if (countForDay >= 3) bgClass = isOverAchieved ? "bg-amber-500" : "bg-indigo-600";
          }

          const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-full h-6 rounded-md ${bgClass} transition-colors`} />
              <span className="text-[8px] text-stone-400 font-medium">{dayNames[i]}</span>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-2">
        <span className="text-[9px] text-stone-400">Long press + to undo</span>
      </div>
    </motion.div>
  );
}
