/// <reference types="vite/client" />

// Google API types are loaded dynamically, don't declare as global
interface GooglePickerAPI {
  picker: {
    PickerBuilder: any;
    ViewId: any;
    Action: any;
    DiacriticsMode: any;
  };
}
