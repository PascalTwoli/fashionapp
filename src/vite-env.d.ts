/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Google API types are loaded dynamically, don't declare as global
interface GooglePickerAPI {
  picker: {
    PickerBuilder: any;
    ViewId: any;
    Action: any;
    DiacriticsMode: any;
  };
}
