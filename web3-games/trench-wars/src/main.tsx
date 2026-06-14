import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'
import '@fontsource/rajdhani/500.css'
import '@fontsource/rajdhani/700.css'
import './ui/styles/index.css'
import './landing/landing.css'

createRoot(document.getElementById('app')!).render(<App />)
