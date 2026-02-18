
import React, { useState, useMemo, useEffect } from 'react';
import { Contact, DebtEntry } from '../types';
import { db } from '../services/db';
import { CURRENCY_SYMBOL, getTodayStr } from '../constants';

interface BorrowLentViewProps {
  contacts: Contact[];
  debts: DebtEntry[];
  onUpdate: () => void;
}

export const BorrowLentView: React.FC<BorrowLentViewProps> = ({ contacts, debts, onUpdate }) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  
  // Debt Entry Form State
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'borrow' | 'lent'>('lent');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (editingDebt) {
      setAmount(editingDebt.amount.toString());
      setType(editingDebt.type);
      setDescription(editingDebt.description || '');
    } else {
      setAmount('');
      setDescription('');
      setType('lent');
    }
  }, [editingDebt]);

  const contactBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    debts.forEach(d => {
      const val = d.type === 'lent' ? d.amount : -d.amount;
      balances[d.contactId] = (balances[d.contactId] || 0) + val;
    });
    return balances;
  }, [debts]);

  const totalBalance = useMemo(() => 
    Object.values(contactBalances).reduce((acc, b) => acc + b, 0),
  [contactBalances]);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: newContactName.trim(),
      createdAt: Date.now()
    };
    const updated = [...contacts, newContact];
    db.saveContacts(updated);
    setNewContactName('');
    onUpdate();
  };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !amount || isNaN(Number(amount))) return;
    
    const debtData: DebtEntry = {
      id: editingDebt?.id || crypto.randomUUID(),
      contactId: selectedContactId,
      amount: parseFloat(amount),
      type,
      description: description.trim() || undefined,
      date: editingDebt?.date || getTodayStr(),
      createdAt: editingDebt?.createdAt || Date.now()
    };
    
    if (editingDebt) {
      db.updateDebt(debtData);
    } else {
      db.addDebt(debtData);
    }
    
    setAmount('');
    setDescription('');
    setEditingDebt(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onUpdate();
  };

  const handleDeleteDebt = (id: string) => {
    if (confirm("Permanently delete this entry?")) {
      db.deleteDebt(id);
      onUpdate();
    }
  };

  const activeContact = contacts.find(c => c.id === selectedContactId);
  const activeDebts = debts.filter(d => d.contactId === selectedContactId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-3xl p-8 border ${totalBalance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Net Debt Position</p>
          <p className="text-4xl font-black">
            {totalBalance >= 0 ? '+' : '-'}{CURRENCY_SYMBOL}{Math.abs(totalBalance).toLocaleString('en-IN')}
          </p>
          <p className="text-xs mt-2 font-medium">
            {totalBalance >= 0 ? "You are overall in profit" : "You have overall liabilities"}
          </p>
        </div>
        
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-center">
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Add new contact..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-all">Add</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact List */}
        <div className="lg:col-span-1 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Contacts List</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800 scrollbar-hide">
            {contacts.length === 0 ? (
              <p className="p-8 text-center text-zinc-600 text-xs italic">No contacts added yet.</p>
            ) : (
              contacts.map(contact => {
                const bal = contactBalances[contact.id] || 0;
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContactId(contact.id);
                      setEditingDebt(null);
                    }}
                    className={`w-full text-left p-6 transition-all flex items-center justify-between group ${selectedContactId === contact.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-zinc-800'}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{contact.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${bal >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                        {bal === 0 ? 'Settled' : bal > 0 ? `Owes you ₹${bal}` : `You owe ₹${Math.abs(bal)}`}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bal >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {bal >= 0 ? '↑' : '↓'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Contact Details & Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedContactId ? (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <div className={`bg-zinc-900 rounded-3xl p-8 border relative overflow-hidden transition-all duration-300 ${editingDebt ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white">{activeContact?.name}</h2>
                    {editingDebt && (
                      <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded">Editing</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {editingDebt && (
                      <button onClick={() => setEditingDebt(null)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Cancel</button>
                    )}
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${ (contactBalances[selectedContactId] || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500' }`}>
                      Net: {CURRENCY_SYMBOL}{(contactBalances[selectedContactId] || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleDebtSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block ml-1">Type</label>
                    <div className="flex p-1 bg-zinc-800 rounded-xl gap-1">
                      <button 
                        type="button" 
                        onClick={() => setType('lent')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'lent' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >Lent (+)</button>
                      <button 
                        type="button" 
                        onClick={() => setType('borrow')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'borrow' ? 'bg-rose-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >Borrow (-)</button>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block ml-1">Amount</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="₹ 0.00"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block ml-1">Narration (Optional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Why this transaction?"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className={`px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-colors ${editingDebt ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white text-black hover:bg-zinc-200'}`}>
                        {editingDebt ? 'Update' : 'Log'}
                      </button>
                    </div>
                  </div>
                </form>
                {showSuccess && <p className="text-center mt-4 text-[10px] font-bold text-emerald-500 animate-pulse">{editingDebt ? 'Entry Updated!' : 'Entry Logged!'}</p>}
              </div>

              {/* Transaction List for Contact */}
              <div className="mt-8 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                   <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">History: {activeContact?.name}</h3>
                </div>
                <div className="overflow-y-auto max-h-[300px] divide-y divide-zinc-800 scrollbar-hide">
                  {activeDebts.length === 0 ? (
                    <p className="p-8 text-center text-zinc-600 text-xs italic">No transactions found.</p>
                  ) : (
                    activeDebts.map(d => (
                      <div key={d.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex-1">
                          <p className={`text-xs font-black uppercase tracking-widest ${d.type === 'lent' ? 'text-emerald-500' : 'text-rose-500'}`}>{d.type}</p>
                          <p className="text-zinc-400 text-[10px] mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</p>
                          {d.description && <p className="text-zinc-300 text-[11px] mt-1 italic">"{d.description}"</p>}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`text-sm font-black ${d.type === 'lent' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {d.type === 'lent' ? '+' : '-'}{CURRENCY_SYMBOL}{d.amount.toLocaleString()}
                          </p>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingDebt(d)} className="text-zinc-500 hover:text-amber-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteDebt(d.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed p-10 text-zinc-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               <p className="text-xs font-bold uppercase tracking-[0.2em]">Select a contact to view debt history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
