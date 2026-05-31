<template>
  <div class="iot-console">
    <div class="control-card">
      <h3 class="title">📡 物联网高频数据流控制枢纽</h3>
      <div class="status-bar">
        <span class="status-badge" :class="{ 'is-active': isConnected }">
          {{ isConnected ? '● WebSocket 已连接' : '○ WebSocket 已断开' }}
        </span>
        <span class="speed-badge">🚀 吞吐率: {{ dataFrequency }}ms/条</span>
      </div>
      
      <div class="btn-group">
        <button @click="toggleConnection" :class="isConnected ? 'btn-danger' : 'btn-success'">
          {{ isConnected ? '断开连接' : '建立高频连接' }}
        </button>
        <button @click="clearLogs" class="btn-secondary">清空实时日志</button>
      </div>
    </div>

    <div class="log-card">
      <h4 class="sub-title">📝 毫秒级突发数据流日志 (最新 50 条)</h4>
      <div class="log-container" ref="logBox">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-topic">设备 #{{ log.deviceId }}</span>
          <span class="log-metric">温度: <b class="text-warn">{{ log.val1 }}°C</b></span>
          <span class="log-metric">振幅: <b class="text-info">{{ log.val2 }}mm</b></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'

// 定义向外通知数据的自定义事件 (用于把数据传给图表)
const emit = defineEmits(['stream-data'])

const isConnected = ref(false)
const dataFrequency = ref(50) // ⚡ 每50毫秒涌入一条数据（模拟工业级高频突发）
const logs = ref([])
const logBox = ref(null)
let socketTimer = null
let logIdCounter = 0

// 🛠️ 核心机制：仿真高频 WebSocket 数据管道
const simulateWebSocketStream = () => {
  socketTimer = setInterval(() => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`
    
    // 构造模拟工业传感器报文
    const newData = {
      id: logIdCounter++,
      time: timeStr,
      deviceId: Math.floor(Math.random() * 5) + 1001,
      val1: (Math.random() * 30 + 60).toFixed(2), // 模拟温度 60-90°C
      val2: (Math.random() * 5).toFixed(2)        // 模拟轴承振幅 0-5mm
    }

    // 1. 向上游 App.vue 派发原始数据流，用于图表动态增量渲染
    emit('stream-data', newData)

    // 2. 本地日志缓冲区优化：限制 DOM 节点最大数量，防止高频长流下浏览器内存暴卷
    logs.value.push(newData)
    if (logs.value.length > 50) {
      logs.value.shift() // 剔除老数据，死死将 DOM 节点控制在 50 个以内
    }

    // 3. 丝滑滚动追光
    nextTick(() => {
      if (logBox.value) {
        logBox.value.scrollTop = logBox.value.scrollHeight
      }
    })
  }, dataFrequency.value)
}

// 控制开关
const toggleConnection = () => {
  if (isConnected.value) {
    clearInterval(socketTimer)
    isConnected.value = false
  } else {
    isConnected.value = true
    simulateWebSocketStream()
  }
}

const clearLogs = () => {
  logs.value = []
}

// 组件卸载前必须彻底清除定时器，防止内存泄漏
onBeforeUnmount(() => {
  clearInterval(socketTimer)
})
</script>

<style scoped>
/* 核心暗黑 Sci-Fi 科技感局部样式 */
.iot-console {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}
.control-card, .log-card {
  background: rgba(20, 24, 38, 0.95);
  border: 1px solid rgba(0, 242, 254, 0.2);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.05);
}
.title { color: #00f2fe; margin: 0 0 10px 0; font-size: 1.1rem; text-shadow: 0 0 5px rgba(0,242,254,0.5); }
.sub-title { color: #9aa0b0; margin: 0 0 10px 0; font-size: 0.9rem; }
.status-bar { display: flex; gap: 15px; margin-bottom: 15px; font-size: 0.85rem; }
.status-badge { color: #ef4444; }
.status-badge.is-active { color: #4ade80; text-shadow: 0 0 5px rgba(74,222,128,0.5); }
.speed-badge { color: #00f2fe; background: rgba(0,242,254,0.1); padding: 2px 6px; border-radius: 4px; }
.btn-group { display: flex; gap: 10px; }
button { border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; color: #fff; }
.btn-success { background: #10b981; }
.btn-success:hover { background: #059669; box-shadow: 0 0 8px #10b981; }
.btn-danger { background: #ef4444; }
.btn-danger:hover { background: #dc2626; box-shadow: 0 0 8px #ef4444; }
.btn-secondary { background: #374151; color: #d1d5db; }
.btn-secondary:hover { background: #4b5563; }

/* 高性能滚动日志窗口 */
.log-container {
  height: 250px;
  overflow-y: auto;
  background: #0d111d;
  border: 1px solid #1f293d;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.log-item { display: flex; gap: 10px; color: #a3a3a3; align-items: center; border-bottom: 1px dashed #1e293b; padding-bottom: 4px; }
.log-time { color: #64748b; }
.log-topic { color: #fbbf24; font-weight: bold; }
.text-warn { color: #f87171; }
.text-info { color: #38bdf8; }

/* 滚动条美化 */
.log-container::-webkit-scrollbar { width: 6px; }
.log-container::-webkit-scrollbar-thumb { background: #1f293d; border-radius: 3px; }
.log-container::-webkit-scrollbar-thumb:hover { background: #00f2fe; }
</style>