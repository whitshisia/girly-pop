import { openDB } from 'idb';

const DB_NAME = 'CycleTracker';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('cycles')) {
        const cycleStore = db.createObjectStore('cycles', { keyPath: 'id', autoIncrement: true });
        cycleStore.createIndex('startDate', 'startDate');
      }

      if (!db.objectStoreNames.contains('dailyLogs')) {
        const logStore = db.createObjectStore('dailyLogs', { keyPath: 'date' });
        logStore.createIndex('date', 'date');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('symptoms')) {
        db.createObjectStore('symptoms', { keyPath: 'id' });
      }
    },
  });
};

export const addCycle = async (cycle) => {
  const db = await initDB();
  return db.add('cycles', cycle);
};

export const getCycles = async () => {
  const db = await initDB();
  return db.getAll('cycles');
};

export const addDailyLog = async (log) => {
  const db = await initDB();
  return db.put('dailyLogs', log);
};

export const getDailyLog = async (date) => {
  const db = await initDB();
  return db.get('dailyLogs', date);
};

export const getAllLogs = async () => {
  const db = await initDB();
  return db.getAll('dailyLogs');
};

export const saveSettings = async (settings) => {
  const db = await initDB();
  return db.put('settings', { id: 'userSettings', ...settings });
};

export const getSettings = async () => {
  const db = await initDB();
  return db.get('settings', 'userSettings');
};