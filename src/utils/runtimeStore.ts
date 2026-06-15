// ============================================================================
//  RUNTIME STORE (Enterprise - Super Short Compatible)
// ============================================================================

export class Runtime {
    private static store: Record<string, any> = {};

    static set(key: string, value: any) {
        this.store[key] = value;
        console.log(`[RUNTIME] STORED → ${key}:`, value);
    }

    static get(key: string) {
        return this.store[key];
    }

    static has(key: string) {
        return this.store[key] !== undefined;
    }

    static remove(key: string) {
        delete this.store[key];
    }

    static clear() {
        this.store = {};
    }

    static dump() {
        console.log("===== RUNTIME VARIABLES =====");
        console.log(JSON.stringify(this.store, null, 2));
        console.log("================================");
    }
}
