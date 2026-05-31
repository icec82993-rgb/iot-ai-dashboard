<template>
  <div class="chart-card">
    <h3 class="chart-title">📊 工业传感器毫秒级实时动力学看板</h3>
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
let myChart = null

// 核心本地性能缓冲区：不使用 Vue 的 ref 深度响应式，彻底隔离数据，防止 Vue 监听拖慢性能
const timeData = []
const tempData = []
const vibData = []
const MAX_DATA_POINTS = 50 // 严格控制滑动窗口大小，只保留最新的 50 个数据点

// 1. 初始化 ECharts 静态配置
const initChart = () => {
  if (!chartRef.value) return
  
  myChart = echarts.init(chartRef.value, 'dark') // 采用内置的暗黑主题适配 UI
  
  const option = {
    backgroundColor: 'transparent', // 保持背景透明，融合系统暗黑风
    title: { show: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#1f293d' } }
    },
    legend: { data: ['设备温度 (°C)', '机械振幅 (mm)'], textStyle: { color: '#9aa0b0' } },
    grid: { left: '4%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.3)' } },
      axisLabel: { color: '#9aa0b0', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '温度 (°C)',
        min: 50,
        max: 100,
        axisLine: { lineStyle: { color: '#f87171' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      {
        type: 'value',
        name: '振幅 (mm)',
        min: 0,
        max: 6,
        axisLine: { lineStyle: { color: '#38bdf8' } },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '设备温度 (°C)',
        type: 'line',
        symbol: 'none', // 高频数据流必须关闭拐点小圆圈渲染，否则极端消耗 GPU
        smooth: true,   // 开启平滑曲线
        yAxisIndex: 0,
        data: [],
        lineStyle: { width: 2, color: '#f87171' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(248, 113, 113, 0.2)' },
            { offset: 1, color: 'rgba(248, 113, 113, 0)' }
          ])
        }
      },
      {
        name: '机械振幅 (mm)',
        type: 'line',
        symbol: 'none',
        smooth: true,
        yAxisIndex: 1,
        data: [],
        lineStyle: { width: 2, color: '#38bdf8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.2)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0)' }
          ])
        }
      }
    ]
  }

  myChart.setOption(option)
}

// 2. 核心性能高光函数：暴露给上游调用的增量更新接口
const updateData = (newData) => {
  if (!myChart) return

  // 1. 向本地普通数组追加数据
  timeData.push(newData.time)
  tempData.push(newData.val1)
  vibData.push(newData.val2)

  // 2. 实现滑动窗口（Sliding Window）：数据量超过阈值时，剔除头部最老的数据
  if (timeData.length > MAX_DATA_POINTS) {
    timeData.shift()
    tempData.shift()
    vibData.shift()
  }

  // 3. 性能决杀：ECharts 允许只对特定的 series 和 xAxis 的数据源进行增量重设
  // 坚决不重新 new option，只做底层数据的线性重映射
  myChart.setOption({
    xAxis: { data: timeData },
    series: [
      { data: tempData },
      { data: vibData }
    ]
  })
}

// 3. 监听窗口缩放，防止大屏变形
const handleResize = () => {
  if (myChart) myChart.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (myChart) {
    myChart.dispose() // 必须销毁实例，释放 GPU 与内存
  }
})

// 暴露接口给父组件 App.vue 抓取
defineExpose({ updateData })
</script>

<style scoped>
.chart-card {
  background: rgba(20, 24, 38, 0.95);
  border: 1px solid rgba(0, 242, 254, 0.2);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chart-title {
  color: #00f2fe;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  text-shadow: 0 0 5px rgba(0,242,254,0.5);
}
.chart-container {
  flex: 1;
  min-height: 400px; /* 撑开图表高度 */
}
</style>