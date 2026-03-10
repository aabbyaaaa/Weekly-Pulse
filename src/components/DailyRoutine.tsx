import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { SlotSelectionModal } from './SlotSelectionModal';

export function DailyRoutine() {
  const store = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const todayStr = format(currentDate, 'yyyy-MM-dd');

  // Initialize daily routines for the current date if they don't exist
  useEffect(() => {
    if (store.routines.length > 0) {
      store.routines.forEach(routine => {
        const stateId = `${todayStr}_${routine.id}`;
        if (!store.dailyRoutines[stateId]) {
          store.updateDailyRoutine(todayStr, routine.id, {
            filledTaskId: null,
            customText: null,
            completed: false
          });
        }
      });
    }
  }, [currentDate, store.routines, store.dailyRoutines, store.updateDailyRoutine, todayStr]);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    }
    setShowDatePicker(false);
  };

  const sortedRoutines = useMemo(() => {
    return [...store.routines].sort((a, b) => a.order - b.order);
  }, [store.routines]);

  const availableTasks = useMemo(() => {
    return store.tasks.filter(t => !t.completed);
  }, [store.tasks]);

  const handleSlotClick = (routineId: string) => {
    setSelectedSlotId(routineId);
  };

  const handleFillSlot = (taskId: string | null, customText: string | null = null) => {
    if (selectedSlotId) {
      store.updateDailyRoutine(todayStr, selectedSlotId, {
        filledTaskId: taskId,
        customText: customText,
        completed: false
      });
      setSelectedSlotId(null);
    }
  };

  const handleToggleComplete = (routineId: string, currentState: boolean) => {
    store.updateDailyRoutine(todayStr, routineId, { completed: !currentState });
  };

  const handleClearSlot = (routineId: string) => {
    store.updateDailyRoutine(todayStr, routineId, { filledTaskId: null, customText: null, completed: false });
  };

  const progress = useMemo(() => {
    if (sortedRoutines.length === 0) return 0;
    let completedCount = 0;
    
    sortedRoutines.forEach(routine => {
      const stateId = `${todayStr}_${routine.id}`;
      const state = store.dailyRoutines[stateId];
      if (state?.completed) {
        completedCount++;
      }
    });
    
    return Math.round((completedCount / sortedRoutines.length) * 100);
  }, [sortedRoutines, store.dailyRoutines, todayStr]);

  // Group routines by time of day (Morning, Afternoon, Evening)
  const groupedRoutines = useMemo(() => {
    const groups = {
      Morning: [] as typeof sortedRoutines,
      Afternoon: [] as typeof sortedRoutines,
      Evening: [] as typeof sortedRoutines
    };

    sortedRoutines.forEach(routine => {
      const hour = parseInt(routine.time.split(':')[0], 10);
      if (hour >= 5 && hour < 12) {
        groups.Morning.push(routine);
      } else if (hour >= 12 && hour < 17) {
        groups.Afternoon.push(routine);
      } else {
        groups.Evening.push(routine);
      }
    });

    return groups;
  }, [sortedRoutines]);

  return (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-white px-6 py-5 border-b border-stone-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Daily Flow</h1>
          
          <div className="flex items-center bg-stone-100 rounded-full p-1">
            <button 
              onClick={handlePrevDay}
              className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-stone-600"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-1 font-medium text-stone-800 hover:text-indigo-600 transition-colors flex items-center gap-2"
              >
                {isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM d')}
                <CalendarIcon size={14} className="text-stone-400" />
              </button>
              
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-stone-200 p-2 z-50">
                  <input 
                    type="date" 
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={handleDateSelect}
                    className="p-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
            
            <button 
              onClick={handleNextDay}
              className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-stone-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-stone-600">Daily Progress</span>
            <span className="font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Routine List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {sortedRoutines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 border-dashed">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2">No routines set</h3>
            <p className="text-stone-500 text-sm max-w-[200px] mx-auto">
              Go to Settings to set up your daily template.
            </p>
          </div>
        ) : (
          <>
            {/* Morning Section */}
            {groupedRoutines.Morning.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Morning
                </h3>
                <div className="space-y-3">
                  {groupedRoutines.Morning.map(routine => {
                    const stateId = `${todayStr}_${routine.id}`;
                    const state = store.dailyRoutines[stateId] || { completed: false, filledTaskId: null, customText: null };
                    const isSlot = routine.type === 'slot';
                    const isFilled = isSlot && (state.filledTaskId || state.customText);
                    const filledTask = isFilled && state.filledTaskId ? store.tasks.find(t => t.id === state.filledTaskId) : null;
                    
                    return (
                      <div 
                        key={routine.id}
                        className={`group relative flex items-stretch bg-white rounded-2xl border transition-all duration-200 ${
                          state.completed 
                            ? 'border-stone-200 opacity-60 bg-stone-50/50' 
                            : isSlot && !isFilled
                              ? 'border-indigo-200 shadow-sm hover:border-indigo-300'
                              : 'border-stone-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 border-r border-stone-100 bg-stone-50/50 rounded-l-2xl">
                          <span className={`text-sm font-bold ${state.completed ? 'text-stone-400' : 'text-stone-700'}`}>
                            {routine.time}
                          </span>
                          <span className="text-[10px] font-medium text-stone-400 mt-1">
                            {routine.duration}m
                          </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            {isSlot && !isFilled ? (
                              <button
                                onClick={() => handleSlotClick(routine.id)}
                                className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                              >
                                <Plus size={18} />
                                <span className="font-medium text-sm">Fill this slot from tasks</span>
                              </button>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`font-medium text-base truncate ${
                                  state.completed ? 'text-stone-500 line-through' : 'text-stone-800'
                                }`}>
                                  {isSlot ? (state.customText ? state.customText : (filledTask?.name || "Unknown Task")) : routine.title}
                                </span>
                                {isSlot && (
                                  <span className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {state.customText ? 'Custom Routine' : 'Loaded from weekly tasks'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isFilled && !state.completed && (
                              <button
                                onClick={() => handleClearSlot(routine.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Clear slot"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {(!isSlot || isFilled) && (
                              <button
                                onClick={() => handleToggleComplete(routine.id, state.completed)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  state.completed
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-stone-100 text-stone-400 hover:bg-indigo-50 hover:text-indigo-500'
                                }`}
                              >
                                {state.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Section */}
            {groupedRoutines.Afternoon.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  Afternoon
                </h3>
                <div className="space-y-3">
                  {groupedRoutines.Afternoon.map(routine => {
                    const stateId = `${todayStr}_${routine.id}`;
                    const state = store.dailyRoutines[stateId] || { completed: false, filledTaskId: null, customText: null };
                    const isSlot = routine.type === 'slot';
                    const isFilled = isSlot && (state.filledTaskId || state.customText);
                    const filledTask = isFilled && state.filledTaskId ? store.tasks.find(t => t.id === state.filledTaskId) : null;
                    
                    return (
                      <div 
                        key={routine.id}
                        className={`group relative flex items-stretch bg-white rounded-2xl border transition-all duration-200 ${
                          state.completed 
                            ? 'border-stone-200 opacity-60 bg-stone-50/50' 
                            : isSlot && !isFilled
                              ? 'border-indigo-200 shadow-sm hover:border-indigo-300'
                              : 'border-stone-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 border-r border-stone-100 bg-stone-50/50 rounded-l-2xl">
                          <span className={`text-sm font-bold ${state.completed ? 'text-stone-400' : 'text-stone-700'}`}>
                            {routine.time}
                          </span>
                          <span className="text-[10px] font-medium text-stone-400 mt-1">
                            {routine.duration}m
                          </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            {isSlot && !isFilled ? (
                              <button
                                onClick={() => handleSlotClick(routine.id)}
                                className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                              >
                                <Plus size={18} />
                                <span className="font-medium text-sm">Fill this slot from tasks</span>
                              </button>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`font-medium text-base truncate ${
                                  state.completed ? 'text-stone-500 line-through' : 'text-stone-800'
                                }`}>
                                  {isSlot ? (state.customText ? state.customText : (filledTask?.name || "Unknown Task")) : routine.title}
                                </span>
                                {isSlot && (
                                  <span className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {state.customText ? 'Custom Routine' : 'Loaded from weekly tasks'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isFilled && !state.completed && (
                              <button
                                onClick={() => handleClearSlot(routine.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Clear slot"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {(!isSlot || isFilled) && (
                              <button
                                onClick={() => handleToggleComplete(routine.id, state.completed)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  state.completed
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-stone-100 text-stone-400 hover:bg-indigo-50 hover:text-indigo-500'
                                }`}
                              >
                                {state.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evening Section */}
            {groupedRoutines.Evening.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  Evening
                </h3>
                <div className="space-y-3">
                  {groupedRoutines.Evening.map(routine => {
                    const stateId = `${todayStr}_${routine.id}`;
                    const state = store.dailyRoutines[stateId] || { completed: false, filledTaskId: null, customText: null };
                    const isSlot = routine.type === 'slot';
                    const isFilled = isSlot && (state.filledTaskId || state.customText);
                    const filledTask = isFilled && state.filledTaskId ? store.tasks.find(t => t.id === state.filledTaskId) : null;
                    
                    return (
                      <div 
                        key={routine.id}
                        className={`group relative flex items-stretch bg-white rounded-2xl border transition-all duration-200 ${
                          state.completed 
                            ? 'border-stone-200 opacity-60 bg-stone-50/50' 
                            : isSlot && !isFilled
                              ? 'border-indigo-200 shadow-sm hover:border-indigo-300'
                              : 'border-stone-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 border-r border-stone-100 bg-stone-50/50 rounded-l-2xl">
                          <span className={`text-sm font-bold ${state.completed ? 'text-stone-400' : 'text-stone-700'}`}>
                            {routine.time}
                          </span>
                          <span className="text-[10px] font-medium text-stone-400 mt-1">
                            {routine.duration}m
                          </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            {isSlot && !isFilled ? (
                              <button
                                onClick={() => handleSlotClick(routine.id)}
                                className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                              >
                                <Plus size={18} />
                                <span className="font-medium text-sm">Fill this slot from tasks</span>
                              </button>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`font-medium text-base truncate ${
                                  state.completed ? 'text-stone-500 line-through' : 'text-stone-800'
                                }`}>
                                  {isSlot ? (state.customText ? state.customText : (filledTask?.name || "Unknown Task")) : routine.title}
                                </span>
                                {isSlot && (
                                  <span className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {state.customText ? 'Custom Routine' : 'Loaded from weekly tasks'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isFilled && !state.completed && (
                              <button
                                onClick={() => handleClearSlot(routine.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Clear slot"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {(!isSlot || isFilled) && (
                              <button
                                onClick={() => handleToggleComplete(routine.id, state.completed)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  state.completed
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-stone-100 text-stone-400 hover:bg-indigo-50 hover:text-indigo-500'
                                }`}
                              >
                                {state.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedSlotId && (
        <SlotSelectionModal
          tasks={availableTasks}
          onSelect={handleFillSlot}
          onClose={() => setSelectedSlotId(null)}
        />
      )}
    </div>
  );
}
