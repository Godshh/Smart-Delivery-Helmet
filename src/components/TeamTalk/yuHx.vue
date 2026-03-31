<template>
  <div class="voice-wakeup-container">
    <div class="status-indicator" :class="{ active: listening }">
      <div class="pulse-ring" v-if="listening"></div>
      <i class="fa fa-microphone" :class="{ 'text-green-500': listening, 'text-gray-400': !listening }"></i>
      <span class="ml-2">{{ statusText }}</span>
    </div>
    
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 transform hover:shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">配置设置</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">唤醒词</label>
          <input 
            type="text" 
            v-model="wakeWord" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            placeholder="设置唤醒词"
          >
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">对话超时时间 (秒)</label>
          <input 
            type="number" 
            v-model.number="dialogTimeout" 
            min="1" 
            max="30" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          >
        </div>
        <button 
          @click="toggleListening" 
          class="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <i class="fa fa-power-off mr-2"></i>
          <span>{{ listening ? '停止监听' : '开始监听' }}</span>
        </button>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 transform hover:shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">AI设置</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">API端点</label>
          <input 
            type="text" 
            v-model="apiEndpoint" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="AI对话API地址"
          >
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">API密钥</label>
          <input 
            type="password" 
            v-model="apiKey" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="API访问密钥"
          >
        </div>
        <button 
          @click="testAIConnection" 
          class="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
          :disabled="!apiEndpoint || !apiKey"
        >
          <i class="fa fa-link mr-2"></i>
          <span>测试API连接</span>
        </button>
      </div>
    </div>
    
    <div class="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">对话内容</h3>
      <div class="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto" id="conversationBox">
        <div v-if="conversation.length === 0" class="text-gray-500 italic text-center py-8">
          对话将在这里显示
        </div>
        <div v-else class="space-y-4">
          <div v-for="(msg, index) in conversation" :key="index" 
               :class="{
                 'flex justify-start': msg.from === 'user',
                 'flex justify-end': msg.from === 'ai'
               }">
            <div 
              class="max-w-[80%] px-4 py-3 rounded-lg shadow-sm"
              :class="{
                'bg-gray-100 text-gray-800': msg.from === 'user',
                'bg-blue-500 text-white': msg.from === 'ai'
              }"
            >
              <p>{{ msg.text }}</p>
              <div class="text-xs mt-1 opacity-75">
                {{ msg.time }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-500">
        <i class="fa fa-clock-o mr-1"></i> 对话计时器: <span class="font-medium">{{ dialogTimerText }}</span>
      </div>
      <button 
        @click="clearConversation" 
        class="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
      >
        <i class="fa fa-trash-o mr-1"></i> 清空对话
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import axios from 'axios'

// 状态管理
const listening = ref(false)
const inDialog = ref(false)
const wakeWord = ref('你好豆包')
const statusText = ref('未监听')
const conversation = ref([])
const recognition = ref(null)
const wakeWordDetected = ref(false)
const dialogTimeout = ref(8) // 默认8秒超时
const dialogTimer = ref(null)
const lastVoiceTime = ref(0)
const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions') // DeepSeek API端点
const apiKey = ref('') // 您的API密钥
const connectionTestResult = ref('')
const modelType = ref('deepseek-chat') // 默认使用聊天模型

// 计算属性
const dialogTimerText = computed(() => {
  if (!inDialog.value) return '未对话'
  const remaining = Math.max(0, dialogTimeout.value - (Date.now() - lastVoiceTime.value) / 1000)
  return `${remaining.toFixed(1)}秒后自动结束对话`
})

// 初始化语音识别
onMounted(() => {
  // 检查浏览器支持
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('抱歉，您的浏览器不支持语音识别功能')
    return
  }

  // 创建识别实例
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition.value = new SpeechRecognition()
  
  // 配置识别参数
  recognition.value.continuous = true
  recognition.value.interimResults = true
  recognition.value.lang = 'zh-CN'
  
  // 设置事件监听
  recognition.value.onresult = handleSpeechResult
  recognition.value.onerror = handleSpeechError
  recognition.value.onend = handleRecognitionEnd
})

onUnmounted(() => {
  // 组件卸载时停止识别
  stopListening()
})

// 处理语音识别结果
const handleSpeechResult = (event) => {
  const transcriptArray = Array.from(event.results)
    .map(result => result[0])
    .map(result => result.transcript)
    .join('')
  
  // 更新最后有语音的时间
  if (transcriptArray.trim()) {
    lastVoiceTime.value = Date.now()
  }
  
  // 实时显示临时结果
  if (event.results[0].isFinal && transcriptArray.trim()) {
    const now = new Date()
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0') + ':' + 
                      now.getSeconds().toString().padStart(2, '0')
    
    // 如果检测到唤醒词且不在对话中，则开始新对话
    if (transcriptArray.includes(wakeWord.value) && !inDialog.value) {
      startDialog()
      // 移除唤醒词部分，保留其余内容作为第一条指令
      const userMessage = transcriptArray.replace(wakeWord.value, '').trim()
      if (userMessage) {
        addToConversation(userMessage, 'user')
        sendToAI(userMessage)
      }
      return
    }
    
    // 如果在对话中，将内容添加到对话
    if (inDialog.value) {
      addToConversation(transcriptArray, 'user')
      sendToAI(transcriptArray)
    }
  }
}

// 处理识别错误
const handleSpeechError = (event) => {
  console.error('语音识别错误:', event.error)
  statusText.value = `错误: ${event.error}`
  listening.value = false
}

// 处理识别结束事件
const handleRecognitionEnd = () => {
  if (listening.value) {
    // 如果需要持续监听，则重新启动识别
    startListening()
  }
}

// 开始监听
const startListening = () => {
  try {
    recognition.value.start()
    listening.value = true
    statusText.value = '正在监听...'
  } catch (error) {
    console.error('启动语音识别失败:', error)
    statusText.value = '启动语音识别失败'
    listening.value = false
  }
}

// 停止监听
const stopListening = () => {
  recognition.value.stop()
  listening.value = false
  statusText.value = '未监听'
  endDialog()
}

// 切换监听状态
const toggleListening = () => {
  if (listening.value) {
    stopListening()
  } else {
    startListening()
  }
}

// 开始对话
const startDialog = () => {
  inDialog.value = true
  statusText.value = '对话中...'
  lastVoiceTime.value = Date.now()
  
  // 启动超时计时器
  if (dialogTimer.value) clearInterval(dialogTimer.value)
  dialogTimer.value = setInterval(checkDialogTimeout, 500)
  
  // 添加对话开始提示
  addToConversation('对话已开始，请说出您的问题...', 'ai')
  
  // 播放提示音
  playNotificationSound()
}

// 结束对话
const endDialog = () => {
  if (!inDialog.value) return
  
  inDialog.value = false
  statusText.value = listening.value ? '正在监听...' : '未监听'
  
  // 清除计时器
  if (dialogTimer.value) {
    clearInterval(dialogTimer.value)
    dialogTimer.value = null
  }
  
  // 添加对话结束提示
  addToConversation('对话已结束', 'system')
}

// 检查对话超时
const checkDialogTimeout = () => {
  if (!inDialog.value) return
  
  const elapsed = (Date.now() - lastVoiceTime.value) / 1000
  if (elapsed >= dialogTimeout.value) {
    endDialog()
  }
}

// 添加消息到对话
const addToConversation = (text, from) => {
  const now = new Date()
  const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0') + ':' + 
                    now.getSeconds().toString().padStart(2, '0')
  
  conversation.value.push({
    text,
    from,
    time: timeString
  })
  
  // 保持滚动到底部
  nextTick(() => {
    const container = document.getElementById('conversationBox')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
  
  // 限制对话长度，避免内存溢出
  if (conversation.value.length > 50) {
    conversation.value.shift()
  }
}

// 发送到AI处理
const sendToAI = async (text) => {
  // 显示"正在思考"状态
  const thinkingId = conversation.value.length
  addToConversation('正在思考...', 'ai')
  
  try {
    // 检查API配置
    if (!apiEndpoint.value || !apiKey.value) {
      setTimeout(() => {
        // 移除"正在思考"消息
        if (conversation.value[thinkingId] && conversation.value[thinkingId].text === '正在思考...') {
          conversation.value.splice(thinkingId, 1)
        }
        addToConversation('未配置AI API，请在设置中配置API端点和密钥', 'ai')
      }, 1000)
      return
    }
    
    // 构建DeepSeek API请求
    const response = await axios.post(
      apiEndpoint.value,
      {
        model: modelType.value,
        messages: [
          { role: "user", content: text }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.value}`
        }
      }
    )
    
    // 移除"正在思考"消息
    if (conversation.value[thinkingId] && conversation.value[thinkingId].text === '正在思考...') {
      conversation.value.splice(thinkingId, 1)
    }
    
    // 提取AI回复
    const aiResponse = response.data.choices[0].message.content.trim()
    addToConversation(aiResponse, 'ai')
    
    // 播放AI回复语音
    speakText(aiResponse)
    
  } catch (error) {
    console.error('AI API调用错误:', error)
    
    // 移除"正在思考"消息
    if (conversation.value[thinkingId] && conversation.value[thinkingId].text === '正在思考...') {
      conversation.value.splice(thinkingId, 1)
    }
    
    // 更详细的错误信息
    let errorMessage = 'AI API调用出错'
    if (error.response) {
      errorMessage += ` (${error.response.status}): ${JSON.stringify(error.response.data)}`
    } else if (error.request) {
      errorMessage += ': 没有收到响应'
    } else {
      errorMessage += `: ${error.message}`
    }
    
    addToConversation(errorMessage, 'ai')
  }
}

// 测试AI连接
const testAIConnection = async () => {
  if (!apiEndpoint.value || !apiKey.value) {
    connectionTestResult.value = '请先填写API端点和密钥'
    return
  }
  
  connectionTestResult.value = '正在测试连接...'
  
  try {
    // 测试请求 - 使用简单的问候语
    const response = await axios.post(
      apiEndpoint.value,
      {
        model: modelType.value,
        messages: [
          { role: "user", content: "你好，这是一个API连接测试" }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.value}`
        }
      }
    )
    
    connectionTestResult.value = '连接成功！API正常响应'
    setTimeout(() => {
      connectionTestResult.value = ''
    }, 3000)
    
  } catch (error) {
    console.error('API连接测试失败:', error)
    
    // 更详细的错误信息
    let errorMessage = '连接失败'
    if (error.response) {
      errorMessage += ` (${error.response.status}): ${JSON.stringify(error.response.data)}`
    } else if (error.request) {
      errorMessage += ': 没有收到响应'
    } else {
      errorMessage += `: ${error.message}`
    }
    
    connectionTestResult.value = errorMessage
    setTimeout(() => {
      connectionTestResult.value = ''
    }, 5000)
  }
}

// 语音合成
const speakText = (text) => {
  if ('SpeechSynthesisUtterance' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9 // 稍微慢一点，提高可懂度
    window.speechSynthesis.speak(utterance)
  }
}

// 播放提示音
const playNotificationSound = () => {
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(
      400, audioContext.currentTime + 0.3
    )
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  }
}

// 清空对话
const clearConversation = () => {
  conversation.value = []
}
</script>

<style scoped>
.voice-wakeup-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;
}

.active {
  color: #10b981;
}

.pulse-ring {
  content: '';
  width: 30px;
  height: 30px;
  background: #10b981;
  border-radius: 50%;
  position: absolute;
  animation: pulsate infinite 2s;
  opacity: 0.6;
  z-index: 0;
}

@keyframes pulsate {
  0% {
    transform: scale(0.1, 0.1);
    opacity: 0;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    transform: scale(1.2, 1.2);
    opacity: 0;
  }
}

.status-indicator i {
  font-size: 2rem;
  margin-right: 0.5rem;
  position: relative;
  z-index: 1;
}

.connection-test-result {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.connection-test-result.success {
  background-color: #d1fae5;
  color: #065f46;
}

.connection-test-result.error {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>  