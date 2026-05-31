const WebSocket = require('ws');

// 1. 初始化本地高性能 WebSocket 服务器 (监听 8081 端口)
const wss = new WebSocket.Server({ port: 8081 });
console.log('🚀 [IoT Gateway] Node.js 网关服务已启动，正在监听端口 8081...');

// 2. 模拟 MQTT 代理服务器的数据流入 (生产环境下此处为 mqtt.connect)
const simulateMqttBroker = (callback) => {
  setInterval(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    
    // 组装传感器高频报文
    const rawPayload = {
      time: timeStr,
      deviceId: Math.floor(Math.random() * 5) + 1001,
      val1: (Math.random() * 35 + 55).toFixed(2), // 模拟温度，偶发性超过 85°C 触发异常阈值
      val2: (Math.random() * 5).toFixed(2)         // 振幅
    };
    callback(JSON.stringify(rawPayload));
  }, 50); // 50ms 高频吐字数据
};

// 3. 网关路由调度：接收 MQTT 报文并实时广播给 Vue 前端
wss.on('connection', (ws) => {
  console.log('🔗 [Gateway] 前端大屏可视化客户端已成功建立 WebSocket 管道。');
  
  const sendData = (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  };

  // 启动物联网数据流
  simulateMqttBroker(sendData);

  ws.on('close', () => {
    console.log('❌ [Gateway] 前端客户端已断开连接。');
  });
});