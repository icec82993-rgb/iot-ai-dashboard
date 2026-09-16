import { WebSocketServer } from 'ws';
import mqtt from 'mqtt';

// 1. 初始化 WebSocket 服务 (监听 8081 端口，给 Vue 前端供数)
const wss = new WebSocketServer({ port: 8081 });
console.log('🚀 [IoT Gateway] Node.js 网关服务已启动，正在监听 WebSocket 端口 8081...');

// 2. 连接 Linux 本地的真实 Mosquitto MQTT Broker (默认端口 1883)
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883');

mqttClient.on('connect', () => {
  console.log('✅ [MQTT Client] 成功连接至 Linux Mosquitto Broker (127.0.0.1:1883)');
  // 订阅工业传感器主题
  mqttClient.subscribe('coal/sensor', (err) => {
    if (!err) {
      console.log('📡 [MQTT Client] 已成功订阅 Topic: coal/sensor');
    }
  });
});

// 3. 收到真实 MQTT 报文时，经由 WebSocket 管道实时广播给 Vue 前端
mqttClient.on('message', (topic, message) => {
  const payloadStr = message.toString();
  console.log(`📩 [MQTT -> Gateway] 收到报文 [${topic}]: ${payloadStr}`);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 代表 WebSocket.OPEN
      client.send(payloadStr);
    }
  });
});

wss.on('connection', (ws) => {
  console.log('🔗 [Gateway] 前端大屏可视化客户端已成功建立 WebSocket 管道。');
  ws.on('close', () => {
    console.log('❌ [Gateway] 前端客户端已断开连接。');
  });
});