import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAxios } from './services/api'
// Initialize axios base url and set default header
initAxios()

createApp(App).use(router).mount('#app')
