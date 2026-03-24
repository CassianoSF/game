import { LogLevel, type LogEntry, type ProfilingEntry } from './types';

export class Logger {
  private static instance: Logger | null = null;
  private logs: LogEntry[] = [];
  private profiling: ProfilingEntry[] = [];
  private maxLogs = 1000;
  private maxProfiling = 100;

  private currentLevel: LogLevel = 1;
  private enabledCategories: Set<string> = new Set(['*']);

  private constructor() {
    this.enabledCategories.add('*');
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  enableCategory(category: string): void {
    this.enabledCategories.add(category);
  }

  disableCategory(category: string): void {
    this.enabledCategories.delete(category);
  }

  private shouldLog(category: string, level: LogLevel): boolean {
    if (level < this.currentLogLevel) return false;
    if (this.enabledCategories.has('*')) return true;
    return this.enabledCategories.has(category);
  }

  debug(category: string, message: string, data?: any): void {
    if (!this.shouldLog(category, LogLevel.DEBUG)) return;
    this.addLog(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    if (!this.shouldLog(category, LogLevel.INFO)) return;
    this.addLog(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    if (!this.shouldLog(category, LogLevel.WARN)) return;
    this.addLog(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    if (!this.shouldLog(category, LogLevel.ERROR)) return;
    this.addLog(LogLevel.ERROR, category, message, data);
    this.addLog(LogLevel.ERROR, 'console', message, data);
  }

  private addLog(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.logToConsole(entry);
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = Object.keys(LogLevel)[entry.level] as string;
    const prefix = `[${entry.category}][${levelName}]`;
    const timestamp = new Date(entry.timestamp).toISOString();

    const logMessage = `${timestamp} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data);
        break;
    }
  }

  startProfile(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const entry: ProfilingEntry = {
        name,
        startTime,
        endTime,
        duration: endTime - startTime,
      };
      
      this.profiling.push(entry);
      
      if (this.profiling.length > this.maxProfiling) {
        this.profiling.shift();
      }
    };
  }

  profile<T>(name: string, fn: () => T): T {
    const endProfile = this.startProfile(name);
    try {
      return fn();
    } finally {
      endProfile();
    }
  }

  getLogs(level?: LogLevel, category?: string): LogEntry[] {
    let filtered = this.logs;

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }

    if (category !== undefined) {
      filtered = filtered.filter(log => log.category === category);
    }

    return filtered;
  }

  getProfilingData(name?: string): ProfilingEntry[] {
    let filtered = this.profiling;

    if (name !== undefined) {
      filtered = filtered.filter(entry => entry.name === name);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  clearProfiling(): void {
    this.profiling = [];
  }

  getStats(): {
    totalLogs: number;
    totalProfiling: number;
    logsByLevel: Record<string, number>;
  } {
    const logsByLevel: Record<string, number> = {};
    for (const key in LogLevel) {
      logsByLevel[key] = this.logs.filter(log => log.level === LogLevel[key]).length;
    }

    return {
      totalLogs: this.logs.length,
      totalProfiling: this.profiling.length,
      logsByLevel,
    };
  }

  exportLogs(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      return this.logs.map(entry => {
        const levelName = Object.keys(LogLevel)[entry.level];
        const timestamp = new Date(entry.timestamp).toISOString();
        return `[${timestamp}][${levelName}][${entry.category}] ${entry.message}`;
      }).join('\n');
    }
  }

  exportProfilingData(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.profiling, null, 2);
    } else {
      return this.profiling.map(entry => {
        return `[${entry.name}] ${entry.duration.toFixed(2)}ms`;
      }).join('\n');
    }
  }
}

export function getLogger(): Logger {
  return Logger.getInstance();
}
