import { MaterialRequest, AppSettings, AuditEntry } from '@/types';

const STORAGE_KEYS = {
  REQUESTS: 'materialRequests',
  SETTINGS: 'appSettings',
} as const;

export const storageUtils = {
  // Material Requests
  getRequests: (): MaterialRequest[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return data ? JSON.parse(data) : [];
  },

  saveRequest: (request: MaterialRequest): void => {
    const requests = storageUtils.getRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  updateRequest: (id: string, updates: Partial<MaterialRequest>): MaterialRequest | null => {
    const requests = storageUtils.getRequests();
    const requestIndex = requests.findIndex(r => r.id === id);
    
    if (requestIndex >= 0) {
      requests[requestIndex] = { ...requests[requestIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      return requests[requestIndex];
    }
    
    return null;
  },

  addAuditEntry: (requestId: string, entry: Omit<AuditEntry, 'id'>): void => {
    const request = storageUtils.getRequests().find(r => r.id === requestId);
    if (request) {
      const auditEntry: AuditEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      
      request.auditTrail.push(auditEntry);
      storageUtils.saveRequest(request);
    }
  },

  // App Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      materialCategories: ['Cell', 'Encapsulant', 'Glass', 'Junction Box', 'Backsheet', 'Flux', 'Sealant', 'Connector', 'FG Module'],
      purposes: ['Quality Improvement', 'Alternate Vendor Development', 'Cost Reduction', 'Performance Enhancement']
    };
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  addToDropdown: (type: 'materialCategories' | 'purposes', value: string): void => {
    const settings = storageUtils.getSettings();
    if (!settings[type].includes(value)) {
      settings[type].push(value);
      storageUtils.saveSettings(settings);
    }
  },

  generateId: (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
};