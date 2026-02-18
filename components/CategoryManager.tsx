
import React, { useState } from 'react';
import { Category } from '../types';
import { generateRandomColor } from '../constants';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd, onDelete }) => {
  const [newCatName, setNewCatName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    onAdd({
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      color: generateRandomColor()
    });
    setNewCatName('');
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800 transition-all">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
          Manage Categories
        </h2>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder-zinc-600 text-sm"
              placeholder="New category name..."
            />
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all text-sm whitespace-nowrap"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl transition-all hover:border-zinc-500"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-xs font-bold text-zinc-300">{cat.name}</span>
                <button 
                  onClick={() => onDelete(cat.id)}
                  className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
