
import { Category } from './types';

export const CURRENCY_SYMBOL = '₹';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#f87171' },
  { id: '2', name: 'Transportation', color: '#60a5fa' },
  { id: '3', name: 'Shopping', color: '#fbbf24' },
  { id: '4', name: 'Entertainment', color: '#a78bfa' },
  { id: '5', name: 'Health', color: '#34d399' },
  { id: '6', name: 'Bills', color: '#fb7185' },
  { id: '7', name: 'Others', color: '#94a3b8' },
];

export const getTodayStr = () => new Date().toISOString().split('T')[0];

export const generateRandomColor = () => {
  const colors = ['#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#fb7185', '#94a3b8', '#818cf8', '#c084fc', '#fb923c'];
  return colors[Math.floor(Math.random() * colors.length)];
};
