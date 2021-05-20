import { types as mediasoupTypes } from 'mediasoup';

const logLevel: mediasoupTypes.WorkerLogLevel = 'debug';
const logTags: mediasoupTypes.WorkerLogTag[] = [
  'info',
  'ice',
  'dtls',
  'rtp',
  'srtp',
  'rtcp',
  // 'rtx',
  // 'bwe',
  // 'score',
  // 'simulcast',
  // 'svc'
];

const router: mediasoupTypes.RouterOptions = {
  mediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: {
        //                'x-google-start-bitrate': 1000
      },
    },
    {
      kind: 'video',
      mimeType: 'video/h264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '4d0032',
        'level-asymmetry-allowed': 1,
        //						  'x-google-start-bitrate'  : 1000
      },
    },
    {
      kind: 'video',
      mimeType: 'video/h264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
        //						  'x-google-start-bitrate'  : 1000
      },
    },
  ],
};

const webRtcTransport: mediasoupTypes.WebRtcTransportOptions = {
  listenIps: [
    { ip: '127.0.0.1', announcedIp: undefined },
    // { ip: "192.168.42.68", announcedIp: null },
    // { ip: '10.10.23.101', announcedIp: null },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 100000000,
};

export default {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel,
    logTags,
  },
  router,

  // rtp listenIps are the most important thing, below. you'll need
  // to set these appropriately for your network for the demo to
  // run anywhere but on localhost
  webRtcTransport,
  
  maxIncomingBitrate: 1500000,
  numWorkers: 1,
};
