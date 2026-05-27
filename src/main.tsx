import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './meta-preload.ts'

createRoot(document.getElementById("root")!).render(<App />);
