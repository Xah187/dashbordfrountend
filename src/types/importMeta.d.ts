/// <reference types="node" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE?: string;
    [key: string]: any;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
        accept: typeof Function;
        dispose: typeof Function;
        invalidate: typeof Function;
        on: typeof Function;
        [key: string]: any;
    };
}
