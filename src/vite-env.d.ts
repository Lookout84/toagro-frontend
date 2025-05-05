/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite-plugin-pwa/client" />

// Глобальні визначення типів для Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DEV_MODE: string;
  readonly VITE_SERVER_PORT: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_LIQPAY_PUBLIC_KEY: string;
  readonly VITE_MAX_UPLOAD_SIZE: string;
  readonly VITE_ALLOWED_IMAGE_FORMATS: string;
  readonly VITE_NOTIFICATION_TIMEOUT: string;
  // Додайте інші змінні середовища за потреби
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Розширення для SVG імпортів
declare module "*.svg" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

// Розширення для CSS/SCSS модулів
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Розширення для інших типів файлів
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

// Розширення для JSON імпортів
declare module "*.json" {
  const value: any;
  export default value;
}
