import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart, 
  LogOut, 
  Trash2,
  ChevronRight,
  Wallet,
  Plus,
  Save,
  ArrowLeft,
  GripVertical,
  Check,
  Moon,
  Sun
} from 'lucide-react';

const WEBHOOK_LOGIN = 'https://complexo111.app.n8n.cloud/webhook/login';
const WEBHOOK_CRIAR_SESSAO = 'https://complexo111.app.n8n.cloud/webhook/template/criar-sessao';
const WEBHOOK_ADICIONAR_ITEM = 'https://complexo111.app.n8n.cloud/webhook/template/adicionar-item';
const WEBHOOK_DELETAR_SESSAO = 'https://complexo111.app.n8n.cloud/webhook/template/deletar-sessao';
const WEBHOOK_DELETAR_ITEM = 'https://complexo111.app.n8n.cloud/webhook/template/deletar-item';
const BASE_URL = 'https://complexo111.app.n8n.cloud/webhook';

type Screen = 'login' | 'home' | 'template' | 'listaMes' | 'compra';

interface TemplateItem {
  id: string;
  nome: string;
}

interface ItemCompra {
  id: string;
  nome: string;
  comprado: boolean;
  preco: number;
}

export default function App() {
  // Global State
  const [screen, setScreen] = useState<Screen>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  // Persistence: Check for saved session on mount
  React.useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  React.useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedEmail = localStorage.getItem('email');
    if (savedUserId && savedEmail) {
      setUserId(savedUserId);
      setEmail(savedEmail);
      carregarTemplateDoBackend(savedUserId);
      setScreen('home');
    }
  }, []);

  // Data State
  const [template, setTemplate] = useState<Record<string, TemplateItem[]>>({});
  const [listaDoMes, setListaDoMes] = useState<Record<string, ItemCompra[]> | null>(null);
  const [mesReferencia, setMesReferencia] = useState('');
  const [selectedForMonth, setSelectedForMonth] = useState<Record<string, TemplateItem[]>>({});

  // UI State for Monthly List
  const [showMonthPrompt, setShowMonthPrompt] = useState(false);
  const [tempMonth, setTempMonth] = useState('');

  // Persistence for listaDoMes and mesReferencia (User-specific)
  React.useEffect(() => {
    if (userId) {
      const savedList = localStorage.getItem(`listaDoMes_${userId}`);
      const savedMonth = localStorage.getItem(`mesReferencia_${userId}`);
      if (savedList) setListaDoMes(JSON.parse(savedList));
      if (savedMonth) setMesReferencia(savedMonth);
    }
  }, [userId]);

  React.useEffect(() => {
    if (userId && listaDoMes) {
      localStorage.setItem(`listaDoMes_${userId}`, JSON.stringify(listaDoMes));
    } else if (userId) {
      localStorage.removeItem(`listaDoMes_${userId}`);
    }
  }, [listaDoMes, userId]);

  React.useEffect(() => {
    if (userId && mesReferencia) {
      localStorage.setItem(`mesReferencia_${userId}`, mesReferencia);
    } else if (userId) {
      localStorage.removeItem(`mesReferencia_${userId}`);
    }
  }, [mesReferencia, userId]);

  // UI State for Template Creation
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState('');

  // Backend Integration Functions
  const carregarTemplateDoBackend = async (uid: string) => {
    console.log('carregarTemplateDoBackend - user_id:', uid);
    try {
      const response = await fetch(BASE_URL + "/template/buscar?user_id=" + uid);
      if (response.ok) {
        const data = await response.json();
        
        // Helper to convert strings to TemplateItem if needed
        const ensureItems = (items: any[]): TemplateItem[] => {
          return items.map(item => {
            if (typeof item === 'string') return { id: item, nome: item };
            return { id: item.id || item.nome, nome: item.nome };
          });
        };

        if (data.template) {
          const newTemplate: Record<string, TemplateItem[]> = {};
          Object.entries(data.template).forEach(([cat, items]) => {
            newTemplate[cat] = ensureItems(items as any[]);
          });
          setTemplate(newTemplate);
        } else if (typeof data === 'object' && !Array.isArray(data)) {
          const newTemplate: Record<string, TemplateItem[]> = {};
          Object.entries(data).forEach(([cat, items]) => {
            newTemplate[cat] = ensureItems(items as any[]);
          });
          setTemplate(newTemplate);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar template do backend:', error);
    }
  };

  const criarSessaoBackend = async (nomeSessao: string) => {
    console.log('criarSessaoBackend - user_id:', userId, 'categoria:', nomeSessao);
    if (!userId) return;
    try {
      await fetch(WEBHOOK_CRIAR_SESSAO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          categoria: nomeSessao
        })
      });
    } catch (error) {
      console.error('Error creating session in backend:', error);
    }
  };

  const criarItemBackend = async (categoria: string, item: TemplateItem) => {
    console.log('criarItemBackend - user_id:', userId, 'categoria:', categoria, 'item:', item);
    if (!userId) return;
    try {
      await fetch(WEBHOOK_ADICIONAR_ITEM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          item_id: item.id,
          categoria: categoria,
          item_nome: item.nome
        })
      });
    } catch (error) {
      console.error('Error creating item in backend:', error);
    }
  };

  const deletarSessaoBackend = async (nomeSessao: string) => {
    console.log('deletarSessaoBackend - user_id:', userId, 'categoria:', nomeSessao);
    if (!userId) return;
    try {
      await fetch(WEBHOOK_DELETAR_SESSAO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          categoria: nomeSessao
        })
      });
    } catch (error) {
      console.error('Error deleting session in backend:', error);
    }
  };

  const deletarItemBackend = async (item: TemplateItem) => {
    console.log('deletarItemBackend - user_id:', userId, 'item_id:', item.id);
    if (!userId) return;
    try {
      await fetch(WEBHOOK_DELETAR_ITEM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          item_id: item.id
        })
      });
    } catch (error) {
      console.error('Error deleting item in backend:', error);
    }
  };

  // Existing Login Logic (Adapted)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMsg({ type: 'info', text: 'Entrando...' });

    try {
      const response = await fetch(WEBHOOK_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (data.user_id) {
        setUserId(data.user_id);
        setLoginMsg({ type: 'success', text: '✅ Login realizado' });
        
        // Problem 1: Save to localStorage
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('email', email);

        // Carregar dados salvos do usuário (Equivalente ao iniciarApp solicitado)
        await carregarTemplateDoBackend(data.user_id);
        
        setScreen('home'); // mostrarHome()
      } else {
        setLoginMsg({ type: 'error', text: '❌ Email ou senha inválidos' });
      }
    } catch (error) {
      setLoginMsg({ type: 'error', text: 'Erro na conexão' });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUserId(null);
    setEmail('');
    setSenha('');
    setLoginMsg(null);
    setTemplate({});
    setListaDoMes(null);
    setMesReferencia('');
    setSelectedForMonth({});
    setShowMonthPrompt(false);
    setTempMonth('');
    
    // Problem 1: Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    // Note: We don't necessarily clear user-specific lists on logout 
    // to keep them for the next login, but we clear the current session state.

    setScreen('login');
  };

  // Template Logic
  const getEmojiForCategory = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('higiene') || lower.includes('banho')) return '🧼';
    if (lower.includes('limpeza')) return '🧹';
    if (lower.includes('comida') || lower.includes('alimento')) return '🍎';
    if (lower.includes('carne') || lower.includes('proteina')) return '🥩';
    if (lower.includes('bebida')) return '🥤';
    if (lower.includes('doce') || lower.includes('sobremesa')) return '🍫';
    if (lower.includes('fruta') || lower.includes('vegetal')) return '🥦';
    if (lower.includes('padaria') || lower.includes('pão')) return '🥖';
    if (lower.includes('pet')) return '🐾';
    return '📦';
  };

  const handleSaveSession = () => {
    if (newSessionName && !template[newSessionName]) {
      const emoji = getEmojiForCategory(newSessionName);
      const sessionWithEmoji = `${emoji} ${newSessionName}`;
      setTemplate(prev => ({ ...prev, [sessionWithEmoji]: [] }));
      criarSessaoBackend(sessionWithEmoji);
      setNewSessionName('');
      setIsAddingSession(false);
    }
  };

  const handleSaveItem = () => {
    if (newItemName && selectedCategoryForItem) {
      const newItem: TemplateItem = {
        id: Date.now().toString(),
        nome: newItemName
      };
      
      setTemplate(prev => ({
        ...prev,
        [selectedCategoryForItem]: [...(prev[selectedCategoryForItem] || []), newItem]
      }));

      criarItemBackend(selectedCategoryForItem, newItem);
      
      setNewItemName('');
    } else {
      alert("Por favor, preencha o nome do item e selecione uma categoria.");
    }
  };

  const handleDeleteSession = (sessionName: string) => {
    if (confirm(`Deseja excluir a sessão "${sessionName}" e todos os seus itens?`)) {
      setTemplate(prev => {
        const next = { ...prev };
        delete next[sessionName];
        return next;
      });
      deletarSessaoBackend(sessionName);
      
      if (selectedCategoryForItem === sessionName) {
        setSelectedCategoryForItem('');
      }
    }
  };

  const handleDeleteItem = (item: TemplateItem, fromSession: string) => {
    setTemplate(prev => ({
      ...prev,
      [fromSession]: prev[fromSession].filter(i => i.id !== item.id)
    }));
    deletarItemBackend(item);
  };

  const onDragStart = (e: React.DragEvent, item: TemplateItem, fromSession: string | null) => {
    // Drag and drop removed as per request, but keeping function signature to avoid breaking other parts if any
  };

  const onDrop = (e: React.DragEvent, toSession: string | null) => {
    // Drag and drop removed as per request
  };

  // Monthly List Logic
  const toggleSelection = (category: string, item: TemplateItem) => {
    setSelectedForMonth(prev => {
      const current = prev[category] || [];
      const exists = current.find(i => i.id === item.id);
      if (exists) {
        return { ...prev, [category]: current.filter(i => i.id !== item.id) };
      } else {
        return { ...prev, [category]: [...current, item] };
      }
    });
  };

  const concluirSelecao = () => {
    if (Object.keys(selectedForMonth).length === 0) {
      alert("Selecione pelo menos um item.");
      return;
    }
    setTempMonth(new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
    setShowMonthPrompt(true);
  };

  const confirmarListaDoMes = () => {
    if (!tempMonth) return;

    const newList: Record<string, ItemCompra[]> = {};
    (Object.entries(selectedForMonth) as [string, TemplateItem[]][]).forEach(([cat, items]) => {
      if (items.length > 0) {
        newList[cat] = items.map(item => ({ id: item.id, nome: item.nome, comprado: false, preco: 0 }));
      }
    });
    
    setMesReferencia(tempMonth);
    setListaDoMes(newList);
    setShowMonthPrompt(false);
    setScreen('compra');
  };

  // Purchase Logic
  const toggleComprado = (cat: string, index: number) => {
    if (!listaDoMes) return;
    const newList = { ...listaDoMes };
    newList[cat][index].comprado = !newList[cat][index].comprado;
    setListaDoMes(newList);
  };

  const updatePreco = (cat: string, index: number, val: string) => {
    if (!listaDoMes) return;
    const newList = { ...listaDoMes };
    newList[cat][index].preco = parseFloat(val) || 0;
    setListaDoMes(newList);
  };

  const totalCompra = useMemo(() => {
    if (!listaDoMes) return 0;
    let sum = 0;
    (Object.values(listaDoMes) as ItemCompra[][]).forEach(items => {
      items.forEach(item => {
        if (item.comprado) sum += item.preco;
      });
    });
    return sum;
  }, [listaDoMes]);

  // Render Helpers
  const renderLogin = () => (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-[#667eea] to-[#764ba2]'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-white/20'} p-8 rounded-[32px] shadow-2xl w-full max-w-md border`}
      >
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 ${darkMode ? 'bg-indigo-500' : 'bg-[#667eea]'} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
            <ShoppingCart className="text-white w-8 h-8" />
          </div>
          <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>🛒 Minha Lista</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 font-medium`}>Acesse sua lista inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-[#667eea] hover:bg-[#5563d1]'} text-white py-5 rounded-2xl font-black text-lg active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 mt-4`}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar na Lista'}
          </button>
        </form>

        <AnimatePresence>
          {loginMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 p-4 rounded-2xl text-center text-sm font-bold ${
                loginMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                loginMsg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
              }`}
            >
              {loginMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  const renderHome = () => (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#f4f6fb]'} p-6`}>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Início</h1>
            <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>O que vamos fazer hoje?</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-gray-800 text-amber-400' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button 
              onClick={handleLogout} 
              className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-500 shadow-sm border border-gray-100'}`}
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="grid gap-4">
          <button 
            onClick={() => setScreen('template')}
            className={`w-full ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-sm border flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] text-left`}
          >
            <div className={`w-14 h-14 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center`}>
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Criar Novo Template</h3>
              <p className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Defina suas sessões e itens base</p>
            </div>
          </button>

          <button 
            onClick={() => setScreen('listaMes')}
            className={`w-full ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-sm border flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] text-left`}
          >
            <div className={`w-14 h-14 ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center`}>
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Criar Lista do Mês</h3>
              <p className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Selecione o que precisa comprar</p>
            </div>
          </button>

          <button 
            onClick={() => setScreen('compra')}
            className={`w-full ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-sm border flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] text-left`}
          >
            <div className={`w-14 h-14 ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'} rounded-2xl flex items-center justify-center`}>
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Fazer Compra</h3>
              <p className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {mesReferencia ? `Lista ativa: ${mesReferencia}` : 'Acompanhe preços e total'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#f4f6fb]'} p-6 pb-32`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setScreen('home')} className={`p-3 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 shadow-sm'} rounded-2xl transition-all`}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Novo Template</h1>
        </div>

        {/* Global Item Addition Area */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-sm border mb-8`}>
          <p className={`text-[10px] uppercase font-black tracking-[0.2em] mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Adicionar Novo Item</p>
          <div className="space-y-4">
            <input 
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item (ex: Sabonete)"
              className={`w-full px-5 py-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold`}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={selectedCategoryForItem}
                onChange={(e) => setSelectedCategoryForItem(e.target.value)}
                className={`flex-1 px-5 py-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none`}
              >
                <option value="">Escolher Categoria</option>
                {Object.keys(template).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                onClick={handleSaveItem}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          <button 
            onClick={() => setIsAddingSession(true)} 
            className={`flex-1 ${darkMode ? 'bg-gray-900 border-indigo-500/50 text-indigo-400' : 'bg-white border-indigo-600 text-indigo-600'} border-2 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all`}
          >
            <Plus className="w-5 h-5" /> Nova Sessão
          </button>
        </div>

        {/* Inline Session Input */}
        <AnimatePresence>
          {isAddingSession && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-indigo-100'} p-5 rounded-[32px] border shadow-sm flex flex-col sm:flex-row gap-3`}>
                <input 
                  type="text"
                  autoFocus
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Nome da sessão (ex: Higiene)..."
                  className={`flex-1 px-5 py-3 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold`}
                />
                <button 
                  onClick={handleSaveSession}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/10"
                >
                  Salvar Sessão
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {/* Sessions */}
          {(Object.entries(template) as [string, TemplateItem[]][]).map(([session, items]) => (
            <div 
              key={session}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-[32px] shadow-sm border overflow-hidden`}
            >
              <div className={`${darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'} px-6 py-5 border-b flex justify-between items-center`}>
                <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-700'}`}>{session}</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{items.length} itens</span>
                  <button 
                    onClick={() => handleDeleteSession(session)}
                    className={`p-2 ${darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'} rounded-xl transition-all`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-50'}`}>
                {items.map(item => (
                  <div 
                    key={item.id}
                    className={`px-6 py-5 flex items-center justify-between group ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.nome}</span>
                    <button 
                      onClick={() => handleDeleteItem(item, session)}
                      className={`p-2 ${darkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'} transition-all`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="p-10 text-center">
                    <p className={`text-sm font-bold italic ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>Nenhum item nesta sessão</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 p-6 ${darkMode ? 'bg-gradient-to-t from-gray-950 to-transparent' : 'bg-gradient-to-t from-[#f4f6fb] to-transparent'}`}>
          <button 
            onClick={() => setScreen('home')}
            className="max-w-2xl mx-auto w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <Save className="w-6 h-6" /> Salvar Template
          </button>
        </div>
      </div>
    </div>
  );

  const renderListaMes = () => (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#f4f6fb]'} p-6 pb-32`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setScreen('home')} className={`p-3 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 shadow-sm'} rounded-2xl transition-all`}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Lista do Mês</h1>
        </div>

        {Object.keys(template).length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-10 rounded-[32px] text-center border shadow-sm`}>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-4 font-bold`}>Você ainda não criou um template.</p>
            <button onClick={() => setScreen('template')} className="text-indigo-500 font-black underline decoration-2 underline-offset-4">Criar Template agora</button>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(template) as [string, TemplateItem[]][]).map(([cat, items]) => (
              <div key={cat} className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{cat}</h3>
                <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-[32px] shadow-sm border overflow-hidden divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-50'}`}>
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleSelection(cat, item)}
                      className={`px-6 py-5 flex items-center justify-between cursor-pointer transition-all ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`font-bold text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.nome}</span>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                        selectedForMonth[cat]?.find(i => i.id === item.id) ? 'bg-indigo-600 border-indigo-600' : darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        {selectedForMonth[cat]?.find(i => i.id === item.id) && <Check className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`fixed bottom-0 left-0 right-0 p-6 ${darkMode ? 'bg-gradient-to-t from-gray-950 to-transparent' : 'bg-gradient-to-t from-[#f4f6fb] to-transparent'}`}>
          <button 
            onClick={concluirSelecao}
            className="max-w-2xl mx-auto w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Concluir Seleção
          </button>
        </div>

        {/* Month Prompt Modal */}
        <AnimatePresence>
          {showMonthPrompt && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'} p-8 rounded-[32px] shadow-2xl w-full max-w-sm border`}
              >
                <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mês de Referência</h3>
                <p className={`text-sm font-bold mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Informe o mês para identificar esta lista.</p>
                
                <input 
                  type="text"
                  value={tempMonth}
                  onChange={(e) => setTempMonth(e.target.value)}
                  placeholder="Ex: Março/2024"
                  className={`w-full px-5 py-4 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold`}
                />

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowMonthPrompt(false)}
                    className={`flex-1 py-4 rounded-2xl font-black ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmarListaDoMes}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderCompra = () => (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#f4f6fb]'} p-6 pb-44`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setScreen('home')} className={`p-3 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 shadow-sm'} rounded-2xl transition-all`}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Fazer Compra</h1>
              {mesReferencia && <p className={`text-xs font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Mês: {mesReferencia}</p>}
            </div>
          </div>
          {listaDoMes && (
            <button 
              onClick={() => {
                if(confirm("Deseja limpar a lista atual?")) {
                  setListaDoMes(null);
                  setMesReferencia('');
                }
              }}
              className={`p-3 rounded-2xl ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {!listaDoMes ? (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-10 rounded-[32px] text-center border shadow-sm`}>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} font-bold`}>Nenhuma lista criada para este mês.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {(Object.entries(listaDoMes) as [string, ItemCompra[]][]).map(([cat, items]) => (
              <div key={cat} className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{cat}</h3>
                <div className="grid gap-3">
                  {items.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-5 rounded-[32px] shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${item.comprado ? 'opacity-50' : ''}`}
                    >
                      <div 
                        className="flex items-center gap-5 flex-1 cursor-pointer w-full"
                        onClick={() => toggleComprado(cat, idx)}
                      >
                        <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${
                          item.comprado ? 'bg-indigo-600 border-indigo-600' : darkMode ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-white'
                        }`}>
                          {item.comprado && <Check className="w-7 h-7 text-white" />}
                        </div>
                        <span className={`font-black text-xl ${item.comprado ? 'text-gray-500 line-through' : darkMode ? 'text-white' : 'text-gray-800'}`}>{item.nome}</span>
                      </div>
                      <div className={`flex items-center gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} px-5 py-3 rounded-2xl border w-full sm:w-auto`}>
                        <span className={`text-[10px] font-black ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>R$</span>
                        <input 
                          type="number"
                          value={item.preco || ''}
                          onChange={(e) => updatePreco(cat, idx, e.target.value)}
                          placeholder="0,00"
                          className={`w-full sm:w-24 bg-transparent text-right font-black text-xl outline-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`fixed bottom-0 left-0 right-0 p-6 ${darkMode ? 'bg-gradient-to-t from-gray-950 to-transparent' : 'bg-gradient-to-t from-[#f4f6fb] to-transparent'}`}>
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-indigo-100'} max-w-2xl mx-auto p-7 rounded-[40px] shadow-2xl border flex flex-col sm:flex-row items-center justify-between gap-6`}>
            <div className="flex flex-col items-center sm:items-start">
              <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Gasto</span>
              <span className={`text-4xl font-black ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>R$ {totalCompra.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => { alert('Compra finalizada!'); setScreen('home'); }}
              className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[24px] font-black text-xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {screen === 'login' && renderLogin()}
      {screen === 'home' && renderHome()}
      {screen === 'template' && renderTemplate()}
      {screen === 'listaMes' && renderListaMes()}
      {screen === 'compra' && renderCompra()}
    </AnimatePresence>
  );
}
