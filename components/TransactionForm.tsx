
import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { getTodayStr } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  editingTransaction?: Transaction | null;
  onAdd: (transaction: Transaction) => void;
  onUpdate: (transaction: Transaction) => void;
  onCancelEdit: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  categories, 
  editingTransaction, 
  onAdd, 
  onUpdate, 
  onCancelEdit 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
    } else {
      setAmount('');
      setDescription('');
      setDate(getTodayStr());
      if (categories.length > 0) {
        setCategory(categories[0].name);
      }
    }
  }, [editingTransaction, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const transactionData: Transaction = {
      id: editingTransaction?.id || crypto.randomUUID(),
      amount: parseFloat(amount),
      category: category || (categories[0]?.name || 'Others'),
      description: description.trim() || undefined,
      date,
      createdAt: editingTransaction?.createdAt || Date.now()
    };

    if (editingTransaction) {
      onUpdate(transactionData);
    } else {
      onAdd(transactionData);
    }

    setAmount('');
    setDescription('');
    setDate(getTodayStr());
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className={`bg-zinc-900 rounded-2xl p-6 shadow-2xl border transition-all duration-300 ${editingTransaction ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-zinc-800 hover:border-indigo-500/30'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className={`w-2 h-6 rounded-full inline-block ${editingTransaction ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
          {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        {editingTransaction && (
          <button 
            onClick={onCancelEdit}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-zinc-600"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-zinc-400">Description</label>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest italic">Optional</span>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-zinc-600"
            placeholder="Add a note..."
          />
        </div>

        <button
          type="submit"
          className={`w-full py-4 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg mt-2 ${editingTransaction ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
        >
          {editingTransaction ? 'Update Ledger' : 'Add to Ledger'}
        </button>

        {showSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium animate-bounce mt-2 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {editingTransaction ? 'Entry updated successfully!' : 'Transaction added successfully!'}
          </div>
        )}
      </form>
    </div>
  );
};
