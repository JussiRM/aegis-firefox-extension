import { createApp } from 'vue';
import App from './App.vue';
import './app.scss';

if (new URLSearchParams(location.search).has('tab')) document.body.classList.add('full-page');
createApp(App).mount('#app');
