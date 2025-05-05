/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    // додайте інші змінні середовища, які ви плануєте використовувати
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }