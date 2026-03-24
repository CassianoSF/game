export type LogLevel = 0 | 1 | 2 | 3 | 4;

export const LOG_LEVEL: Record<string, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

export type LogEntry = {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
};

export type ProfilingEntry = {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  data?: any;
};
