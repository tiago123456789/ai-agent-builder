import { ISemanticCacheAdapter } from "./semantic-cache.interface";
import { SemanticCache } from "@upstash/semantic-cache";
import { Index } from "@upstash/vector";
import { config } from "../config";


class VectorUpstashSemanticCacheAdapter implements ISemanticCacheAdapter {

    private semanticCache: SemanticCache | null = null;
    private index: Index | null = null;
    
    constructor() {
        if (config.upstashCacheUrl && config.upstashCacheToken) {
            this.index = new Index({
                url: config.upstashCacheUrl,
                token: config.upstashCacheToken,
            });

            this.semanticCache = new SemanticCache({
                index: this.index,
                minProximity: 0.85,
            });
        }
    }

    isAvailable(): boolean {
        return this.semanticCache !== null;
    }

    async get(key: string): Promise<string | null> {
        if (!this.semanticCache) {
            throw new Error("Semantic cache is not initialized");
        }
        const result = await this.semanticCache.get(key);
        return result || null;
    }

    async set(key: string, value: string): Promise<void> {
        if (!this.semanticCache) {
            throw new Error("Semantic cache is not initialized");
        }
        await this.semanticCache.set(key, value);
    }

    async resetAllKeys(): Promise<void> {
        if (!this.index) {
            throw new Error("Semantic cache is not initialized");
        }
        await this.index?.reset();
    }

}

export default VectorUpstashSemanticCacheAdapter