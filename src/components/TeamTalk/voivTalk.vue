<template>
  <div class="talk-room">
    <h2>🎙️ 多人语音对讲（按住说话）</h2>
    <div v-if="needsUserInteraction" class="play-hint">
      <p>🔊 音频已准备就绪，请点击按钮启用声音</p>
      <button @click="activateAudio">启用音频</button>
    </div>
    <button
      @mousedown="startSpeaking"
      @touchstart="startSpeaking"
      @mouseup="stopSpeaking"
      @touchend="stopSpeaking"
      :disabled="!joined"
    >
      {{ speaking ? "🛑 说话中..." : "🎤 按住说话" }}
    </button>

    <button @click="joinRoom" :disabled="joined">🔊 加入对讲</button>

    <!-- ✅ 添加这段 -->
    <div class="volume-bar">
      <div class="volume-fill" :style="{ width: volumeLevel + '%' }"></div>
    </div>

    <div v-for="peer in peers" :key="peer.id" class="audio-wrapper">
      <audio
        :ref="(el) => setAudioRef(peer.id, el)"
        autoplay
        playsinline
        controls
        :muted="peer.id === localPeerId"
      />
    </div>

    <button @click="playAllAudios">▶️ 播放所有音频</button>
  </div>
</template>

<script>
import { ref, onUnmounted } from "vue";
import { connectToSFU } from "@/utils/mediasoup.js";

export default {
  setup() {
    const joined = ref(false);
    const peers = ref([]);
    const speaking = ref(false);
    const isStarting = ref(false);
    const isStopping = ref(false);
    const needsUserInteraction = ref(false);
    const volumeLevel = ref(0);
    const localPeerId = ref(null);
    const audioContext = ref(null); // 主音频上下文
    const micActive = ref(false);
    const micTested = ref(false);
    let animationFrameId = null;
    let analyser = null; // 音频分析器

    const audioRefs = {};
    let device = null;
    let socket = null;
    let recvTransport = null;
    let sendTransport = null;
    let producer = null;
    let closing = false;

    // 初始化音频上下文
    const initAudioContext = () => {
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext ||
          window.webkitAudioContext)();
        console.log("✅ 初始化音频上下文:", audioContext.value);
      }
    };

    // 激活音频上下文（需要用户交互）
    const activateAudioContext = async () => {
      if (!audioContext.value) initAudioContext();

      if (audioContext.value.state === "suspended") {
        try {
          await audioContext.value.resume();
          console.log("✅ 音频上下文已激活");
          return true;
        } catch (error) {
          console.error("无法激活音频上下文:", error);
          return false;
        }
      }
      return true;
    };

    // 修改播放函数
    const playAllAudios = async () => {
      // 先尝试激活音频上下文
      const activated = await activateAudioContext();
      if (!activated) {
        needsUserInteraction.value = true;
        return;
      }

      Object.values(audioRefs).forEach((audioEl) => {
        if (audioEl && audioEl.paused) {
          audioEl.play().catch((error) => {
            console.error("播放失败:", error);
            if (error.name === "NotAllowedError") {
              needsUserInteraction.value = true;
            }
          });
        }
      });
    };

    // WebSocket 多事件监听
    const wsListeners = new Map();
    function addWsListener(type, fn) {
      if (!wsListeners.has(type)) wsListeners.set(type, new Set());
      wsListeners.get(type).add(fn);
    }
    function removeWsListener(type, fn) {
      wsListeners.get(type)?.delete(fn);
    }
    function handleSocketMessage(event) {
      const msg = JSON.parse(event.data);
      const listeners = wsListeners.get(msg.type);
      if (listeners) {
        for (const fn of listeners) {
          try {
            fn(msg);
          } catch (e) {
            console.error("WebSocket listener error:", e);
          }
        }
      }
    }

    // 修改 setAudioRef 函数
    const setAudioRef = (id, el) => {
      if (el) {
        audioRefs[id] = el;

        console.log(`🎧 设置音频元素 ${id}`, el);

        // 元数据加载后尝试播放
        el.addEventListener("loadedmetadata", async () => {
          console.log(`📡 ${id} 音频元数据已加载`);
          try {
            await el.play();
            console.log(`▶️ ${id} 自动播放成功`);
          } catch (err) {
            console.warn(`⚠️ ${id} 播放失败（loadedmetadata 后）:`, err);
          }
        });

        // 播放失败日志
        el.addEventListener("error", (e) => {
          console.error(`❌ ${id} 音频错误:`, e, el.error);
        });

        // 如果 stream 已经存在，立即赋值 + 播放
        const peer = peers.value.find((p) => p.id === id);
        if (peer?.stream) {
          el.srcObject = peer.stream;
          console.log(`🔊 ${id} 流已设置`);

          setTimeout(async () => {
            try {
              await el.play();
              console.log(`▶️ ${id} 初始设置后自动播放成功`);
            } catch (err) {
              console.warn(`⚠️ ${id} 初始设置后播放失败:`, err);
            }
          }, 300); // 延迟一点，保证 DOM 已挂载
        }
      }
    };

    const joinRoom = async () => {
      if (joined.value) return;
      joined.value = true;

      const res = await connectToSFU((peerId, stream) => {
        if (!peers.value.find((p) => p.id === peerId)) {
          peers.value.push({ id: peerId });
        }
        if (audioRefs[peerId]) {
          audioRefs[peerId].srcObject = stream;
          console.log("🎧 给 peerId 设置音频:", peerId, stream);
          console.log("🎧 audioRefs[peerId]:", audioRefs[peerId]);
        }
        const audioEl = audioRefs[peerId];
        if (audioEl) {
          audioEl.srcObject = stream;
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const track = audioTracks[0];
            console.log(`🎙️ 接收到音轨状态`, {
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
            });
          } else {
            console.warn("❌ 接收到的 stream 没有音轨！");
          }
          audioEl.play().catch((err) => {
            console.warn(`⚠️ ${peerId} 音频播放失败:`, err);
          });
          console.log("🎧 给 peerId 设置音频:", peerId, stream);
        }
      }, false);

      device = res.device;
      recvTransport = res.recvTransport;
      sendTransport = res.sendTransport;
      socket = res.socket;
      localPeerId.value = res.peerId;

      socket.addEventListener("message", handleSocketMessage);

      // **关键：给 sendTransport 注册 produce 事件，且只注册一次**
      if (sendTransport) {
        sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
          console.log("🌀 sendTransport produce事件触发", kind, rtpParameters);

          socket.send(
            JSON.stringify({
              type: "produce",
              payload: { transportId: sendTransport.id, kind, rtpParameters },
            })
          );

          const handler = (msg) => {
            if (msg.type === "produced") {
              callback({ id: msg.payload.id });
              removeWsListener("produced", handler);
            }
          };
          addWsListener("produced", handler);
        });
      }
    };

    async function closeProducerOnly() {
      if (producer) {
        try {
          producer.close();
          console.log("🧹 旧 producer 已关闭");
        } catch (e) {
          console.warn("关闭 producer 出错:", e);
        }
        producer = null;
      }
    }

    async function closeSendTransport() {
      if (sendTransport) {
        try {
          await sendTransport.close();
          sendTransport = null;
        } catch (e) {
          console.warn("关闭发送通道失败:", e);
        }
      }
    }

    const startSpeaking = async () => {
      if (!joined.value || speaking.value || isStarting.value) return;
      if (!sendTransport) {
        console.error("sendTransport 未准备好，无法开始发言");
        return;
      }
      isStarting.value = true;

      try {
        // 先激活音频上下文
        const activated = await activateAudioContext();
        if (!activated) {
          needsUserInteraction.value = true;
          throw new Error("音频上下文未激活");
        }

        // 先获取音频轨道
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const track = stream.getAudioTracks()[0];
        if (!track) throw new Error("未获取到音频轨道");
        console.log("✅ 获取到音频轨道:", track);

        await closeProducerOnly(); // 关闭之前的 producer，保持干净

        // 创建producer，发送音频轨道
        producer = await sendTransport.produce({ track });

        // 启动音量监控
        startVolumeMonitor(stream);

        // 监听producer事件
        producer.on("close", () => {
          console.log("❌ producer 已关闭");
          producer = null;
        });
        producer.on("transportclose", () => {
          console.log("⚠️ producer transport 被关闭");
          producer = null;
        });

        speaking.value = true;
      } catch (err) {
        console.error("startSpeaking 出错:", err);
        speaking.value = false;
      } finally {
        isStarting.value = false;
      }
    };

    const stopSpeaking = async () => {
      if (!speaking.value || isStopping.value) return;
      isStopping.value = true;

      let waitCount = 0;
      while (isStarting.value && waitCount++ < 40) {
        console.log("等待 startSpeaking 完成...");
        await new Promise((r) => setTimeout(r, 50));
      }
      stopVolumeMonitor();
      speaking.value = false;

      await closeProducerOnly().catch((e) => {
        console.warn("stopSpeaking 中关闭 producer 失败:", e);
      });

      isStopping.value = false;
    };

    // 修改后的音量监控函数，使用统一的音频上下文
    function startVolumeMonitor(stream) {
      try {
        stopVolumeMonitor();

        if (!audioContext.value) {
          console.error("音频上下文未初始化");
          return;
        }

        const source = audioContext.value.createMediaStreamSource(stream);

        if (!analyser) {
          analyser = audioContext.value.createAnalyser();
          analyser.fftSize = 128;
        }

        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          try {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
            volumeLevel.value = Math.min(100, Math.floor((avg / 255) * 100));

            micActive.value = avg > 5;
            animationFrameId = requestAnimationFrame(update);
          } catch (error) {
            console.error("音量监控出错:", error);
            stopVolumeMonitor();
          }
        };

        animationFrameId = requestAnimationFrame(update);
      } catch (error) {
        console.error("启动音量监控失败:", error);
      }
    }

    function stopVolumeMonitor() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    // 组件卸载时清理资源
    onUnmounted(() => {
      stopVolumeMonitor();

      (async () => {
        await closeProducerOnly();
        await closeSendTransport();
      })();

      if (socket) {
        socket.removeEventListener("message", handleSocketMessage);
        socket.close();
      }

      if (audioContext.value) {
        audioContext.value.close().catch(console.error);
      }
    });

    return {
      joined,
      peers,
      setAudioRef,
      joinRoom,
      startSpeaking,
      stopSpeaking,
      speaking,
      volumeLevel,
      audioRefs,
      playAllAudios,
      localPeerId,
      needsUserInteraction,
    };
  },
};
</script>

<style scoped>
.talk-room {
  padding: 2em;
}
.audio-wrapper {
  margin: 1em 0;
}
button {
  margin: 0.5em;
  padding: 0.8em 1.2em;
  font-size: 1rem;
}
.play-hint {
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
}
.play-hint button {
  margin-top: 10px;
  padding: 8px 15px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.volume-bar {
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
}
.volume-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.1s ease;
}
</style>


















