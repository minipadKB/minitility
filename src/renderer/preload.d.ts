import { ElectronHandler } from 'main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    disabled?: boolean;
  }
}

export {};
