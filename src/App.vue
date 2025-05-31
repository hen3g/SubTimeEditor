<script setup>
import { onMounted } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

onMounted(() => {
  document.title = '字幕时间轴编辑器'
})
</script>

<template>
  <router-view></router-view>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}

#app {
  height: 100vh;
}
</style>
