
import React from 'react';
import { Transaction, Category } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, onDelete, onEdit }) => {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  return (
    <div className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden mt-8">
      <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white">Log History</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Transaction Database</p>
        </div>
        <div className="bg-zinc-800 px-4 py-1.5 rounded-full border border-zinc-700">
           <span className="text-xs font-bold text-zinc-300">{transactions.length} Records</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900">
              <th className="px-8 py-5">Timestamp</th>
              <th className="px-8 py-5">Classification</th>
              <th className="px-8 py-5">Narration</th>
              <th className="px-8 py-5 text-right">Value</th>
              <th className="px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-zinc-600 italic">
                  No records found for current scope.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-500/5 transition-all group">
                  <td className="px-8 py-5 text-sm text-zinc-400 font-medium whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span 
                      className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-700/50"
                      style={{ 
                        backgroundColor: `${getCategoryColor(t.category)}15`, 
                        color: getCategoryColor(t.category) 
                      }}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-zinc-300 font-medium max-w-xs truncate">
                    {t.description || <span className="text-zinc-700 italic">N/A</span>}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-white text-right whitespace-nowrap">
                    {CURRENCY_SYMBOL}{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onEdit(t)}
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all border border-zinc-700 hover:border-amber-400/30"
                        title="Edit entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-zinc-700 hover:border-red-400/30"
                        title="Delete entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
