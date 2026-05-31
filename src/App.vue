<template>
  <div class="app-wrapper">
    <header class="screen-header">
      <div class="header-left">🌐 SYSTEM WORKSPACE</div>
      <div class="header-title">物联网传感器高频大数据流监控大屏</div>
      <div class="header-right">VITE + VUE 3 PERFORMANCE SANDBOX</div>
    </header>

    <main class="screen-body">
      <section class="left-panel">
        <IotConsole @stream-data="handleConsoleStream" />
      </section>

      <section class="right-panel">
        <IotChart ref="chartInstance" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import IotConsole from './components/IotConsole.vue'
import IotChart from './components/IotChart.vue'

// 绑定图表子组件实例的指针
const chartInstance = ref(null)

// 核心数据中转中枢（大总管函数）
const handleConsoleStream = (newData) => {
  // 当左边控制台以 50ms/条 的高频吞吐派发数据时，App.vue 拦截并无缝喂给右边的图表组件
  if (chartInstance.value) {
    chartInstance.value.updateData(newData)
  }
}
</script>

<style>
/* 统一定制全屏深空暗黑科技风底色，消除默认白边 */
html, body {
  margin: 0;
  padding: 0;
  background: #060913;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden; /* 规避大屏出现双滚动条 */
  height: 100vh;
  width: 100vw;
}

#app {
  height: 100%;
  width: 100%;
}
</style>

<style scoped>
/* 页面级大屏栅格布局布局 */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  padding: 10px 20px 20px 20px;
  background: radial-gradient(circle at 50% 50%, #0c122c 0%, #060913 100%);
}

/* 科技感大屏头部线条 */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #00f2fe;
  padding: 10px 0;
  margin-bottom: 15px;
  box-shadow: 0 4px 20px rgba(0, 242, 254, 0.1);
}
.header-left, .header-right {
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 2px;
  font-family: monospace;
}
.header-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: #ffffff;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.6);
}

/* 主体左右双击并排 */
.screen-body {
  flex: 1;
  display: grid;
  grid-template-columns: 450px 1fr; /* 左侧固定控制台，右侧自适应拓展图表 */
  gap: 20px;
  height: calc(100% - 60px); /* 扣除头部高度 */
}

.left-panel {
  display: flex;
  flex-direction: column;
}
.right-panel {
  min-width: 0; /* 极其重要：防止 ECharts 在 Flex/Grid 容器中无限撑大而不缩小的 Bug */
}
</style>