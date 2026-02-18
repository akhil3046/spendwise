
import { Transaction, Category, Contact, DebtEntry } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const DB_KEY = 'spendwise_transactions';
const CAT_KEY = 'spendwise_categories';
const CONTACT_KEY = 'spendwise_contacts';
const DEBT_KEY = 'spendwise_debts';
const CLOUD_KEY = 'spendwise_cloud_config';

export interface CloudConfig {
  token: string;
  gistId: string;
  lastSync?: string;
}

export const db = {
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(transactions));
  },
  addTransaction: (transaction: Transaction) => {
    const transactions = db.getTransactions();
    transactions.push(transaction);
    db.saveTransactions(transactions);
  },
  updateTransaction: (updated: Transaction) => {
    const transactions = db.getTransactions();
    const index = transactions.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      transactions[index] = updated;
      db.saveTransactions(transactions);
    }
  },
  deleteTransaction: (id: string) => {
    const transactions = db.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    db.saveTransactions(filtered);
  },
  getCategories: (): Category[] => {
    const data = localStorage.getItem(CAT_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },
  saveCategories: (categories: Category[]) => {
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
  },
  
  // Contacts & Debts
  getContacts: (): Contact[] => {
    const data = localStorage.getItem(CONTACT_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveContacts: (contacts: Contact[]) => {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contacts));
  },
  getDebts: (): DebtEntry[] => {
    const data = localStorage.getItem(DEBT_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveDebts: (debts: DebtEntry[]) => {
    localStorage.setItem(DEBT_KEY, JSON.stringify(debts));
  },
  addDebt: (debt: DebtEntry) => {
    const debts = db.getDebts();
    debts.push(debt);
    db.saveDebts(debts);
  },
  updateDebt: (updated: DebtEntry) => {
    const debts = db.getDebts();
    const index = debts.findIndex(d => d.id === updated.id);
    if (index !== -1) {
      debts[index] = updated;
      db.saveDebts(debts);
    }
  },
  deleteDebt: (id: string) => {
    const debts = db.getDebts();
    const filtered = debts.filter(d => d.id !== id);
    db.saveDebts(filtered);
  },

  // Export/Import
  exportFullDatabase: () => {
    const data = db.getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendwise_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getSnapshot: () => ({
    transactions: db.getTransactions(),
    categories: db.getCategories(),
    contacts: db.getContacts(),
    debts: db.getDebts(),
  }),

  importSnapshot: (data: any) => {
    try {
      if (data.transactions) db.saveTransactions(data.transactions);
      if (data.categories) db.saveCategories(data.categories);
      if (data.contacts) db.saveContacts(data.contacts);
      if (data.debts) db.saveDebts(data.debts);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Cloud Gist Logic
  getCloudConfig: (): CloudConfig | null => {
    const data = localStorage.getItem(CLOUD_KEY);
    return data ? JSON.parse(data) : null;
  },
  saveCloudConfig: (config: CloudConfig) => {
    localStorage.setItem(CLOUD_KEY, JSON.stringify(config));
  },
  
  syncToCloud: async (config: CloudConfig): Promise<CloudConfig> => {
    const payload = {
      description: "SpendWise Cloud Database Backup",
      public: false,
      files: {
        "spendwise_db.json": {
          content: JSON.stringify(db.getSnapshot(), null, 2)
        }
      }
    };

    const method = config.gistId ? 'PATCH' : 'POST';
    const url = config.gistId 
      ? `https://api.github.com/gists/${config.gistId}` 
      : `https://api.github.com/gists`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Cloud Push Failed");
    const result = await response.json();
    const newConfig = { ...config, gistId: result.id, lastSync: new Date().toISOString() };
    db.saveCloudConfig(newConfig);
    return newConfig;
  },

  fetchFromCloud: async (config: CloudConfig): Promise<boolean> => {
    if (!config.gistId) return false;
    const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
      headers: { 'Authorization': `token ${config.token}` }
    });
    if (!response.ok) throw new Error("Cloud Pull Failed");
    const result = await response.json();
    const content = result.files["spendwise_db.json"].content;
    return db.importSnapshot(JSON.parse(content));
  }
};
