<template>
  <div>
    <h1>驾驶员疲劳状态</h1>
    <div class="status-display" :class="{ 'status-good': !fatigue }">
      {{ statusText }}
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      fatigue: false,
      yawn: false,
    };
  },
  computed: {
    statusText() {
      return this.fatigue ? '疲劳' : '优秀';
    }
  },
  mounted() {
    const socket = io("ws://192.168.179.44:5000");

    socket.on("status_update", (data) => {
      console.log("收到状态:", data);
      this.fatigue = data.fatigue;
      this.yawn = data.yawn;
    });
  },
};
</script>

<style scoped>
.status-display {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
  margin: 20px;
  padding: 20px;
  border-radius: 10px;
  background-color: #ff4444;
  color: white;
  transition: all 0.3s ease;
}

.status-good {
  background-color: #44ff44;
}

h1 {
  color: #333;
  text-align: center;
}
</style>