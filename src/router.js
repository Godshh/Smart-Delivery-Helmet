import { createRouter, createWebHistory } from 'vue-router';
import WM from './components/waimai/wMain.vue'
import Home from './components/text.vue'

import cxgj from './components/zntk/cxgj.vue';

import denlu from './components/denlu.vue';
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children:[
      {
        path: 'cxgj',
        name: 'cxgj',
        component: cxgj
      }
    ]
    
  },
  {
    path: '/WM',
    name: 'Other',
    component: WM, // 假设这是你想用的另一个组件
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
