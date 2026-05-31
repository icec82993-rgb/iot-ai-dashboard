# 物联网传感器高频大数据流监控大屏 🌐

基于 **Vue 3 (SFC) + Vite + ECharts + Node.js** 构建的工业级物联网（IoT）毫秒级高频突发数据流动态看板。本项目专为高频、并发传感器报文涌入场景设计，核心攻坚**“全栈高频数据管道调度”**、**“前端低延迟增量渲染”**与**“大模型 Tool Calling 在工业故障诊断中的落地应用”**。

---

## 🚀 核心全栈技术栈 (Full-Stack Infrastructure)
* **后端网关层**：Node.js 异步非阻塞架构、WebSocket (ws) 高频双向数据管道驱动（向下仿真订阅 MQTT 物理报文广播）
* **前端可视层**：Vue 3 (Composition API / <script setup> 规范)、ECharts 5.x (Canvas 高性能双轴动态渲染)
* **AI 智能化链路**：DeepSeek LLM 大模型、Function Calling / Tool Calling 结构化故障决策链协同

---

## ⚡ 工业级技术攻坚防线 (Performance & Architecture)

### 1. 跨端全栈异步数据流调度（Node.js + WebSocket 网关）
* **设计方案**：项目自研轻量级 Node.js 服务端作为物理层网关。下位机高频传感器接收到 MQTT 报文流入后，由网关通过异步非阻塞事件循环进行消息解析，封装为毫秒级突发高频流，再利用双向 WebSocket 管道直连 Vue 前端进行瞬时广播，彻底摆脱传统 HTTP 拉取产生的严重时间延迟。

### 2. 智能化协同决策（DeepSeek AI Tool Calling 应用）
* **设计方案**：在 Vue 前端架构中设计高频数值阈值拦截器（拦截点：温度 > 85°C 物理临界值）。一旦触发，系统自动截获当前帧上下文，作为动态参数编排进 System Prompt，向大模型发起协同调用。利用 Tool Calling 机制强制约束模型输出结构化 JSON，实现对复杂物理设备故障的秒级原因判定与运维建议分发。

### 3. 前端响应式依赖解耦（去 Proxy 深度劫持）
* **性能优化**：若将 ECharts 底层坐标数据挂载在 Vue 的 `ref` 上，高频涌入的坐标点会引发 Proxy 极其剧烈的深度依赖追踪内耗。本项目将核心时间轴、温度、振幅数据强制隔离在普通的 JavaScript 原生数组中，与 Vue 侦听器完全解耦，攻克了高频场景下的 CPU 内存暴涌问题。

### 4. 滑动窗口缓冲区与增量像素渲染
* **性能优化**：控制台与图表层架设长度固定为 50 的滑动窗口（Sliding Window Buffer），通过 `shift()` 剔除历史过期节点，严格锁定页面 DOM 总数。图表放弃全量 `setOption` 重绘，仅传入增量数据补丁，由 ECharts 执行局部像素重组，渲染吞吐率大幅提升。

---

## 📁 规范化企业级组件架构
```text
├── server/
│   └── index.js          # 高性能 Node.js 通信网关 (仿真 MQTT 转发)
├── src/
│   ├── components/
│   │   ├── IotChart.vue   # ECharts 纯净渲染引擎 (负责增量补丁追加)
│   │   └── IotConsole.vue # 控制台主枢纽 (负责真实网关接收与 AI 协同分析)
│   └── App.vue           # 父级全栈数据中转总管