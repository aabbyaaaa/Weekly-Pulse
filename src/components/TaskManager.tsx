import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Activity, ShieldAlert, Check, Archive, ArchiveRestore } from "lucide-react";
import { TaskType, CategoryDef } from "../types";
import { COLOR_OPTIONS, getCategoryColorClasses } from "../utils/colors";

export default function TaskManager({ store }: any) {
  const [activeTab, setActiveTab] = useState<"tasks" | "categories">("tasks");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage</h2>
      </div>

      <div className="flex bg-stone-200 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "tasks" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "categories" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === "tasks" ? (
        <TasksTab store={store} />
      ) : (
        <CategoriesTab store={store} />
      )}
    </motion.div>
  );
}

function TasksTab({ store }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(3);
  const [category, setCategory] = useState<string>(store.categories[0]?.id || "health");
  const [type, setType] = useState<TaskType>("target");
  const [taskFilter, setTaskFilter] = useState<"active" | "archived">("active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.addTask({ name: name.trim(), goal, category, type, archived: false });
    setName("");
    setGoal(3);
    setCategory(store.categories[0]?.id || "health");
    setType("target");
    setIsAdding(false);
  };

  const filteredTasks = store.tasks.filter((task: any) => {
    if (taskFilter === "active") return !task.archived;
    return task.archived;
  });

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-stone-200">
        <button
          onClick={() => setTaskFilter("active")}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            taskFilter === "active" ? "text-indigo-600" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Active
          {taskFilter === "active" && (
            <motion.div layoutId="taskFilterIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setTaskFilter("archived")}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            taskFilter === "archived" ? "text-indigo-600" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Archived
          {taskFilter === "archived" && (
            <motion.div layoutId="taskFilterIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      {taskFilter === "active" && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Add New Task
        </button>
      )}

      {isAdding && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-6">
          <h3 className="font-semibold mb-4">New Task</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-stone-500 mb-2">
                What kind of habit is this?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("target")}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    type === "target"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  <Activity size={20} />
                  <span className="font-semibold text-sm">Build Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("limit")}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    type === "limit"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  <ShieldAlert size={20} />
                  <span className="font-semibold text-sm">Limit Habit</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'target' ? "e.g. Wash hair, Run 5k" : "e.g. Drink soda, Late night snack"}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Weekly {type === 'limit' ? 'Limit' : 'Goal'}
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "time" : "times"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {store.categories.map((cat: CategoryDef) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 font-medium rounded-xl hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-sm">
            {taskFilter === "active" ? "No active tasks. Add one above!" : "No archived tasks yet."}
          </div>
        ) : (
          filteredTasks.map((task: any) => {
            const catDef = store.categories.find((c: any) => c.id === task.category);
            return (
              <TaskListItem 
                key={task.id} 
                task={task} 
                categoryDef={catDef} 
                onDelete={store.deleteTask}
                onToggleArchive={() => store.toggleArchiveTask(task.id, task.archived)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function TaskListItem({ task, categoryDef, onDelete, onToggleArchive }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catName = categoryDef?.name || 'Unknown';
  const ArchiveIcon = task.archived ? ArchiveRestore : Archive;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-stone-800">{task.name}</h4>
          {task.type === 'limit' ? (
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Limit</span>
          ) : (
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Build</span>
          )}
          {task.archived && (
            <span className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Archived</span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          {task.type === 'limit' ? 'Max' : 'Goal'}: {task.goal} times/week •{" "}
          <span className="capitalize">{catName}</span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-medium text-stone-500 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs font-medium text-white bg-red-500 px-3 py-1.5 rounded-lg"
            >
              Delete
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onToggleArchive}
              className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title={task.archived ? "Restore Task" : "Archive Task"}
            >
              <ArchiveIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CategoriesTab({ store }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.addCategory({ name: name.trim(), color });
    setName("");
    setColor(COLOR_OPTIONS[0].id);
    setIsAdding(false);
  };

  return (
    <div>
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Add New Category
        </button>
      )}

      {isAdding && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-6">
          <h3 className="font-semibold mb-4">New Category</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diet, Finance, Chores"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-2">
                Color Label
              </label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                      color === c.id ? "ring-2 ring-offset-2 ring-stone-800 scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.id && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 font-medium rounded-xl hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {store.categories.map((cat: CategoryDef) => {
          const activeTaskCount = store.tasks.filter((t: any) => t.category === cat.id && !t.archived).length;
          const totalTaskCount = store.tasks.filter((t: any) => t.category === cat.id).length;
          return (
            <CategoryListItem 
              key={cat.id} 
              category={cat} 
              activeTaskCount={activeTaskCount} 
              totalTaskCount={totalTaskCount}
              onDelete={store.deleteCategory} 
            />
          );
        })}
      </div>
    </div>
  );
}

function CategoryListItem({ category, activeTaskCount, totalTaskCount, onDelete }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorClasses = getCategoryColorClasses(category.color);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLOR_OPTIONS.find(c => c.id === category.color)?.hex }} />
        <div>
          <h4 className="font-medium text-stone-800">{category.name}</h4>
          <p className="text-xs text-stone-500 mt-0.5">
            {activeTaskCount} active {activeTaskCount === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      </div>
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs font-medium text-stone-500 px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="text-xs font-medium text-white bg-red-500 px-3 py-1.5 rounded-lg"
            disabled={totalTaskCount > 0}
            title={totalTaskCount > 0 ? "Cannot delete category with existing tasks (including archived)" : ""}
          >
            Delete
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className={`p-2 rounded-lg transition-colors ${totalTaskCount > 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
          disabled={totalTaskCount > 0}
          title={totalTaskCount > 0 ? "Cannot delete category with existing tasks (including archived)" : ""}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
