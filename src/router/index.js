import { createRouter, createWebHistory } from 'vue-router'
import SubtitleEditor from '../views/SubtitleEditor.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SubtitleEditor
    }
  ]
})

export default router 