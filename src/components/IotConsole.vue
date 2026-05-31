<template>
  <div class="iot-console">
    <div class="control-card">
      <h3>智能网关控制枢纽</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">当前运行节点:</span>
          <span class="value highlighting">Gateway-NODE-03</span>
        </div>
        <div class="status-item">
          <span class="label">数据传输协议:</span>
          <span class="value">WebSocket (ws://)</span>
        </div>
        <div class="status-item">
          <span class="label">物理层报文解析:</span>
          <span class="value badge">MQTT 仿真订阅</span>
        </div>
      </div>
    </div>

    <div class="log-card">
      <div class="card-header">
        <h4>毫秒级突发数据流接收控制台 (滑动窗口: 50)</h4>
        <button @click="clearLogs" class="btn-clear">清空日志</button>
      </div>
      <div class="log-container" ref="logContainer">
        <div v-if="logs.length === 0" class="empty-log">正在等待网关物理报文广播流入...</div>
        <div 
          v-for="(log, idx) in logs" 
          :key="idx" 
          class="log-line"
          :class="{ 'alarm-line': log.temperature > 85 }"
        >
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-device">节点: {{ log.deviceId }}</span>
          <span class="log-data">物理量监测 -> 温度: <strong :class="{ 'text-danger': log.temperature > 85 }">{{ log.temperature }}°C</strong> | 振幅: {{ log.vibration }}mm/s</span>
        </div>
      </div>
    </div>

    <div class="ai-card" :class="{ 'ai-card-active': aiResult }">
      <div class="ai-header">
        <h4>🤖 DeepSeek AI Tool Calling 工业故障判定决策链</h4>
        <span v-if="isAiLoading" class="ai-status loading-text">正在分析...</span>
        <span v-else class="ai-status text-muted">边缘拦截就绪</span>
      </div>
      
      <div class="ai-body">
        <div v-if="!isAiLoading && !aiResult" class="ai-placeholder">
          物理层阈值安全。若温度跨越临界点（>85°C），系统将自动截获瞬时异常帧，激活大模型结构化决策。
        </div>

        <div v-if="isAiLoading" class="ai-loading-view">
          <div class="spinner"></div>
          <p>网关拦截成功！正在向 DeepSeek 注入工具 Schema 并强制唤醒 Function Calling 决策管道...</p>
        </div>

        <div v-if="!isAiLoading && aiResult" class="ai-result-content">
          <div class="result-row">
            <span class="res-label text-warning">🚨 诊断级别:</span>
            <span class="res-val highlight-status">{{ aiResult.status }}</span>
          </div>
          <div class="result-row">
            <span class="res-label text-info">🔍 根本原因:</span>
            <span class="res-val">{{ aiResult.reason }}</span>
          </div>
          <div class="result-row">
            <span class="res-label text-success">🛠️ 处置建议:</span>
            <span class="res-val font-bold">{{ aiResult.advice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// 1. 核心响应式变量定义
const logs = ref([])
const isAiLoading = ref(false)
const aiResult = ref(null)
const activeAlarm = ref(null)
const logContainer = ref(null)
let ws = null

/**
 * 🎯 2. 大模型 Tool Calling 结构化参数矩阵 (JSON Schema)
 * 面试对线核心：严格遵循企业级工业设备诊断规范定义
 */
const deviceTools = [
  {
    type: "function",
    function: {
      name: "analyze_device_anomaly",
      description: "当传感器物理数值（如温度）越过安全阈值时，触发此函数进行设备故障深度诊断并输出标准决策 JSON 数据",
      parameters: {
        type: "object",
        properties: {
          fault_level: {
            type: "string",
            enum: ["二级热工核心橙色预警", "一级热工紧急红色危急", "常规物理数值越轨告警"],
            description: "根据当前上下文判定物理故障的严重级别"
          },
          root_cause: {
            type: "string",
            description: "导致高频数据异常的物理底层根本原因分析（例如：主轴承磨损、线圈过载负荷、散热栅格堵塞等）"
          },
          advice: {
            type: "string",
            description: "给一线现场运维工程师的具体排查指引与抢修处置闭环建议"
          }
        },
        required: ["fault_level", "root_cause", "advice"]
      }
    }
  }
];

/**
 * 🎯 3. 真实 DeepSeek 大模型 Tool Calling 异步调度引擎
 */
const triggerAiAnalysis = async () => {
  if (isAiLoading.value) return
  isAiLoading.value = true
  aiResult.value = null // 清空上一帧结果

  // 捕获突发告警时刻的真实物理上下文
  const currentDeviceId = activeAlarm.value?.deviceId || 'Gateway-NODE-03'
  const currentTemp = activeAlarm.value?.temperature || 86

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_DEEPSEEK_API_KEY" // 💡 实际运行时替换为你真实的 DeepSeek API Key
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个物联网大屏幕的智能中控专家。当接收到物理设备异常报文时，你必须调用 analyze_device_anomaly 工具来输出结构化的故障判定结果，严禁输出任何自然语言废话。"
          },
          {
            role: "user",
            content: `【网关物理拦截桩报告】物理网关遭遇突发高频流冲刷。设备节点ID: ${currentDeviceId}，传感器实时温度溢出: ${currentTemp}°C。请立刻使用工具进行故障诊断！`
          }
        ],
        tools: deviceTools,
        tool_choice: { 
          type: "function", 
          function: { name: "analyze_device_anomaly" } 
        }
      })
    })

    if (!response.ok) throw new Error(`HTTP 异常代码: ${response.status}`)

    const result = await response.json()
    const message = result.choices[0].message

    // 精准解构 Tool Calls 返回
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]
      
      if (toolCall.function.name === "analyze_device_anomaly") {
        // 抓取并解析由 Schema 强约束吐出的标准结构化 JSON 字符串
        const argumentsObj = JSON.parse(toolCall.function.arguments)
        
        // 映射回前端模板 UI 对应的变量字段，实现无缝渲染
        aiResult.value = {
          status: argumentsObj.fault_level,
          reason: argumentsObj.root_cause,
          advice: argumentsObj.advice
        }
      }
    } else {
      // 降级文本兼容
      aiResult.value = {
        status: "⚠️ 动态拦截提示",
        reason: "大模型本次交互未正常触发 Tool Calling 链路",
        advice: message.content || "未获取到有效的决策指令。"
      }
    }
  } catch (error) {
    console.error("AI 故障决策链路重创:", error)
    aiResult.value = {
      status: "❌ AI 决策管道异常",
      reason: error.message,
      advice: "请检查本地代码中的 API 密钥、科学上网代理或网络直连通道配置。"
    }
  } finally {
    isAiLoading.value = false
    activeAlarm.value = null // 挂起并释放当前告警锁
  }
}

// 4. WebSocket 高频全栈数据网关通信连接
const connectGateway = () => {
  // 🎯 端口已精确同步修正为 8081，完美对接 server/index.js
  ws = new WebSocket('ws://localhost:8081')

  ws.onmessage = (event) => {
    const rawData = JSON.parse(event.data)
    
    // 滑动窗口机制（Sliding Window Buffer）：限制DOM总数，优化高频吞吐渲染
    if (logs.value.length >= 50) {
      logs.value.shift()
    }
    logs.value.push(rawData)

    // 自动滚动日志视窗
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })

    // 高频数值阈值拦截器：如果温度突破 85°C 临界值，且大模型管道空闲，立即进入协同
    if (rawData.temperature > 85 && !isAiLoading.value && !aiResult.value) {
      activeAlarm.value = rawData
      triggerAiAnalysis()
    }
  }

  ws.onclose = () => {
    console.log('与 Node.js 8081 通信网关断开，5秒后尝试重连...')
    setTimeout(connectGateway, 5000)
  }
}

const clearLogs = () => {
  logs.value = []
  aiResult.value = null
}

const disconnectGateway = () => {
  if (ws) {
    ws.close()
  }
}

// 5. 组件生命周期挂载
onMounted(() => {
  connectGateway()
})

onBeforeUnmount(() => {
  disconnectGateway()
})
</script>

<style scoped>
.iot-console {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
}

.control-card, .log-card, .ai-card {
  background: rgba(16, 20, 35, 0.95);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

h3, h4 {
  margin: 0 0 10px 0;
  color: #00b4ff;
  text-shadow: 0 0 5px rgba(0, 180, 255, 0.5);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  font-size: 13px;
}

.status-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 4px;
}

.label { color: #8a99ad; margin-right: 5px; }
.highlighting { color: #ffea00; font-weight: bold; }
.badge { color: #00ffcc; font-weight: bold; }

.card-header, .ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.btn-clear {
  background: #ff3b30;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-clear:hover { background: #d32f2f; }

.log-container {
  height: 180px;
  overflow-y: auto;
  background: #050814;
  border: 1px solid #111e38;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.log-line {
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
  white-space: nowrap;
}

.alarm-line {
  background: rgba(255, 59, 48, 0.15);
  animation: pulse 2s infinite;
}

.text-danger { color: #ff3b30; font-weight: bold; }
.log-time { color: #5c6370; margin-right: 8px; }
.log-device { color: #e5c07b; margin-right: 8px; }
.log-data { color: #abb2bf; }

.ai-card {
  border-color: rgba(0, 255, 204, 0.2);
  transition: all 0.3s ease;
}
.ai-card-active {
  border-color: rgba(255, 234, 0, 0.4);
  box-shadow: 0 0 15px rgba(255, 234, 0, 0.1);
}

.ai-status { font-size: 12px; font-weight: bold; }
.text-muted { color: #5c6370; }
.loading-text { color: #ffea00; animation: blink 1s infinite; }

.ai-placeholder {
  text-align: center;
  color: #5c6370;
  font-size: 13px;
  padding: 20px 0;
}

.ai-loading-view {
  text-align: center;
  padding: 15px 0;
  color: #ffea00;
  font-size: 13px;
}

.spinner {
  border: 3px solid rgba(255, 234, 0, 0.1);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border-left-color: #ffea00;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px auto;
}

.ai-result-content {
  background: rgba(0, 255, 204, 0.03);
  border: 1px solid rgba(0, 255, 204, 0.1);
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
}

.result-row {
  margin-bottom: 8px;
  line-height: 1.5;
}
.result-row:last-child { margin-bottom: 0; }

.res-label { font-weight: bold; margin-right: 8px; display: inline-block; width: 85px; }
.res-val { color: #e5c07b; }
.highlight-status { color: #ff3b30; font-weight: bold; background: rgba(255,59,48,0.1); padding: 2px 6px; border-radius: 3px; }
.font-bold { color: #00ffcc; font-weight: bold; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes pulse { 0% { background: rgba(255, 59, 48, 0.1); } 50% { background: rgba(255, 59, 48, 0.25); } 100% { background: rgba(255, 59, 48, 0.1); } }
</style>