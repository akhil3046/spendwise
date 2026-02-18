
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, FilterType, DateRange, Category } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  onFilterChange: (type: FilterType, range?: DateRange) => void;
  activeFilter: FilterType;
  dateRange: DateRange;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, onFilterChange, activeFilter, dateRange }) => {
  const categoryData = useMemo(() => {
    const sums: Record<string, number> = {};
    transactions.forEach(t => {
      sums[t.category] = (sums[t.category] || 0) + t.amount;
    });
    return Object.entries(sums)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalSpent = useMemo(() => 
    transactions.reduce((acc, t) => acc + t.amount, 0),
  [transactions]);

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#ffffff" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[11px] font-black"
      >
        {`${name}: ${CURRENCY_SYMBOL}${value.toLocaleString('en-IN')}`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between border border-indigo-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] mb-1">Total Ledger Spent</p>
          <p className="text-4xl font-black mt-2">{CURRENCY_SYMBOL}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 col-span-1 md:col-span-2 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Focus Period</h2>
            <div className="flex flex-wrap gap-2">
              {(['this-week', 'this-month', 'custom'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === f 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {f.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>
          {activeFilter === 'custom' && (
             <div className="flex flex-wrap gap-4 mt-6 animate-in slide-in-from-top duration-300">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Start Date</span>
                  <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => onFilterChange('custom', { ...dateRange, start: e.target.value })}
                    className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-white rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold ml-1">End Date</span>
                  <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => onFilterChange('custom', { ...dateRange, end: e.target.value })}
                    className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-white rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
             </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800 min-h-[400px] flex flex-col">
        <h3 className="text-xs font-black text-zinc-500 mb-8 uppercase tracking-widest">Category Distribution</h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={renderCustomizedLabel}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toFixed(2)}`} 
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
