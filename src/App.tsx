/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useStore } from "./hooks/useStore";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import TaskManager from "./components/TaskManager";
import DailyRoutine from "./components/DailyRoutine";
import {
  LayoutDashboard,
  History as HistoryIcon,
  Settings,
  LogOut,
  Loader2,
  Activity,
  Clock
} from "lucide-react";
import { Toaster } from 'sonner';
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainApp user={user} />;
}

function LoginScreen() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-100 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Weekly Pulse</h1>
        <p className="text-stone-500 mb-8">Track your habits gently and consistently.</p>
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function MainApp({ user }: { user: User }) {
  const store = useStore(user);
  const [activeTab, setActiveTab] = useState<"dashboard" | "routine" | "history" | "tasks">("routine");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = store.categories || [];

  const getCategoryCount = (catId: string) => {
    const activeTasks = store.tasks.filter((t: any) => !t.archived);
    if (catId === 'all') return activeTasks.length;
    return activeTasks.filter((t: any) => t.category === catId).length;
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-indigo-600">
            Weekly Pulse
          </h1>
          <button onClick={() => signOut(auth)} className="text-stone-400 hover:text-stone-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen sticky top-0 p-6 shrink-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">Weekly Pulse</h1>
        </div>
        
        <div className="space-y-1 mb-8">
          <SidebarButton icon={<Clock size={18} />} label="Daily Routine" isActive={activeTab === "routine"} onClick={() => setActiveTab("routine")} />
          <SidebarButton icon={<LayoutDashboard size={18} />} label="Weekly Tasks" isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <SidebarButton icon={<HistoryIcon size={18} />} label="History" isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <SidebarButton icon={<Settings size={18} />} label="Manage Tasks" isActive={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} />
        </div>

        {activeTab === 'dashboard' && (
          <>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-3">Categories</h3>
            <nav className="space-y-1 flex-1 overflow-y-auto hide-scrollbar">
              <CategoryButton 
                label="All Tasks" 
                count={getCategoryCount('all')} 
                isActive={activeCategory === 'all'} 
                onClick={() => setActiveCategory('all')} 
              />
              {categories.map(cat => {
                const count = getCategoryCount(cat.id);
                if (count === 0) return null;
                return (
                  <CategoryButton 
                    key={cat.id}
                    label={cat.name} 
                    count={count} 
                    isActive={activeCategory === cat.id} 
                    onClick={() => setActiveCategory(cat.id)} 
                  />
                );
              })}
            </nav>
          </>
        )}

        <div className="mt-auto pt-6 border-t border-stone-100">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 w-full px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full overflow-x-hidden">
        {activeTab === "routine" && <DailyRoutine store={store} />}
        {activeTab === "dashboard" && <Dashboard store={store} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />}
        {activeTab === "history" && <History store={store} />}
        {activeTab === "tasks" && <TaskManager store={store} />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-stone-200 pb-safe z-50">
        <div className="flex justify-around p-2">
          <NavButton icon={<Clock />} label="Routine" isActive={activeTab === "routine"} onClick={() => setActiveTab("routine")} />
          <NavButton icon={<LayoutDashboard />} label="Tasks" isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <NavButton icon={<HistoryIcon />} label="History" isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <NavButton icon={<Settings />} label="Manage" isActive={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} />
        </div>
      </nav>
      <Toaster position="bottom-center" className="mb-16 md:mb-4" />
    </div>
  );
}

function SidebarButton({ icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
        isActive ? "bg-indigo-50 text-indigo-700" : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CategoryButton({ label, count, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
        isActive ? "bg-indigo-50 text-indigo-700" : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs py-0.5 px-2 rounded-full ${isActive ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-500"}`}>
        {count}
      </span>
    </button>
  );
}

function NavButton({ icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
        isActive ? "text-indigo-600" : "text-stone-400 hover:text-stone-600"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );
}
