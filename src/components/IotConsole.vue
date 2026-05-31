<template>
  <div class="iot-console">
    <div class="control-card">
      <h3 class="title">📡 物联网高频数据流控制枢纽 (Node.js+MQTT网关接入)</h3>
      <div class="status-bar">
        <span class="status-badge" :class="{ 'is-active': isConnected }">
          {{ isConnected ? '● WebSocket 真实网关已连接' : '○ 网关连接已断开' }}
        </span>
        <span class="speed-badge">🚀 实时吞吐: 50ms/条</span>
      </div>
      <div class="btn-group">
        <button @click="connectGateway" :disabled="isConnected" class="btn-success">开启物理网关流</button>
        <button @click="disconnectGateway" :disabled="!isConnected" class="btn-danger">断开网关</button>
        <button @click="clearLogs" class="btn-secondary">清空日志</button>
      </div>
    </div>

    <div class="ai-card" :class="{ 'has-alarm': activeAlarm }">
      <h4 class="ai-title">🤖 DeepSeek AI 智能设备异常诊断中心 (Tool Calling)</h4>
      <div v-if="activeAlarm" class="alarm-banner">
        🚨 突发异常告警：设备 #{{ activeAlarm.deviceId }} 温度超标 ({{ activeAlarm.val1 }}°C)！
        <button @click="triggerAiAnalysis" :disabled="isAiLoading" class="btn-ai">
          {{ isAiLoading ? '⚡ AI 正在调用决策工具...' : '🚀 发起 AI 协同诊断' }}
        </button>
      </div>
      <div v-else class="alarm-none">🟢 传感器数值均处于安全阈值范围内，AI 持续监控中...</div>

      <div v-if="aiResult" class="ai-result-box">
        <div class="ai-header">📝 模型执行工具分析结论 (Model Decisions)：</div>
        <p class="ai-text"><b>[判定状态]:</b> {{ aiResult.status }}</p>
        <p class="ai-text"><b>[核心原因]:</b> {{ aiResult.reason }}</p>
        <p class="ai-text"><b>[运维建议]:</b> {{ aiResult.advice }}</p>
      </div>
    </div>

    <div class="log-card">
      <h4 class="sub-title">📝 毫秒级突发网关日志 (滑动窗口最新 50 条)</h4>
      <div class="log-container" ref="logBox">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-topic">设备 #{{ log.deviceId }}</span>
          <span class="log-metric">温度: <b :class="parseFloat(log.val1) > 85 ? 'text-danger' : 'text-warn'">{{ log.val1 }}°C</b></span>
          <span class="log-metric">振幅: <b class="text-info">{{ log.val2 }}mm</b></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'

const emit = defineEmits(['stream-data'])
const isConnected = ref(false)
const logs = ref([])
const logBox = ref(null)
const activeAlarm = ref(null)
const isAiLoading = ref(false)
const aiResult = ref(null)

let socket = null
let logIdCounter = 0

// 真实打通本地 Node.js 网关的 WebSocket 通信
const connectGateway = () => {
  if (socket) return
  
  socket = new WebSocket('ws://localhost:8081')
  
  socket.onopen = () => {
    isConnected.value = true
  }
  
  socket.onmessage = (event) => {
    const rawData = JSON.parse(event.data)
    const normalizedData = {
      id: logIdCounter++,
      ...rawData
    }
    
    // 触发图表进行增量打补丁重绘
    emit('stream-data', normalizedData)
    
    // 突发日志滑动窗口优化
    logs.value.push(normalizedData)
    if (logs.value.length > 50) { logs.value.shift() }
    
    // 阈值拦截器：如果温度超过 85°C，立即截获并挂起 AI 异常告警
    if (parseFloat(normalizedData.val1) > 85 && !activeAlarm.value) {
      activeAlarm.value = normalizedData
    }
    
    nextTick(() => {
      if (logBox.value) { logBox.value.scrollTop = logBox.value.scrollHeight }
    })
  }
  
  socket.onclose = () => {
    isConnected.value = false
    socket = null
  }
}

const disconnectGateway = () => {
  if (socket) {
    socket.close()
    isConnected.value = false
    socket = null
  }
}

// 仿真接入 DeepSeek 模型的 Tool Calling / Function Calling 底层决策链
const triggerAiAnalysis = () => {
  isAiLoading.value = true
  aiResult.value = null
  
  // 仿真通过 API 传输系统 Prompt 及设备运行参数给大模型
  setTimeout(() => {
    isAiLoading.value = false
    // 模拟大模型判定后命中本地异常分析函数（Tool Calling）吐出的结构化 JSON
    aiResult.value = {
      status: "🚨 触发二级热工核心橙色预警",
      reason: `分析传感器 #${activeAlarm.value.deviceId} 时发现其当前瞬时温度高达 ${activeAlarm.value.val1}°C。结合振幅曲线分析，该现象并非随机噪声，而是由于高频轴承摩擦导致的典型热力学过载异常。`,
      advice: "1. 建议立即调度下位机边缘侧执行降频闭环控制；2. 派发工单，通知现场运维团队切出备用物理通道并注入冷却介质。"
    }
    activeAlarm.value = null // 诊断完成，挂起下一条告警
  }, 1200)
}

const clearLogs = () => { logs.value = [] }
onBeforeUnmount(() => { disconnectGateway() })
</script>

<style scoped>
.iot-console { display: flex; flex-direction: column; gap: 12px; height: 100%; color: #fff; }
.control-card, .log-card, .ai-card { background: rgba(16, 20, 35, 0.95); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 6px; padding: 12px; }
.ai-card { border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 0 10px rgba(168, 85, 247, 0.1); }
.ai-card.has-alarm { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); animation: pulse 2s infinite; }
.title { color: #00f2fe; margin: 0 0 8px 0; font-size: 1rem; }
.ai-title { color: #a855f7; margin: 0 0 8px 0; font-size: 0.95rem; }
.status-bar { display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.8rem; }
.status-badge { color: #ef4444; }.status-badge.is-active { color: #4ade80; }
.btn-group { display: flex; gap: 8px; }
button { border: none; padding: 6px 12px; border-radius: 4px; color: white; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
.btn-success { background: #22c55e; }.btn-danger { background: #ef4444; }.btn-secondary { background: #4b5563; }
.btn-ai { background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); margin-left: 10px; box-shadow: 0 0 8px rgba(168, 85, 247, 0.5); }
.alarm-banner { border-left: 4px solid #ef4444; padding-left: 10px; color: #f87171; font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; }
.alarm-none { color: #9aa0b0; font-size: 0.8rem; font-style: italic; }
.ai-result-box { margin-top: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; border: 1px dashed rgba(168, 85, 247, 0.3); font-size: 0.8rem; }
.ai-header { color: #c084fc; font-weight: bold; margin-bottom: 4px; }
.ai-text { margin: 3px 0; color: #e2e8f0; line-height: 1.4; }
.log-container { height: 180px; overflow-y: auto; font-family: monospace; font-size: 0.75rem; }
.log-item { padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.log-time { color: #64748b; margin-right: 5px; }
.log-topic { color: #38bdf8; margin-right: 10px; }
.log-metric { margin-right: 8px; }.text-warn { color: #fbbf24; }.text-info { color: #22d3ee; }.text-danger { color: #f87171; font-weight: bold; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.1); } 50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); } }
</style>