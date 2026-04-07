export interface User {
    id?: string;
    email: string;
    name?: string;
    username: string;
    groups?: string[];
}
export interface Group {
    id: string;
    name: string;
}
export interface AgentResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface CacheProvider {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
