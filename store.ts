import { AppData } from './types';

const STORAGE_KEY = 'qisst_app_data_v1';
const SHEETS_URL_KEY = 'qisst_sheets_url';
const AUTO_SYNC_KEY = 'qisst_auto_sync';
const LAST_SYNC_KEY = 'qisst_last_sync_time';

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwcpkXbWz3oOvcFrByhiQnPuVxVRFQbRJErb0tViBuDttfFkAVsFZNa8KBpSMGpRcRU/exec';

const INITIAL_DATA: AppData = {
  qissts: [],
  customers: [],
  attendance: [],
  draws: []
};

export const getSheetsUrl = () => localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_SHEETS_URL;
export const setSheetsUrl = (url: string) => localStorage.setItem(SHEETS_URL_KEY, url);

export const getAutoSync = () => localStorage.getItem(AUTO_SYNC_KEY) === 'true';
export const setAutoSync = (enabled: boolean) => localStorage.setItem(AUTO_SYNC_KEY, String(enabled));

export const getLastSyncTime = () => localStorage.getItem(LAST_SYNC_KEY) || null;
export const setLastSyncTime = (time: string) => localStorage.setItem(LAST_SYNC_KEY, time);

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DATA;
    const parsed = JSON.parse(saved);
    return {
      qissts: Array.isArray(parsed.qissts) ? parsed.qissts : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      draws: Array.isArray(parsed.draws) ? parsed.draws : []
    };
  } catch (error) {
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Enterprise Grade Sync Engine
 * Sends data as 'text/plain' to bypass CORS restrictions for Google Apps Script Web Apps
 */
export const syncToGoogleSheets = async (data: AppData): Promise<boolean> => {
  const url = getSheetsUrl();
  if (!url) return false;

  // Integrity Check: Don't sync if local data seems corrupted or empty while cloud might have data
  if (data.qissts.length === 0 && data.customers.length === 0) {
    console.warn("Sync Blocked: Attempting to push empty dataset.");
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    
    // Update local sync metadata
    const now = new Date().toLocaleTimeString([], { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
    setLastSyncTime(now);
    return true; 
  } catch (error) {
    console.error('Cloud Push Failed:', error);
    return false;
  }
};

export const fetchFromGoogleSheets = async (): Promise<AppData | null> => {
  const url = getSheetsUrl();
  if (!url) return null;

  try {
    // Add timestamp to bypass any cache
    const response = await fetch(`${url}?timestamp=${Date.now()}`);
    if (!response.ok) throw new Error("Cloud unreachable");
    
    const data = await response.json();
    
    // Strict Schema Validation
    if (data && Array.isArray(data.qissts) && Array.isArray(data.customers)) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Cloud Restoration Failed:', error);
    return null;
  }
};
