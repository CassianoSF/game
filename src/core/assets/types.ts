export type AssetType = 'model' | 'texture' | 'audio' | 'video' | 'json';

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  progress: number;
  currentAsset: string;
}

export interface AssetLoadOptions {
  onProgress?: (progress: AssetLoadProgress) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface LoadedAsset<T = any> {
  data: T;
  url: string;
  type: AssetType;
  timestamp: number;
}

export interface AssetCache {
  [key: string]: LoadedAsset;
}
