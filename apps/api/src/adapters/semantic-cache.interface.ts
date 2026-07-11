export interface ISemanticCacheAdapter {

    isAvailable(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    resetAllKeys(): Promise<void>;
}