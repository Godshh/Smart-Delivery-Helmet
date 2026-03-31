// mediasoup-config.js（用于服务端）

exports.mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  }
];

exports.webRtcTransportOptions = {
  listenIps: [
    { ip: '0.0.0.0', announcedIp: null }, // 如果部署远程可以写公网 IP
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

