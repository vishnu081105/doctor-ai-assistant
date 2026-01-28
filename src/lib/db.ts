import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type ReportType = 'general' | 'soap' | 'diagnostic';

export interface Report {
  id: string;
  transcription: string;
  reportContent: string;
  reportType: ReportType;
  createdAt: Date;
  updatedAt: Date;
  duration: number; // in seconds
  wordCount: number;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  createdAt: Date;
}

interface MediVoiceDB extends DBSchema {
  reports: {
    key: string;
    value: Report;
    indexes: {
      'by-date': Date;
      'by-type': ReportType;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
  templates: {
    key: string;
    value: Template;
    indexes: {
      'by-category': string;
    };
  };
}

const DB_NAME = 'medivoice-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MediVoiceDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MediVoiceDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<MediVoiceDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Reports store
      if (!db.objectStoreNames.contains('reports')) {
        const reportsStore = db.createObjectStore('reports', { keyPath: 'id' });
        reportsStore.createIndex('by-date', 'createdAt');
        reportsStore.createIndex('by-type', 'reportType');
      }
      
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Templates store (new in version 2)
      if (!db.objectStoreNames.contains('templates')) {
        const templatesStore = db.createObjectStore('templates', { keyPath: 'id' });
        templatesStore.createIndex('by-category', 'category');
      }
    },
  });
  
  return dbInstance;
}

// Report operations
export async function saveReport(report: Report): Promise<void> {
  const db = await getDB();
  await db.put('reports', report);
}

export async function getReport(id: string): Promise<Report | undefined> {
  const db = await getDB();
  return db.get('reports', id);
}

export async function getAllReports(): Promise<Report[]> {
  const db = await getDB();
  const reports = await db.getAll('reports');
  return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteReport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('reports', id);
}

export async function updateReport(id: string, updates: Partial<Report>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('reports', id);
  if (existing) {
    await db.put('reports', { ...existing, ...updates, updatedAt: new Date() });
  }
}

export async function searchReports(query: string): Promise<Report[]> {
  const db = await getDB();
  const allReports = await db.getAll('reports');
  const lowercaseQuery = query.toLowerCase();
  
  return allReports
    .filter(
      (report) =>
        report.transcription.toLowerCase().includes(lowercaseQuery) ||
        report.reportContent.toLowerCase().includes(lowercaseQuery)
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function clearAllReports(): Promise<void> {
  const db = await getDB();
  await db.clear('reports');
}

// Template operations
export async function saveTemplate(template: Template): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDB();
  const templates = await db.getAll('templates');
  return templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function clearAllTemplates(): Promise<void> {
  const db = await getDB();
  await db.clear('templates');
}

// Settings operations
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value as T | undefined;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function clearAllSettings(): Promise<void> {
  const db = await getDB();
  await db.clear('settings');
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
