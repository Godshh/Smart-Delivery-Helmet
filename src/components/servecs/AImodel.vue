<template>
  <div class="model-container">
    <canvas
      width="160"
      height="120"
      id="model"
      @click="handleModelClick"
    ></canvas>
    <div class="bubble" v-show="bubbleText">
      {{ bubbleText }}
    </div>
    <div id="coze-chat" class="coze-chat-container"></div>
  </div>
</template>

<script>
import axios from 'axios';
import eventBus from '@/eventBus.js';

export default {
  data() {
    return {
      bubbleText: '',
      audioUnlocked: false,
      AK: process.env.VUE_APP_BAIDU_AK || '6AUG6BWiQIbiYq5OjxmFfsWZ',
      SK: process.env.VUE_APP_BAIDU_SK || 'HK3jC1cDP3hPYc6pHD4StUqaq00DcWrC',
      COZE_API_TOKEN: process.env.VUE_APP_COZE_API_TOKEN || 'sat_hue6vKFU0tsq9xnS6qky9WWPdC0o3rZayjhlG0Wol7uqyKzDcCeXWV0fNIBdPkjx',
      COZE_BOT_ID: '7539489427022888979',
      onSpeckRegistered: false,
      lastSpeakTime: 0,
      isSpeaking: false,
      messages: [{ role: 'system', content: '我是你的外卖员助手，如何帮助你？' }],
      wakeWord: '你好小盔盔',
      accessToken: '',
      tokenExpires: 0,
      cozeClient: null,
    };
  },
  mounted() {
    console.log('aimodel.vue mounted:', Date.now());
    // Initialize Live2D model
    const dir = `/live2d-widget-model-wanko/assets/wanko.model.json`;
    const url = 'https://cdn.jsdelivr.net/gh/QiShaoXuan/live2DModel@1.0.0' + dir;
    loadlive2d('model', url);

    // Register onSpeck event
    if (!this.onSpeckRegistered) {
      this.onSpeckHandler = (text) => {
        console.log(`onSpeck received: ${text}, current route: ${this.$route.name}`);
        this.initAudio();
        this.speak(text);
      };
      eventBus.on('onSpeck', this.onSpeckHandler);
      this.onSpeckRegistered = true;
      console.log('eventBus.on("onSpeck") registered');
    }

    // Load Baidu TTS SDK
    const ttsScript = document.createElement('script');
    ttsScript.src = 'https://tts-api.ai.baidu.com/btts.js';
    ttsScript.onload = () => console.log('Baidu TTS SDK loaded successfully');
    ttsScript.onerror = () => console.error('Failed to load Baidu TTS SDK');
    document.head.appendChild(ttsScript);

    // Load Coze Web SDK
    const cozeScript = document.createElement('script');
    cozeScript.src = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js';
    cozeScript.onload = () => {
      console.log('Coze Web SDK loaded successfully');
      this.initCozeChat();
    };
    cozeScript.onerror = () => console.error('Failed to load Coze Web SDK');
    document.head.appendChild(cozeScript);

    // Initialize Baidu TTS Access Token
    this.getAccessToken()
      .then((token) => console.log('Baidu Access Token initialized:', token))
      .catch((error) => console.error('Failed to initialize Baidu Access Token:', error));
  },
  beforeUnmount() {
    if (this.onSpeckRegistered) {
      eventBus.off('onSpeck', this.onSpeckHandler);
      this.onSpeckRegistered = false;
      console.log('eventBus.off("onSpeck") cleaned up');
    }
  },
  methods: {
    async getAccessToken() {
      if (this.accessToken && Date.now() < this.tokenExpires) {
        return this.accessToken;
      }
      try {
        const res = await axios.get('http://localhost:3000/baidu/oauth/2.0/token', {
          params: {
            grant_type: 'client_credentials',
            client_id: this.AK,
            client_secret: this.SK,
          },
        });
        if (!res.data.access_token) {
          throw new Error('No access token in response');
        }
        this.accessToken = res.data.access_token;
        this.tokenExpires = Date.now() + (res.data.expires_in * 1000 - 60000);
        console.log('Baidu Access Token fetched:', this.accessToken);
        return this.accessToken;
      } catch (error) {
        console.error('Failed to fetch Baidu Access Token:', error);
        throw error;
      }
    },
    async speak(text) {
      if (!text) {
        console.warn('No text provided for speech');
        return;
      }
      const now = Date.now();
      const speakId = now;
      if (now - this.lastSpeakTime < 1000 || this.isSpeaking) {
        console.log(`speak [ID: ${speakId}]: Ignored due to recent call or ongoing speech: ${text}`);
        return;
      }
      this.lastSpeakTime = now;
      this.isSpeaking = true;
      console.log(`speak [ID: ${speakId}]: ${text}`);

      this.bubbleText = text;
      setTimeout(() => {
        this.bubbleText = '';
        console.log('Cleared bubble text');
      }, 3000);

      try {
        const token = await this.getAccessToken();
        if (typeof window.btts !== 'function') {
          throw new Error('Baidu TTS SDK not loaded');
        }
        window.btts(
          {
            tex: text,
            tok: token,
            spd: 5,
            pit: 5,
            vol: 15,
            per: 4143,
            ctp: 1,
            lan: 'zh',
          },
          {
            volume: 0.8,
            autoDestory: true,
            hidden: true,
            onSuccess: (audio) => {
              console.log(`TTS success [ID: ${speakId}]`);
              audio
                .play()
                .then(() => {
                  console.log(`Audio played [ID: ${speakId}]`);
                  this.isSpeaking = false;
                })
                .catch((err) => {
                  console.error(`Audio playback failed [ID: ${speakId}]:`, err);
                  this.isSpeaking = false;
                });
            },
            onError: (err) => {
              console.error(`TTS failed [ID: ${speakId}]:`, err);
              this.isSpeaking = false;
            },
            onTimeout: () => {
              console.error(`TTS timeout [ID: ${speakId}]`);
              this.isSpeaking = false;
            },
          }
        );
      } catch (error) {
        console.error(`Speech failed [ID: ${speakId}]:`, error);
        this.isSpeaking = false;
      }
    },
    initAudio() {
      if (this.audioUnlocked) return;
      const audio = new Audio();
      audio.play().catch((error) => {
        console.warn('Failed to unlock audio:', error);
      });
      this.audioUnlocked = true;
      console.log('Audio unlocked');
    },
    initCozeChat() {
      if (typeof CozeWebSDK === 'undefined') {
        console.error('CozeWebSDK not loaded');
        return;
      }
      try {
        this.cozeClient = new CozeWebSDK.WebChatClient({
          config: {
            bot_id: this.COZE_BOT_ID,
            el: '#coze-chat', // Explicitly bind to the DOM element
          },
          componentProps: {
            title: 'Coze Assistant',
            layout: 'pc', // Ensure layout is compatible
          },
          auth: {
            type: 'token',
            token: this.COZE_API_TOKEN,
            onRefreshToken: () => this.COZE_API_TOKEN,
          },
        });
        console.log('Coze Web SDK initialized');
      } catch (error) {
        console.error('Failed to initialize Coze Web SDK:', error);
      }
    },
    handleModelClick() {
      const replies = [
        '天气怎么样呀～',
        'gogogo出发喽！',
        '喜欢兜风吗？小盔最喜欢了！',
        '和我一起去冒险吧！',
        '你在想什么呢？',
        '我在这里等你哦！',
      ];
      const randomText = replies[Math.floor(Math.random() * replies.length)];
      this.speak(randomText);
    },
    testSpeak() {
      this.initAudio();
      this.speak('测试语音：绿灯剩余10秒，请做好准备');
    },
  },
};
</script>

<style scoped>
.model-container {
  position: fixed;
  right: 0;
  bottom: 0;
}
.bubble {
  position: absolute;
  bottom: 130px;
  right: 40px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 14px;
  max-width: 200px;
  z-index: 100000;
  pointer-events: none;
  white-space: nowrap;
  animation: fadeout 3s forwards;
}
@keyframes fadeout {
  0% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-20px); }
}
#model {
  position: fixed;
  right: 0px;
  bottom: 0;
  z-index: 99999;
  pointer-events: auto;
}
.coze-chat-container {
  position: fixed;
  bottom: 150px;
  right: 10px;
  width: 300px;
  height: 400px;
  z-index: 1000;
}
</style>