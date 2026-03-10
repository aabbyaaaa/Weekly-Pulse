import React, { useState, useMemo, useEffect } from 'react';
import { RoutineItem, DailyRoutineState, Task } from '../types';
import { format } from 'date-fns';
import { getMonday } from '../utils/date';
import { 
  Sun, 
  Moon, 
  Plus, 
  Check, 
  Link as LinkIcon, 
  Briefcase, 
  CheckCircle2,
  X,
  PlusCircle,
  Settings,
  HeartPulse,
  Edit2,
  Trash2
} from 'lucide-react';
import SOSModal from './SOSModal';
import { SlotSelectionModal } from './SlotSelectionModal';

export default function DailyRoutine({ store }: { store: any }) {
  const [view, setView] = useState<'timeline' | 'blocks'>('timeline');
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dailyRecord = store.dailyRecords?.find((r: any) => r.date === todayStr);
  const dailyStates = dailyRecord?.routines || {};

  // Sort routines by time
  const routines = [...(store.routines || [])].sort((a, b) => a.time.localeCompare(b.time));

  const morningRoutines = routines.filter(r => r.block === 'morning');
  const afternoonRoutines = routines.filter(r => r.block === 'afternoon');
  const eveningRoutines = routines.filter(r => r.block === 'evening');

  const activeTasks = store.tasks.filter((t: Task) => !t.archived);

  const handleToggleRoutine = (routineId: string, currentState: boolean) => {
    store.updateDailyRoutine(todayStr, routineId, { completed: !currentState });
    
    // Sync with task records
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      const state = dailyStates[routineId] || {};
      const taskId = routine.type === 'slot' ? state.filledTaskId : routine.linkedTaskId;
      
      if (taskId) {
        const currentWeekId = getMonday();
        if (!currentState) { // It's being marked as completed
          store.incrementRecord(currentWeekId, taskId);
        } else { // It's being marked as incomplete
          store.decrementRecord(currentWeekId, taskId);
        }
      }
    }
  };

  const handleOpenSlot = (routineId: string) => {
    setSelectedSlotId(routineId);
    setSlotModalOpen(true);
  };

  const handleFillSlot = (taskId: string | null, customText: string | null = null) => {
    if (selectedSlotId) {
      const state = dailyStates[selectedSlotId] || {};
      if (state.completed && state.filledTaskId) {
        store.decrementRecord(getMonday(), state.filledTaskId);
      }
      store.updateDailyRoutine(todayStr, selectedSlotId, { 
        filledTaskId: taskId, 
        customText: customText,
        completed: false 
      });
    }
    setSlotModalOpen(false);
    setSelectedSlotId(null);
  };

  const handleClearSlot = (routineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = dailyStates[routineId] || {};
    if (state.completed && state.filledTaskId) {
      store.decrementRecord(getMonday(), state.filledTaskId);
    }
    store.updateDailyRoutine(todayStr, routineId, { filledTaskId: null, customText: null, completed: false });
  };

  // Add dummy routines if none exist
  const handleAddSampleRoutines = () => {
    store.addRoutine({ title: "Morning Probiotics", type: "habit", time: "08:00", block: "morning" });
    store.addRoutine({ title: "Deep Work", type: "slot", time: "09:00", duration: 120, block: "morning" });
    store.addRoutine({ title: "Evening Learning", type: "slot", time: "19:00", duration: 60, block: "evening" });
  };

  const handleOpenRoutineModal = (routine?: RoutineItem) => {
    setEditingRoutine(routine || null);
    setRoutineModalOpen(true);
  };

  const handleSaveRoutine = (routineData: Partial<RoutineItem>) => {
    if (editingRoutine) {
      store.updateRoutine(editingRoutine.id, routineData);
    } else {
      store.addRoutine(routineData);
    }
    setRoutineModalOpen(false);
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string) => {
    if (window.confirm('Are you sure you want to delete this routine?')) {
      const state = dailyStates[id] || {};
      const routine = routines.find(r => r.id === id);
      if (state.completed && routine) {
        const taskId = routine.type === 'slot' ? state.filledTaskId : routine.linkedTaskId;
        if (taskId) {
          store.decrementRecord(getMonday(), taskId);
        }
      }
      store.deleteRoutine(id);
      setRoutineModalOpen(false);
      setEditingRoutine(null);
    }
  };

  if (routines.length === 0) {
    return (
      <div className="max-w-md mx-auto relative pb-20">
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-stone-100 p-8 text-center relative mt-6">
          <h2 className="text-xl font-bold text-stone-800 mb-2">No Routines Yet</h2>
          <p className="text-stone-500 mb-6">Set up your daily rhythm to stay on track.</p>
          <button 
            onClick={handleAddSampleRoutines}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Add Sample Routines
          </button>
        </div>
        
        {/* SOS Button */}
        <button 
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all z-40 group"
          onClick={() => setSosModalOpen(true)}
        >
          <HeartPulse size={24} className="group-hover:animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative pb-20">
      {/* Header / Tabs */}
      <div className="bg-white pt-6 pb-4 px-6 shadow-sm rounded-3xl mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-xl font-bold text-stone-800">Daily Routine</h1>
            <p className="text-xs text-stone-500 mt-1">Fixed habits + Flexible slots</p>
          </div>
          <button 
            onClick={() => handleOpenRoutineModal()}
            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-xl relative mt-4">
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-out z-0"
            style={{ transform: view === 'timeline' ? 'translateX(0)' : 'translateX(100%)', left: '4px' }}
          />
          <button 
            onClick={() => setView('timeline')} 
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors z-10 relative ${view === 'timeline' ? 'text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Timeline
          </button>
          <button 
            onClick={() => setView('blocks')} 
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors z-10 relative ${view === 'blocks' ? 'text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Blocks
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {view === 'timeline' ? (
          <TimelineView 
            routines={routines} 
            dailyStates={dailyStates} 
            tasks={activeTasks}
            onToggle={handleToggleRoutine} 
            onOpenSlot={handleOpenSlot}
            onClearSlot={handleClearSlot}
            onEditRoutine={handleOpenRoutineModal}
          />
        ) : (
          <BlocksView 
            morning={morningRoutines}
            afternoon={afternoonRoutines}
            evening={eveningRoutines}
            dailyStates={dailyStates}
            tasks={activeTasks}
            onToggle={handleToggleRoutine}
            onOpenSlot={handleOpenSlot}
            onClearSlot={handleClearSlot}
            onEditRoutine={handleOpenRoutineModal}
          />
        )}
      </div>

      {/* SOS Button (Placeholder for now) */}
      <button 
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all z-40 group"
        onClick={() => setSosModalOpen(true)}
      >
        <HeartPulse size={24} className="group-hover:animate-pulse" />
      </button>

      {/* SOS Modal */}
      <SOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />

      {/* Slot Modal */}
      {slotModalOpen && (
        <SlotSelectionModal 
          tasks={activeTasks} 
          onSelect={handleFillSlot} 
          onClose={() => setSlotModalOpen(false)} 
        />
      )}

      {/* Routine Form Modal */}
      {routineModalOpen && (
        <RoutineFormModal 
          routine={editingRoutine} 
          onSave={handleSaveRoutine} 
          onClose={() => {
            setRoutineModalOpen(false);
            setEditingRoutine(null);
          }} 
          onDelete={editingRoutine ? () => handleDeleteRoutine(editingRoutine.id) : undefined}
        />
      )}
    </div>
  );
}

function TimelineView({ routines, dailyStates, tasks, onToggle, onOpenSlot, onClearSlot, onEditRoutine }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update every minute to keep the timeline accurate
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div className="p-2 relative">
      <div className="absolute left-[80px] top-6 bottom-6 w-px bg-stone-200"></div>
      <div className="space-y-6">
        {routines.map((routine: any) => {
          const state = dailyStates[routine.id] || { completed: false };
          const isSlot = routine.type === 'slot';
          const isFilled = isSlot && (state.filledTaskId || state.customText);
          const filledTask = isFilled && state.filledTaskId ? tasks.find((t: any) => t.id === state.filledTaskId) : null;

          // Calculate time logic for the indicator
          const [hours, mins] = routine.time.split(':').map(Number);
          const startMins = hours * 60 + mins;
          const duration = routine.duration || 60; // Default to 60 mins if no duration
          const endMins = startMins + duration;
          
          const isActive = currentTotalMins >= startMins && currentTotalMins < endMins;
          // Calculate percentage for the red line position (0% to 100%)
          const progressPercent = isActive ? Math.max(0, Math.min(100, ((currentTotalMins - startMins) / duration) * 100)) : 0;

          return (
            <div key={routine.id} className="relative flex gap-4 group">
              {/* Time & Line */}
              <div className="w-20 flex flex-col items-end pr-4 pt-3 relative z-10">
                <span className={`text-xs font-bold ${isActive ? 'text-rose-500' : 'text-stone-400'}`}>{routine.time}</span>
                {routine.duration && (
                  <span className="text-[10px] text-stone-300 mt-8">+{routine.duration}m</span>
                )}
                <div className={`absolute right-[-4px] top-[14px] w-2 h-2 rounded-full ring-4 ring-stone-50 ${isSlot ? (isFilled ? 'bg-indigo-400' : 'bg-stone-300') : 'bg-emerald-400'}`}></div>
                {routine.duration && (
                  <div className={`absolute right-[-4px] top-[22px] w-2 h-12 rounded-full ${isSlot && !isFilled ? 'border-2 border-dashed border-indigo-300 bg-stone-50' : (isSlot ? 'bg-indigo-400 ring-2 ring-stone-50' : 'bg-emerald-400 ring-2 ring-stone-50')}`}></div>
                )}
              </div>

              {/* Red Line Indicator */}
              {isActive && (
                <div 
                  className="absolute left-[80px] w-[calc(100%-80px)] h-px bg-rose-500 z-30 pointer-events-none flex items-center transition-all duration-1000 ease-linear"
                  style={{ top: `calc(14px + (100% - 14px) * ${progressPercent / 100})` }}
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1"></div>
                  <div className="text-[10px] text-white font-bold bg-rose-500 px-1.5 py-0.5 ml-2 -mt-4 rounded shadow-sm">
                    {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                  </div>
                </div>
              )}

              {/* Content Card */}
              {isSlot && !isFilled ? (
                <div 
                  className={`flex-1 bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all relative group/card ${isActive ? 'shadow-md -translate-y-0.5 ring-2 ring-rose-100' : ''}`} 
                  onClick={() => onOpenSlot(routine.id)}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }} 
                    className="absolute right-2 top-2 p-1.5 text-stone-300 hover:text-indigo-600 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white rounded-full shadow-sm border border-stone-100"
                  >
                    <Edit2 size={12} />
                  </button>
                  <div className="flex items-center gap-3 h-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Plus size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="font-medium text-indigo-600 text-sm">{routine.title || "Select a task"}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Click to fill from weekly tasks or enter custom</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 rounded-2xl shadow-sm border p-4 relative overflow-hidden group/card ${isSlot ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-stone-100'} ${isActive ? 'shadow-md -translate-y-0.5 ring-2 ring-rose-100' : ''}`}>
                  {isSlot && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                  
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }} 
                      className="p-1.5 text-stone-400 hover:text-indigo-600 bg-white rounded-full shadow-sm border border-stone-100"
                    >
                      <Edit2 size={12} />
                    </button>
                    {isSlot && isFilled && (
                      <button 
                        onClick={(e) => onClearSlot(routine.id, e)} 
                        className="p-1.5 text-stone-400 hover:text-rose-600 bg-white rounded-full shadow-sm border border-stone-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={state.completed}
                      onChange={() => onToggle(routine.id, state.completed)}
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${state.completed ? 'bg-indigo-600 border-indigo-600' : 'border-stone-300 group-hover:border-indigo-400'}`}>
                      <Check size={12} className={`text-white transition-all duration-200 ${state.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3} />
                    </div>
                    <div>
                      <div className={`font-medium text-sm ${state.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                        {isSlot ? (state.customText ? state.customText : (filledTask?.name || "Unknown Task")) : routine.title}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                        {isSlot ? (
                          <><CheckCircle2 size={12} /> {state.customText ? 'Custom Routine' : 'Loaded from weekly tasks'}</>
                        ) : (
                          <><Briefcase size={12} /> Fixed Habit</>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlocksView({ morning, afternoon, evening, dailyStates, tasks, onToggle, onOpenSlot, onClearSlot, onEditRoutine }: any) {
  return (
    <div className="space-y-8 p-2">
      <BlockSection title="Morning" icon={<Sun size={16} className="text-amber-500" />} routines={morning} dailyStates={dailyStates} tasks={tasks} onToggle={onToggle} onOpenSlot={onOpenSlot} onClearSlot={onClearSlot} onEditRoutine={onEditRoutine} />
      <BlockSection title="Afternoon" icon={<Sun size={16} className="text-orange-500" />} routines={afternoon} dailyStates={dailyStates} tasks={tasks} onToggle={onToggle} onOpenSlot={onOpenSlot} onClearSlot={onClearSlot} onEditRoutine={onEditRoutine} />
      <BlockSection title="Evening" icon={<Moon size={16} className="text-indigo-500" />} routines={evening} dailyStates={dailyStates} tasks={tasks} onToggle={onToggle} onOpenSlot={onOpenSlot} onClearSlot={onClearSlot} onEditRoutine={onEditRoutine} />
    </div>
  );
}

function BlockSection({ title, icon, routines, dailyStates, tasks, onToggle, onOpenSlot, onClearSlot, onEditRoutine }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  if (!routines || routines.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pl-1">
        {icon}
        <h3 className="font-bold text-stone-800 text-sm">{title}</h3>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden p-2 space-y-2">
        {routines.map((routine: any) => {
          const state = dailyStates[routine.id] || { completed: false };
          const isSlot = routine.type === 'slot';
          const isFilled = isSlot && (state.filledTaskId || state.customText);
          const filledTask = isFilled && state.filledTaskId ? tasks.find((t: any) => t.id === state.filledTaskId) : null;

          const [hours, mins] = routine.time.split(':').map(Number);
          const startMins = hours * 60 + mins;
          const duration = routine.duration || 60;
          const endMins = startMins + duration;
          const isActive = currentTotalMins >= startMins && currentTotalMins < endMins;

          if (isSlot && !isFilled) {
            return (
              <div 
                key={routine.id}
                className={`p-3 rounded-2xl border-2 border-dashed border-indigo-200 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex items-center gap-3 relative group/card ${isActive ? 'shadow-md -translate-y-0.5 ring-2 ring-rose-100' : ''}`} 
                onClick={() => onOpenSlot(routine.id)}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Plus size={16} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-indigo-600 text-sm">{routine.title || "Select a task"}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-rose-500 font-bold' : 'text-stone-400'}`}>{routine.time} {routine.duration ? `(+${routine.duration}m)` : ''}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-300 hover:text-indigo-600 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white rounded-full shadow-sm border border-stone-100"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            );
          }

          return (
            <div key={routine.id} className={`p-3 rounded-2xl border relative group/card ${isSlot ? 'bg-indigo-50/50 border-indigo-100' : 'border-stone-50'} ${isActive ? 'shadow-md -translate-y-0.5 ring-2 ring-rose-100' : ''}`}>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }} 
                  className="p-1.5 text-stone-400 hover:text-indigo-600 bg-white rounded-full shadow-sm border border-stone-100"
                >
                  <Edit2 size={12} />
                </button>
                {isSlot && isFilled && (
                  <button 
                    onClick={(e) => onClearSlot(routine.id, e)} 
                    className="p-1.5 text-stone-400 hover:text-rose-600 bg-white rounded-full shadow-sm border border-stone-100"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group pr-16">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={state.completed}
                  onChange={() => onToggle(routine.id, state.completed)}
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${state.completed ? 'bg-indigo-600 border-indigo-600' : 'border-stone-300 group-hover:border-indigo-400'} ${isActive && !state.completed ? 'ring-4 ring-rose-100 border-rose-300' : ''}`}>
                  <Check size={12} className={`text-white transition-all duration-200 ${state.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className={`font-medium text-sm ${state.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                    {isSlot ? (state.customText ? state.customText : (filledTask?.name || "Unknown Task")) : routine.title}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${isActive ? 'bg-rose-100 text-rose-600' : (isSlot ? 'bg-indigo-100/50 text-indigo-600/70' : 'bg-stone-100 text-stone-400')}`}>
                    {routine.time}
                  </span>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoutineFormModal({ routine, onSave, onClose, onDelete }: any) {
  const [title, setTitle] = useState(routine?.title || '');
  const [type, setType] = useState<'habit' | 'slot'>(routine?.type || 'habit');
  const [time, setTime] = useState(routine?.time || '08:00');
  const [block, setBlock] = useState<'morning' | 'afternoon' | 'evening'>(routine?.block || 'morning');
  const [duration, setDuration] = useState(routine?.duration || 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      type,
      time,
      block,
      ...(type === 'slot' ? { duration } : {})
    });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 z-50 flex flex-col justify-end backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-t-3xl p-6 flex flex-col animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-stone-800">
            {routine ? 'Edit Routine' : 'Add Routine'}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder={type === 'slot' ? "e.g., Deep Work" : "e.g., Morning Meditation"}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as 'habit' | 'slot')}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="habit">Fixed Habit</option>
                <option value="slot">Flexible Slot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Block</label>
              <select 
                value={block}
                onChange={(e) => setBlock(e.target.value as 'morning' | 'afternoon' | 'evening')}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            {type === 'slot' && (
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Duration (min)</label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  min="5"
                  step="5"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            {onDelete && (
              <button 
                type="button"
                onClick={onDelete}
                className="p-3 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              type="submit"
              className="flex-1 p-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
