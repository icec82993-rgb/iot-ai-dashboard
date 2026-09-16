# 陕北矿业井下通风与设备状态实时监控平台

本系统针对采矿工程井下安全监控场景，设计并实现了一套工业级边缘物联网（IoT）数据采集与实时传输系统。架构基于 Linux/Ubuntu 环境部署 MQTT 消息中间件，配合 Node.js 边缘通讯网关与 Vue3 可视化大屏，实现了井下传感器报文的高频低时延解析、跨协议分发与毫秒级图表渲染。

---

## 🛠 核心技术栈与网络架构

* **物理采集仿真层**：Python 3 (`paho-mqtt`)
* **消息中间件 (Broker)**：Linux (WSL2/Ubuntu 22.04) + Mosquitto (MQTT 协议，端口 `1883`)
* **边缘通讯网关 (Gateway)**：Node.js (ES Modules) + `mqtt.js` + `ws` (WebSocket，端口 `8081`)
* **前端可视化层**：Vue 3 + Vite + ECharts

### 数据通信流转图

```text
[井下仿真传感器 (Python)]
         │
         ▼  MQTT 报文 (TCP :1883 / Topic: coal/sensor)
[Mosquitto MQTT Broker (Linux/WSL2)]
         │
         ▼  Pub/Sub 模式异步订阅
[边缘通讯网关 (Node.js Gateway)]
         │
         ▼  WebSocket 长连接广播 (WS :8081)
[井下安全监控大屏 (Vue3 + ECharts)]


系统部署与运行指南
1. 启动 Linux MQTT Broker
在 Linux (Ubuntu / WSL2) 环境下检查并启动 Mosquitto 服务：

Bash
sudo service mosquitto status
# 如未启动，运行以下命令：
sudo service mosquitto start
2. 启动 Node.js 边缘网关
进入后端项目根目录，安装依赖并启动通讯网关：

Bash
npm install
node server/index.js
控制台将打印 ✅ [MQTT Client] 成功连接至 Linux Mosquitto Broker 及 🚀 [IoT Gateway] Node.js 网关服务已启动。

3. 启动 Vue3 前端大屏
Bash
npm run dev
根据控制台提示在浏览器中打开页面（通常为 http://localhost:5173）。

4. 运行井下传感器数据模拟器
在 Linux 终端中运行 Python 数据仿真脚本：

Bash
python3 mock_sensor.py
脚本将以 1 秒/次的频率自动推送瓦斯浓度、设备温度及机身振动幅度等采样报文。

📊 监控平台核心功能
实时报文广播：边缘网关自动接收 MQTT 报文并通过 WebSocket 分发，避免 HTTP 轮询带来的带宽浪费与高时延。

安全阈值预警：支持对瓦斯浓度（>1.0%）与设备机温（>85℃）跨越临界值时触发实时警报提示。

动态图表平滑渲染：基于 ECharts 实现滑动窗口数据更新，真实还原井下采掘面环境监控曲线。