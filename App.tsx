
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, FilterType, DateRange, Category, AppTab, Contact, DebtEntry } from './types';
import { db, CloudConfig } from './services/db';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { CategoryManager } from './components/CategoryManager';
import { BorrowLentView } from './components/BorrowLentView';
import { getTodayStr } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('expenses');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('this-month');
  const [customRange, setCustomRange] = useState<DateRange>({
    start: getTodayStr(),
    end: getTodayStr()
  });

  // Cloud State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [githubToken, setGithubToken] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setAllTransactions(db.getTransactions());
    setCategories(db.getCategories());
    setContacts(db.getContacts());
    setDebts(db.getDebts());
    setCloudConfig(db.getCloudConfig());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCloudSync = async () => {
    if (!cloudConfig?.token && !githubToken) return;
    setIsSyncing(true);
    try {
      const configToUse = cloudConfig || { token: githubToken, gistId: '' };
      const updated = await db.syncToCloud(configToUse);
      setCloudConfig(updated);
      setIsCloudModalOpen(false);
    } catch (e) {
      alert("Sync failed. Check your GitHub Token.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudFetch = async () => {
    if (!cloudConfig) return;
    setIsSyncing(true);
    try {
      const success = await db.fetchFromCloud(cloudConfig);
      if (success) {
        refreshData();
        alert("Cloud data merged successfully!");
      }
    } catch (e) {
      alert("Pull failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTransaction = (t: Transaction) => {
    db.addTransaction(t);
    refreshData();
  };

  const handleUpdateTransaction = (t: Transaction) => {
    db.updateTransaction(t);
    setEditingTransaction(null);
    refreshData();
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Delete this transaction?")) {
      db.deleteTransaction(id);
      refreshData();
    }
  };

  const handleAddCategory = (cat: Category) => {
    const updated = [...categories, cat];
    setCategories(updated);
    db.saveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    db.saveCategories(updated);
  };

  const handleFilterChange = (type: FilterType, range?: DateRange) => {
    setActiveFilter(type);
    if (range) setCustomRange(range);
  };

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      if (activeFilter === 'this-week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return tDate >= startOfWeek && tDate <= endOfWeek;
      }
      if (activeFilter === 'this-month') {
        return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      }
      if (activeFilter === 'custom') {
        const start = new Date(customRange.start);
        start.setHours(0,0,0,0);
        const end = new Date(customRange.end);
        end.setHours(23,59,59,999);
        return tDate >= start && tDate <= end;
      }
      return true;
    });
  }, [allTransactions, activeFilter, customRange]);

  return (
    <div className="min-h-screen bg-black text-slate-100 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform hover:rotate-6 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">SpendWise</h1>
            <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Finance OS</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-800 p-1 rounded-2xl border border-zinc-700 shadow-xl">
           <button 
             onClick={() => setActiveTab('expenses')}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >Ledger</button>
           <button 
             onClick={() => setActiveTab('debts')}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'debts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >Debts</button>
        </div>

        {/* Cloud Status Center */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCloudModalOpen(true)}
            className={`group px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${cloudConfig ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
          >
            <div className={`w-2 h-2 rounded-full ${cloudConfig ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{cloudConfig ? 'Cloud Sync Active' : 'Offline Mode'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Cloud Settings Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-black text-white">Cloud Database Sync</h2>
                 <p className="text-zinc-500 text-xs mt-1">Host your transactions in your private GitHub Cloud.</p>
               </div>
               <button onClick={() => setIsCloudModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            {!cloudConfig ? (
              <div className="space-y-4">
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-[11px] leading-relaxed text-indigo-300">
                  <strong>Instruction:</strong> Generate a <b>GitHub Personal Access Token</b> (with 'gist' scope) from your settings to use SpendWise as a cloud-synced app.
                </div>
                <input 
                  type="password"
                  placeholder="Paste GitHub Token..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-sm text-white focus:border-indigo-500 outline-none"
                />
                <button 
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {isSyncing ? 'Linking Account...' : 'Link GitHub Cloud'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-black p-4 rounded-2xl border border-zinc-800">
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase text-white tracking-widest">Connection Stable</p>
                      <p className="text-[10px] text-zinc-500">Gist ID: {cloudConfig.gistId.substring(0, 10)}...</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={handleCloudSync}
                     disabled={isSyncing}
                     className="bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                   >
                     {isSyncing ? 'Syncing...' : 'Push to Cloud'}
                   </button>
                   <button 
                     onClick={handleCloudFetch}
                     disabled={isSyncing}
                     className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                   >
                     {isSyncing ? 'Fetching...' : 'Pull from Cloud'}
                   </button>
                </div>

                <button 
                  onClick={() => { localStorage.removeItem('spendwise_cloud_config'); setCloudConfig(null); }}
                  className="w-full text-zinc-600 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  Disconnect Cloud Storage
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
        {activeTab === 'expenses' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="xl:col-span-2 space-y-10">
              <Dashboard 
                transactions={filteredTransactions} 
                categories={categories}
                onFilterChange={handleFilterChange}
                activeFilter={activeFilter}
                dateRange={customRange}
              />
              <TransactionList 
                transactions={filteredTransactions} 
                categories={categories}
                onDelete={handleDeleteTransaction}
                onEdit={setEditingTransaction}
              />
            </div>
            <div className="xl:col-span-1 space-y-8">
              <div className="sticky top-28 space-y-8">
                <TransactionForm 
                  categories={categories} 
                  editingTransaction={editingTransaction}
                  onAdd={handleAddTransaction} 
                  onUpdate={handleUpdateTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                />
                <CategoryManager categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
              </div>
            </div>
          </div>
        ) : (
          <BorrowLentView 
            contacts={contacts} 
            debts={debts} 
            onUpdate={refreshData} 
          />
        )}
      </main>
      
      <footer className="mt-20 border-t border-zinc-900 py-10 text-center">
         <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
           &copy; {new Date().getFullYear()} SpendWise Ledger &bull; Intelligently Organized
         </p>
      </footer>
    </div>
  );
};

export default App;
