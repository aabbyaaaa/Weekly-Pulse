import React, { useState, useEffect } from 'react';
import { X, HeartPulse, Battery, Brain, Zap, Coffee, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlaybookCategory = 'focus' | 'energy' | 'dopamine' | 'emotion' | 'procrastination' | 'discipline' | 'sleep' | 'nutrition' | 'decision' | 'firstaid';

interface Playbook {
  id: string;
  category: PlaybookCategory;
  title: string;
  trigger: string;
  action: string;
  interactiveType?: 'timer' | 'slider' | 'breathing' | 'step-by-step' | 'random';
}

const PLAYBOOKS: Playbook[] = [
  // 1. Focus
  { id: 'f1', category: 'focus', title: '最小啟動法', trigger: '看著龐大的任務，覺得心很累不想動。', action: '寫下「接下來 10 分鐘我只做＿＿」，然後只執行最小步驟，做完就可以停。', interactiveType: 'timer' },
  { id: 'f2', category: 'focus', title: '10 秒分心救援', trigger: '工作到一半，發現自己不自覺拿起了手機。', action: '(1) 深呼吸一次 (2) 放下手機 (3) 告訴自己回到上一個「最小步驟」。', interactiveType: 'timer' },
  { id: 'f3', category: 'focus', title: '大腦暫存區', trigger: '專注時，腦袋突然冒出雜念。', action: '不切換視窗，立刻寫在旁邊的紙上或備忘錄，然後馬上回到原任務。' },
  // 2. Energy
  { id: 'e1', category: 'energy', title: '30 秒精力盤點', trigger: '準備開始工作，或切換任務的空檔。', action: '快速為自己現在的狀態打分。總分高做創作；總分低做行政庶務。', interactiveType: 'slider' },
  { id: 'e2', category: 'energy', title: '下午低谷急救', trigger: '下午 2-4 點覺得昏沉、眼皮沉重。', action: '禁止立刻喝咖啡。先離開座位走動 2 分鐘、喝一杯水、伸展一下。' },
  // 3. Dopamine
  { id: 'd1', category: 'dopamine', title: '20 秒衝動煞車', trigger: '極度渴望打開社群軟體或想吃零食的瞬間。', action: '告訴自己「可以看/可以吃，但要先等 20 秒」。', interactiveType: 'timer' },
  { id: 'd2', category: 'dopamine', title: 'If-Then 誘惑轉移', trigger: '知道自己即將進入容易分心的環境。', action: '在心裡設定一句話：「如果我想滑手機，我就先站起來喝一口水」。' },
  // 4. Emotion
  { id: 'em1', category: 'emotion', title: '生理性降噪 (嘆息)', trigger: '感到焦慮、心跳加快、煩躁，大腦進入威脅模式。', action: '做 2-3 次「生理性嘆息」（吸氣、再補吸一小口、慢慢吐長氣）。', interactiveType: 'breathing' },
  { id: 'em2', category: 'emotion', title: '壓力再評估', trigger: '覺得壓力大到卡住、覺得自己做不到。', action: '對自己唸出：「我現在緊張，表示我很在乎」、「我現在卡住，表示任務要拆得更小」。' },
  { id: 'em3', category: 'emotion', title: '慢呼吸 90 秒', trigger: '心跳稍微偏快，需要平復心情時。', action: '吸氣 4–5 秒，吐氣 5–6 秒，做 6–10 回。', interactiveType: 'breathing' },
  // 5. Procrastination
  { id: 'p1', category: 'procrastination', title: '10 分鐘微縮版', trigger: '任務太難或太無聊，一直逃避不想開始。', action: '告訴自己「我不要做完，我只要推進 10 分鐘就好」，時間一到就算勝利。', interactiveType: 'timer' },
  { id: 'p2', category: 'procrastination', title: '有計畫的暫停', trigger: '做到一半卡關，覺得痛苦想放棄去滑手機。', action: '可以停下來，但在離開前，必須寫下「下次回來時，我要做的第一步是什麼」。' },
  // 6. Discipline
  { id: 'di1', category: 'discipline', title: '2 分鐘縮水版', trigger: '今天特別累、特別忙，原本設定的習慣做不到。', action: '啟動 2 分鐘版本（如：只做 1 分鐘伸展）。重點是「保持紀錄不斷」。' },
  // 7. Sleep
  { id: 's1', category: 'sleep', title: '睡前大腦清空', trigger: '躺在床上，腦袋一直轉明天的待辦事項或今天的煩惱。', action: '拿紙筆，把所有擔心的事情和明天要做的事全部寫下來。' },
  { id: 's2', category: 'sleep', title: '20 分鐘離床法則', trigger: '躺在床上翻來覆去超過 20-30 分鐘都睡不著。', action: '立刻起床離開臥室，去昏暗的地方做低刺激活動，直到有睡意再回床上。' },
  // 8. Nutrition
  { id: 'n1', category: 'nutrition', title: '防腦霧進食法', trigger: '準備吃正餐，特別是午餐時。', action: '嚴格執行進食順序：「先吃蔬菜 ➡️ 再吃蛋白質 ➡️ 最後吃澱粉」。' },
  // 9. Decision
  { id: 'de1', category: 'decision', title: 'HALT 決策檢查', trigger: '準備做重大決定、想要發脾氣、或想衝動購物時。', action: '檢查自己現在是否處於 Hungry(餓)、Angry(氣)、Lonely(孤單)、Tired(累) 的狀態。' },
  // 10. First Aid
  { id: 'fa1', category: 'firstaid', title: '5-4-3-2-1 接地法', trigger: '急性焦慮、恐慌發作、思緒完全失控被捲走時。', action: '尋找：5 個看得到的東西、4 個摸得到的東西、3 個聽到的聲音、2 個聞到的味道、1 個嚐到的味道。', interactiveType: 'step-by-step' },
  { id: 'fa2', category: 'firstaid', title: '終止反芻', trigger: '一直陷入自我否定、覺得自己很糟的無限迴圈。', action: '(1) 發現並命名：「我又在反芻了」。(2) 強制轉移：立刻去做一件需要物理動手的瑣事。', interactiveType: 'random' },
  { id: 'fa3', category: 'firstaid', title: '箱式呼吸', trigger: '面臨極大壓力、恐慌，需要迅速找回控制感。', action: '吸氣 4 秒、憋氣 4 秒、吐氣 4 秒、憋氣 4 秒，做 3–4 輪；若太難可改 2 秒。', interactiveType: 'breathing' },
];

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [activeCategory, setActiveCategory] = useState<PlaybookCategory | 'all'>('all');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  // Interaction States
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [energyScores, setEnergyScores] = useState({ sleep: 5, stress: 5, hunger: 5, emotion: 5 });
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'holdEmpty'>('idle');
  const [groundingStep, setGroundingStep] = useState(0);
  const [randomTask, setRandomTask] = useState('');

  // Reset states when modal closes or playbook changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlaybook(null);
      setActiveCategory('all');
    }
    setTimer(0);
    setTimerActive(false);
    setBreathingPhase('idle');
    setGroundingStep(0);
    setRandomTask('');
  }, [isOpen, selectedPlaybook]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Breathing Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!selectedPlaybook || selectedPlaybook.interactiveType !== 'breathing' || breathingPhase === 'idle') return;

    const type = selectedPlaybook.title.includes('箱式') ? 'box' : 
                 selectedPlaybook.title.includes('慢呼吸') ? 'slow' : 'sigh';

    if (type === 'box') {
      if (breathingPhase === 'inhale') {
        timeout = setTimeout(() => setBreathingPhase('hold'), 4000);
      } else if (breathingPhase === 'hold') {
        timeout = setTimeout(() => setBreathingPhase('exhale'), 4000);
      } else if (breathingPhase === 'exhale') {
        timeout = setTimeout(() => setBreathingPhase('holdEmpty'), 4000);
      } else if (breathingPhase === 'holdEmpty') {
        timeout = setTimeout(() => setBreathingPhase('inhale'), 4000);
      }
    } else if (type === 'slow') {
      if (breathingPhase === 'inhale') {
        timeout = setTimeout(() => setBreathingPhase('exhale'), 4500);
      } else if (breathingPhase === 'exhale') {
        timeout = setTimeout(() => setBreathingPhase('inhale'), 5500);
      }
    } else { // sigh
      if (breathingPhase === 'inhale') {
        timeout = setTimeout(() => setBreathingPhase('hold'), 4000);
      } else if (breathingPhase === 'hold') {
        timeout = setTimeout(() => setBreathingPhase('exhale'), 1000);
      } else if (breathingPhase === 'exhale') {
        timeout = setTimeout(() => setBreathingPhase('inhale'), 6000);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [breathingPhase, selectedPlaybook]);

  if (!isOpen) return null;

  const filteredPlaybooks = activeCategory === 'all' 
    ? PLAYBOOKS 
    : PLAYBOOKS.filter(p => p.category === activeCategory);

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    setTimerActive(true);
  };

  const startBreathing = () => {
    setBreathingPhase('inhale');
  };

  const generateRandomTask = () => {
    const tasks = ['去洗把臉', '喝一大杯水', '原地跳 10 下', '去摸摸牆壁的材質', '把桌上的筆排整齊'];
    setRandomTask(tasks[Math.floor(Math.random() * tasks.length)]);
  };

  const renderInteractiveArea = (playbook: Playbook) => {
    switch (playbook.interactiveType) {
      case 'timer':
        const isMinutes = playbook.title.includes('分鐘');
        const defaultTime = isMinutes ? 10 * 60 : (playbook.title.includes('20 秒') ? 20 : 10);
        return (
          <div className="mt-6 p-6 bg-stone-50 rounded-2xl flex flex-col items-center">
            <div className="text-4xl font-mono font-bold text-stone-800 mb-4">
              {isMinutes 
                ? `${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`
                : timer}
            </div>
            {!timerActive && timer === 0 ? (
              <button 
                onClick={() => startTimer(defaultTime)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full"
              >
                開始計時
              </button>
            ) : (
              <button 
                onClick={() => setTimerActive(false)}
                className="px-6 py-3 bg-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-300 transition-colors w-full"
              >
                暫停
              </button>
            )}
          </div>
        );
      case 'slider':
        const scores = Object.values(energyScores) as number[];
        const totalScore: number = scores.reduce((a: number, b: number) => a + b, 0);
        return (
          <div className="mt-6 p-4 bg-stone-50 rounded-2xl space-y-4">
            {Object.entries(energyScores).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span className="capitalize">{key === 'stress' ? '壓力 (低->高)' : key}</span>
                  <span>{value}/10</span>
                </div>
                <input 
                  type="range" min="0" max="10" value={value}
                  onChange={(e) => setEnergyScores({...energyScores, [key]: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
            ))}
            <div className="pt-4 border-t border-stone-200 text-center">
              <div className="text-sm text-stone-500 mb-1">總分: {totalScore}/40</div>
              <div className="font-bold text-indigo-700">
                {totalScore > 25 ? '🔥 狀態不錯！去解決困難任務' : '🔋 沒電了，只准做無腦整理'}
              </div>
            </div>
          </div>
        );
      case 'breathing':
        const type = playbook.title.includes('箱式') ? 'box' : 
                     playbook.title.includes('慢呼吸') ? 'slow' : 'sigh';
        
        return (
          <div className="mt-6 p-8 bg-stone-50 rounded-2xl flex flex-col items-center justify-center min-h-[200px]">
            {breathingPhase === 'idle' ? (
              <button 
                onClick={startBreathing}
                className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center hover:bg-indigo-200 transition-colors"
              >
                開始
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                  <div className={`absolute rounded-full bg-indigo-200 transition-all duration-1000 ease-in-out
                    ${breathingPhase === 'inhale' ? 'w-32 h-32 opacity-50' : ''}
                    ${breathingPhase === 'hold' ? 'w-32 h-32 opacity-80' : ''}
                    ${breathingPhase === 'exhale' ? 'w-16 h-16 opacity-30' : ''}
                    ${breathingPhase === 'holdEmpty' ? 'w-16 h-16 opacity-80' : ''}
                  `} />
                  <div className="relative z-10 font-bold text-indigo-800 text-center">
                    {breathingPhase === 'inhale' && '吸氣...'}
                    {breathingPhase === 'hold' && (type === 'sigh' ? '再吸一口!' : '憋氣...')}
                    {breathingPhase === 'exhale' && '慢慢吐氣...'}
                    {breathingPhase === 'holdEmpty' && '憋氣...'}
                  </div>
                </div>
                <button 
                  onClick={() => setBreathingPhase('idle')}
                  className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  停止
                </button>
              </div>
            )}
          </div>
        );
      case 'step-by-step':
        const steps = [
          { count: 5, text: '看得到的東西' },
          { count: 4, text: '摸得到的東西' },
          { count: 3, text: '聽到的聲音' },
          { count: 2, text: '聞到的味道' },
          { count: 1, text: '嚐到的味道' },
        ];
        return (
          <div className="mt-6 p-6 bg-stone-50 rounded-2xl text-center">
            {groundingStep < steps.length ? (
              <>
                <div className="text-4xl font-bold text-indigo-600 mb-2">{steps[groundingStep].count}</div>
                <div className="text-lg text-stone-700 mb-6">尋找 {steps[groundingStep].count} 個{steps[groundingStep].text}</div>
                <button 
                  onClick={() => setGroundingStep(prev => prev + 1)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full"
                >
                  找到了
                </button>
              </>
            ) : (
              <div className="text-emerald-600 font-bold flex flex-col items-center gap-2">
                <CheckCircle2 size={32} />
                <span>完成接地，歡迎回來。</span>
                <button onClick={() => setGroundingStep(0)} className="mt-4 text-sm text-stone-500 underline">再做一次</button>
              </div>
            )}
          </div>
        );
      case 'random':
        return (
          <div className="mt-6 p-6 bg-stone-50 rounded-2xl text-center">
            {randomTask ? (
              <>
                <div className="text-xl font-bold text-rose-600 mb-6">{randomTask}</div>
                <button 
                  onClick={generateRandomTask}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-300 transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw size={14} /> 換一個
                </button>
              </>
            ) : (
              <button 
                onClick={generateRandomTask}
                className="px-6 py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors w-full flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
              >
                <AlertCircle size={20} /> 抽一個打斷任務
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <HeartPulse size={20} />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">SOS 應急錦囊</h2>
              <p className="text-xs text-stone-500">大腦當機時的急救包</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
          {selectedPlaybook ? (
            // Detail View
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setSelectedPlaybook(null)}
                className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" /> 返回列表
              </button>
              
              <div className="mb-8">
                <span className="inline-block px-2 py-1 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider rounded mb-3">
                  {selectedPlaybook.category}
                </span>
                <h3 className="text-2xl font-bold text-stone-800 mb-4">{selectedPlaybook.title}</h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="text-xs font-bold text-rose-800 mb-1 flex items-center gap-1"><AlertCircle size={12}/> 觸發情境</div>
                    <div className="text-sm text-rose-900">{selectedPlaybook.trigger}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1"><Zap size={12}/> 立即行動</div>
                    <div className="text-sm text-indigo-900">{selectedPlaybook.action}</div>
                  </div>
                </div>

                {renderInteractiveArea(selectedPlaybook)}
              </div>
            </div>
          ) : (
            // List View
            <>
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button 
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  全部
                </button>
                <button onClick={() => setActiveCategory('firstaid')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'firstaid' ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>🚨 急救</button>
                <button onClick={() => setActiveCategory('focus')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'focus' ? 'bg-indigo-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>🎯 專注</button>
                <button onClick={() => setActiveCategory('energy')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'energy' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>🔋 精力</button>
                <button onClick={() => setActiveCategory('emotion')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'emotion' ? 'bg-teal-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>🌊 情緒</button>
              </div>

              {/* Playbook List */}
              <div className="space-y-3">
                {filteredPlaybooks.map(playbook => (
                  <button
                    key={playbook.id}
                    onClick={() => setSelectedPlaybook(playbook)}
                    className="w-full text-left p-4 rounded-2xl border border-stone-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-stone-800 group-hover:text-indigo-600 transition-colors">{playbook.title}</h4>
                      {playbook.interactiveType && (
                        <span className="w-6 h-6 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-500">
                          <Zap size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-1">{playbook.trigger}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
