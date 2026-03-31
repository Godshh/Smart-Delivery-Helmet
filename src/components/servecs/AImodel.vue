<template>
  <div class="model-container">
    <canvas width="160" height="120" id="model" @click="handleModelClick"></canvas>
    <div class="bubble" v-show="bubbleText">{{ bubbleText }}</div>

    <!-- 悬浮按钮 -->
    <div class="wm-fab" @click="toggleChat" :class="{ open: chatOpen }">
      <span class="fab-icon">{{ chatOpen ? '✕' : '🛵' }}</span>
      <span class="fab-label" v-if="!chatOpen">小盔助手</span>
    </div>

    <!-- 自定义聊天弹窗 -->
    <div class="wm-chat-panel" v-show="chatOpen">
      <!-- 头部 -->
      <div class="wm-chat-header">
        <div class="header-left">
          <div class="header-avatar">🛵</div>
          <div class="header-info">
            <div class="header-title">小盔外卖助手</div>
            <div class="header-status">
              <span class="status-dot"></span>在线配送中
            </div>
          </div>
        </div>
        <div class="header-tags">
          <span class="tag">⚡ 极速</span>
          <span class="tag">🔥 热门</span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="msg-list" ref="msgList">
        <div class="welcome-msg" v-if="messages.length === 0">
          <div class="welcome-icon">🛵</div>
          <div class="welcome-text">你好！我是小盔外卖助手<br>有什么可以帮你的？</div>
        </div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['msg-bubble', msg.role === 'user' ? 'user' : 'bot']"
        >
          <div class="bot-avatar" v-if="msg.role === 'assistant'">🛵</div>
          <div class="bubble-content">{{ msg.content }}</div>
        </div>
        <!-- 流式回复中：有内容显示文字，无内容显示三点 -->
        <div v-if="streaming" class="msg-bubble bot">
          <div class="bot-avatar">🛵</div>
          <div v-if="streamingText" class="bubble-content">{{ streamingText }}<span class="cursor">|</span></div>
          <div v-else class="bubble-content typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <input
          v-model="inputText"
          @keyup.enter="sendMessage"
          placeholder="问我外卖相关问题～"
          :disabled="streaming"
          ref="inputRef"
        />
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="streaming || !inputText.trim()"
          :class="{ loading: streaming }"
        >
          <span v-if="!streaming">发送</span>
          <span v-else class="btn-spin">⟳</span>
        </button>
      </div>
    </div>
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
      COZE_BOT_ID: '7582114671051243520',
      onSpeckRegistered: false,
      lastSpeakTime: 0,
      isSpeaking: false,
      accessToken: '',
      tokenExpires: 0,
      // 聊天状态
      chatOpen: false,
      messages: [],
      inputText: '',
      streaming: false,
      streamingText: '',
    };
  },
  mounted() {
    // Live2D
    const dir = `/live2d-widget-model-wanko/assets/wanko.model.json`;
    const url = 'https://cdn.jsdelivr.net/gh/QiShaoXuan/live2DModel@1.0.0' + dir;
    loadlive2d('model', url);

    // 注册 onSpeck 事件
    if (!this.onSpeckRegistered) {
      this.onSpeckHandler = (text) => {
        this.initAudio();
        this.speak(text);
      };
      eventBus.on('onSpeck', this.onSpeckHandler);
      this.onSpeckRegistered = true;
    }

    // 加载百度 TTS SDK
    const ttsScript = document.createElement('script');
    ttsScript.src = 'https://tts-api.ai.baidu.com/btts.js';
    ttsScript.onerror = () => console.error('Failed to load Baidu TTS SDK');
    document.head.appendChild(ttsScript);

    // 预取 Baidu Token
    this.getAccessToken().catch(() => {});
  },
  beforeUnmount() {
    if (this.onSpeckRegistered) {
      eventBus.off('onSpeck', this.onSpeckHandler);
      this.onSpeckRegistered = false;
    }
  },
  methods: {
    // ── Baidu TTS ──────────────────────────────────────────
    async getAccessToken() {
      if (this.accessToken && Date.now() < this.tokenExpires) {
        return this.accessToken;
      }
      const res = await axios.get('/baidu/oauth/2.0/token', {
        params: {
          grant_type: 'client_credentials',
          client_id: this.AK,
          client_secret: this.SK,
        },
      });
      if (!res.data.access_token) throw new Error('No access token');
      this.accessToken = res.data.access_token;
      this.tokenExpires = Date.now() + (res.data.expires_in * 1000 - 60000);
      return this.accessToken;
    },

    async speak(text) {
      if (!text || this.isSpeaking) return;
      this.isSpeaking = true;
      this.bubbleText = text;
      setTimeout(() => { this.bubbleText = ''; }, 3000);
      try {
        const token = await this.getAccessToken();
        if (typeof window.btts !== 'function') throw new Error('btts not loaded');
        window.btts(
          { tex: text, tok: token, spd: 5, pit: 5, vol: 15, per: 4143, ctp: 1, lan: 'zh' },
          {
            volume: 0.8, autoDestory: true, hidden: true,
            onSuccess: (audio) => {
              this._currentAudio = audio;
              audio.play()
                .then(() => { this._currentAudio = null; this.isSpeaking = false; })
                .catch(() => { this._currentAudio = null; this.isSpeaking = false; });
            },
            onError: () => { this.isSpeaking = false; },
            onTimeout: () => { this.isSpeaking = false; },
          }
        );
      } catch {
        this.isSpeaking = false;
      }
    },

    initAudio() {
      if (this.audioUnlocked) return;
      new Audio().play().catch(() => {});
      this.audioUnlocked = true;
    },

    handleModelClick() {
      const replies = ['天气怎么样呀～', 'gogogo出发喽！', '喜欢兜风吗？小盔最喜欢了！', '和我一起去冒险吧！'];
      this.speak(replies[Math.floor(Math.random() * replies.length)]);
    },

    // ── 聊天窗口 ────────────────────────────────────────────
    toggleChat() {
      this.chatOpen = !this.chatOpen;
      if (this.chatOpen) {
        this.$nextTick(() => this.$refs.inputRef?.focus());
      }
    },

    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.streaming) return;
      this.inputText = '';
      this.messages.push({ role: 'user', content: text });
      this.scrollToBottom();

      this.streaming = true;
      this.streamingText = '';

      try {
        const res = await fetch('/coze/v3/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.COZE_API_TOKEN}`,
          },
          body: JSON.stringify({
            bot_id: this.COZE_BOT_ID,
            user_id: 'xtk-user',
            stream: true,
            auto_save_history: true,
            additional_messages: [{ role: 'user', content: text, content_type: 'text' }],
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // 按空行分割 SSE 事件块
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop(); // 保留不完整的块
          for (const block of blocks) {
            let eventName = '';
            let dataStr = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) dataStr = line.slice(5).trim();
            }
            // console.log('[SSE]', eventName, dataStr);
            if (!dataStr || dataStr === '[DONE]') continue;
            try {
              const obj = JSON.parse(dataStr);
              // 兼容两种格式：event 在外层字段 或 SSE event 行
              const evtName = eventName || obj.event || '';
              if (evtName === 'conversation.message.delta' && obj.content) {
                this.streamingText += obj.content;
                this.scrollToBottom();
              }
            } catch {}
          }
        }
        this.messages.push({ role: 'assistant', content: this.streamingText || '...' });
      } catch (e) {
        console.error('Coze API error:', e);
        this.messages.push({ role: 'assistant', content: '请求失败，请稍后重试 🙏' });
      } finally {
        this.streaming = false;
        this.streamingText = '';
        this.scrollToBottom();
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.msgList;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
  },
};
</script>

<style scoped>
.model-container {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 99998;
}

#model {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 99999;
  pointer-events: auto;
}

/* 气泡 */
.bubble {
  position: fixed;
  bottom: 130px;
  right: 10px;
  background: linear-gradient(135deg, #fff9e7, #fff3cc);
  color: #333;
  padding: 8px 14px;
  border-radius: 18px 18px 4px 18px;
  font-size: 13px;
  max-width: 200px;
  z-index: 100000;
  pointer-events: none;
  border: 1px solid #ffd740;
  box-shadow: 0 4px 12px rgba(255, 179, 0, 0.2);
  animation: fadeout 3s forwards;
}
@keyframes fadeout {
  0%   { opacity: 1; transform: translateY(0); }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}

/* 悬浮按钮 */
.wm-fab {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ffd633, #ff8c00);
  color: #fff;
  padding: 10px 16px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 140, 0, 0.5);
  font-weight: 700;
  font-size: 14px;
  z-index: 100001;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}
.wm-fab:hover { transform: scale(1.08); }
.wm-fab.open {
  background: linear-gradient(135deg, #ff6b6b, #ee0979);
  padding: 10px 14px;
}
.fab-icon { font-size: 18px; }
.fab-label { font-size: 13px; }

/* 聊天弹窗 */
.wm-chat-panel {
  position: fixed;
  top: 66px;
  right: 16px;
  width: 360px;
  height: 560px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 100000;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.88) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* 头部 */
.wm-chat-header {
  background: linear-gradient(135deg, #ffd633 0%, #ffa500 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-avatar {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.header-title { font-size: 16px; font-weight: 700; color: #fff; }
.header-status {
  font-size: 12px; color: rgba(255,255,255,0.9);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}
.status-dot {
  width: 7px; height: 7px;
  background: #7fff7f; border-radius: 50%;
  box-shadow: 0 0 6px #7fff7f;
  animation: blink 1.5s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
.header-tags { display: flex; flex-direction: column; gap: 4px; }
.tag {
  background: rgba(255,255,255,0.25); color: #fff;
  font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 600;
}

/* 消息列表 */
.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  background: #fffbf0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.msg-list::-webkit-scrollbar { display: none; }

/* 欢迎消息 */
.welcome-msg {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 30px 0; gap: 10px;
}
.welcome-icon { font-size: 40px; }
.welcome-text {
  font-size: 14px; color: #888;
  text-align: center; line-height: 1.6;
}

/* 气泡 */
.msg-bubble {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}
.msg-bubble.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.msg-bubble.bot { align-self: flex-start; }
.bot-avatar {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, #ffd633, #ff8c00);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.bubble-content {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.msg-bubble.user .bubble-content {
  background: linear-gradient(135deg, #ffd633, #ffa500);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(255,140,0,0.25);
}
.msg-bubble.bot .bubble-content {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* 光标闪烁 */
.cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  color: #ffa500;
  font-weight: bold;
}

/* 打字动画 */
.typing {
  display: flex; align-items: center; gap: 4px; padding: 12px 16px;
}
.typing span {
  width: 7px; height: 7px;
  background: #ffa500; border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%,80%,100% { transform: translateY(0); }
  40%          { transform: translateY(-8px); }
}

/* 输入区域 */
.input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #ffe082;
  flex-shrink: 0;
}
.input-area input {
  flex: 1;
  border: 1px solid #ffe082;
  border-radius: 20px;
  padding: 9px 14px;
  font-size: 14px;
  outline: none;
  background: #fffbf0;
  color: #333;
  transition: border-color 0.2s;
}
.input-area input:focus { border-color: #ffa500; }
.input-area input:disabled { background: #f5f5f5; color: #aaa; }
.send-btn {
  background: linear-gradient(135deg, #ffd633, #ff8c00);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.send-btn:hover:not(:disabled) { transform: scale(1.05); }
.send-btn:disabled { background: #ddd; color: #aaa; cursor: not-allowed; }
.btn-spin {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
</style>
