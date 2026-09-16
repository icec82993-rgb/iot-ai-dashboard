import mqtt from 'mqtt';
import { WebSocketServer } from 'ws';

// 1. 连接 Linux 本地的 Mosquitto 服务
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883');

// 2. 启动 WebSocket 服务，给前端提供数据
const wss = new WebSocketServer({ port: 8081 });

let wsClient = null;

// MQTT 连接成功后的回调
mqttClient.on('connect', () => {
  console.log('MQTT 连接成功了！');
  // 订阅煤矿传感器的 topic
  mqttClient.subscribe('coal/sensor', (err) => {
    if (!err) {
      console.log('成功订阅了 coal/sensor 主题');
    }
  });
});

// 监听 WebSocket 连接（前端连进来）
wss.on('connection', (ws) => {
  console.log('Vue 前端连上来了！');
  wsClient = ws;
});

// 收到 MQTT 传感器数据时的处理
mqttClient.on('message', (topic, message) => {
  const dataStr = message.toString();
  console.log('收到传感器数据:', dataStr);

  // 如果前端页面开着，就把数据发给前端
  if (wsClient && wsClient.readyState === 1) {
    wsClient.send(dataStr);
  }
});