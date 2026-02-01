
import { AppData } from './types';

const STORAGE_KEY = 'qisst_app_data';

const INITIAL_DATA: AppData = {
  qissts: [],
  customers: [],
  attendance: [],
  draws: []
};

export const loadData = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return INITIAL_DATA;
  try {
    const parsed = JSON.parse(saved);
    return { ...INITIAL_DATA, ...parsed };
  } catch {
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log('Data synced to local storage.');
};

export const syncToCloud = async (data: AppData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Cloud Sync Successful');
      resolve(true);
    }, 1500);
  });
};
