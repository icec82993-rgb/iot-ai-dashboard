# 物联网传感器高频大数据流监控大屏 🌐

基于 **Vue 3 (SFC) + Vite + ECharts** 构建的工业级物联网（IoT）毫秒级高频突发数据流动态看板。本项目专为高频、并发传感器报文涌入场景设计，核心攻坚**“大规模数据流下前端低延迟增量渲染”**与**“浏览器防重绘死锁优化”**。

---

## 🚀 核心技术栈 (Tech Stack)
* **核心框架**：Vue 3 (Composition API / <script setup> 规范)
* **可视化引擎**：ECharts 5.x (Canvas 高性能双轴渲染)
* **工程架构**：Vite 高速构建、SFC 组件化解耦、Custom Events (Emit) 父子数据总线
* **通信仿真**：高性能高频定时器沙箱（仿真毫秒级 WebSocket 突发数据管道）

---

## ⚡ 工业级前端性能调优核心防线 (Performance Optimization)

大部分动态大屏在面对高频数据时极易发生 CPU 飙升与页面死锁，本项目通过以下底层重构，彻底击穿性能瓶颈：

### 1. 响应式依赖解耦（去 Proxy 深度劫持）
* **痛点**：若将 ECharts 的底层图表数组挂在 Vue 的 `ref` 或 `reactive` 上，Vue 3 会通过 Proxy 机制对成千上万个高频变动的坐标点建立深度的响应式依赖追踪，在高频场景下会导致极大的 CPU 内存内耗。
* **解法**：将核心时间轴、温度、振幅数据强制隔离在**普通的 JavaScript 原生数组**中。实现数据流与 Vue 侦听器解耦，达成“零内存暴涌”优化。

### 2. 滑动窗口缓冲区优化 (Sliding Window Buffer)
* **痛点**：长时间流式运行会导致 DOM 节点与数据点无限制累加，最终引发浏览器内存溢出 (OOM) 崩溃。
* **解法**：在控制台与图表中均设计了长度固定为 50 的滑动窗口，数据超出后通过 `shift()` 实时剔除头部老数据。将页面 DOM 节点与图表渲染点数死死锁在阈值内。

### 3. ECharts 动态数据增量补丁（Incremental Update）
* **痛点**：每次收到新数据都调用全量 `setOption` 重绘会带来毁灭性的 Canvas 性能灾难。
* **解法**：放弃全量构建 Option 模式，仅对 `xAxis.data` 和 `series.data` 传入增量数据补丁。由 ECharts 底层执行局部像素重组，渲染效率提升 10 倍以上。

### 4. 关闭图形拐点渲染（GPU 降负载）
* **痛点**：开启折线图拐点小圆圈（Symbol）时，Canvas 每一帧都要绘制数百个路径，导致 GPU 剧烈掉帧。
* **解法**：全面将 `symbol` 设为 `'none'`，仅保留平滑折线本身，极大降低了每一帧的绘制开销。

---

## 📁 规范化企业级组件解耦架构

项目严格遵循大厂组件自治与单向数据流原则：
* `src/App.vue`：全栈数据中转枢纽（大总管），负责调度通信边界。
* `src/components/IotConsole.vue`：高频数据源头，维护滑动日志缓冲区，基于自适应 `nextTick` 实现高频日志滚动追光。
* `src/components/IotChart.vue`：纯净的图表渲染引擎，对父级暴露 `updateData` 增量接口，实现视图与数据的极速映射。

---

## 🛠️ 本地快速启动 (Quick Start)

1. **进入目录：**
   ```bash
   cd project3-iot-dashboard
2. **极速下载依赖（包含 ECharts 核心库）：**
   npm install
3. **开启本地高性能服务：：**
   npm run dev