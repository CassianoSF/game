import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioLoader } from 'three';
import type { AssetType, AssetLoadOptions, AssetCache } from './types';

export class AssetManager {
  private cache: AssetCache = {};
  private loaders: Map<AssetType, any> = new Map();
  private loading: Set<string> = new Set();

  constructor() {
    this.initializeLoaders();
  }

  private initializeLoaders(): void {
    this.loaders.set('model', new GLTFLoader());
    this.loaders.set('texture', new THREE.TextureLoader());
    this.loaders.set('audio', new AudioLoader());
    this.loaders.set('json', new THREE.FileLoader());
  }

  private getAssetType(url: string): AssetType {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'gltf':
      case 'glb':
        return 'model';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return 'texture';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'json':
        return 'json';
      default:
        return 'model';
    }
  }

  public async load<T = any>(
    url: string,
    options: AssetLoadOptions = {}
  ): Promise<T> {
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    if (this.cache[normalizedUrl]) {
      return this.cache[normalizedUrl].data as T;
    }

    if (this.loading.has(normalizedUrl)) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.loading.has(normalizedUrl)) {
            clearInterval(checkInterval);
            if (this.cache[normalizedUrl]) {
              resolve(this.cache[normalizedUrl].data as T);
            } else {
              reject(new Error(`Failed to load asset: ${normalizedUrl}`));
            }
          }
        }, 100);
      });
    }

    this.loading.add(normalizedUrl);

    try {
      const result = await this.loadAsset<T>(normalizedUrl, options);
      
      this.cache[normalizedUrl] = {
        data: result,
        url: normalizedUrl,
        type: this.getAssetType(normalizedUrl),
        timestamp: Date.now(),
      };

      this.loading.delete(normalizedUrl);
      options.onLoad?.();

      return result;
    } catch (error) {
      this.loading.delete(normalizedUrl);
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
  }

  private async loadAsset<T>(
    url: string,
    options: AssetLoadOptions
  ): Promise<T> {
    const assetType = this.getAssetType(url);
    const loader = this.loaders.get(assetType);

    if (!loader) {
      throw new Error(`No loader for asset type: ${assetType}`);
    }

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (data: T) => resolve(data),
        (progress: ProgressEvent) => {
          if (progress.lengthComputable && options.onProgress) {
            options.onProgress({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.loaded / progress.total,
              currentAsset: url,
            });
          }
        },
        (error: ErrorEvent) => {
          reject(new Error(`Failed to load ${url}: ${error.message}`));
        }
      );
    });
  }

  public async loadGroup<T = any>(
    urls: string[],
    options: AssetLoadOptions = {}
  ): Promise<T[]> {
    const promises = urls.map(url => this.load<T>(url, options));
    return Promise.all(promises);
  }

  public preload(urls: string[]): Promise<void> {
    return this.loadGroup(urls).then(() => {});
  }

  public get<T = any>(url: string): T | undefined {
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return this.cache[normalizedUrl]?.data as T;
  }

  public has(url: string): boolean {
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return this.cache[normalizedUrl] !== undefined;
  }

  public unload(url: string): void {
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const asset = this.cache[normalizedUrl];
    if (asset) {
      if (asset.data instanceof THREE.Object3D) {
        asset.data.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      } else if (asset.data instanceof THREE.Texture) {
        asset.data.dispose();
      } else if ((asset.data as any).disconnect) {
        (asset.data as any).disconnect();
      }
    }
    delete this.cache[normalizedUrl];
  }

  public clear(): void {
    for (const url of Object.keys(this.cache)) {
      this.unload(url);
    }
  }

  public getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  public getCache(): AssetCache {
    return { ...this.cache };
  }
}

let assetManagerInstance: AssetManager | null = null;

export function getAssetManager(): AssetManager {
  if (!assetManagerInstance) {
    assetManagerInstance = new AssetManager();
  }
  return assetManagerInstance;
}
