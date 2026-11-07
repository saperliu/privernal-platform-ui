declare const _default: {
    /**
     * 会话级缓存
     */
    session: {
        set(key: any, value: any): void;
        get(key: any): string;
        setJSON(key: any, jsonValue: any): void;
        getJSON(key: any): any;
    };
};
export default _default;
