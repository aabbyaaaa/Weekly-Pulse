import React, { useState } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { Task } from '../types';

interface SlotSelectionModalProps {
  tasks: Task[];
  onSelect: (taskId: string | null, customText?: string | null) => void;
  onClose: () => void;
}

export function SlotSelectionModal({ tasks, onSelect, onClose }: SlotSelectionModalProps) {
  const [customText, setCustomText] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim()) {
      onSelect(null, customText.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 z-50 flex flex-col justify-end backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-t-3xl p-6 h-[70%] flex flex-col animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-stone-800">Fill Slot</h2>
          <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
            <X size={16} />
          </button>
        </div>

        {/* Custom Input */}
        <div className="mb-6">
          <p className="text-xs font-medium text-stone-500 mb-2">輸入自訂內容：</p>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="輸入自訂內容..."
              className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
            <button 
              type="submit"
              disabled={!customText.trim()}
              className="bg-indigo-600 text-white px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <Check size={18} />
            </button>
          </form>
        </div>

        <div className="relative flex items-center py-2 mb-4">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-medium uppercase tracking-wider">OR</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        <p className="text-xs font-medium text-stone-500 mb-2">選擇現有 Task：</p>
        
        <div className="space-y-2 overflow-y-auto hide-scrollbar flex-1 pb-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No active tasks available.</p>
          ) : (
            tasks.map(task => (
              <button 
                key={task.id}
                className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-between group" 
                onClick={() => onSelect(task.id)}
              >
                <div>
                  <h3 className="font-medium text-stone-800 group-hover:text-indigo-700 transition-colors">{task.name}</h3>
                  <p className="text-xs text-stone-500 mt-1">{task.category}</p>
                </div>
                <ChevronRight size={16} className="text-stone-400 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
