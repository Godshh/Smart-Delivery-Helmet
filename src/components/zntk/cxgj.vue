<template>
  <div class="travel-records">
    <div class="app-header">
      <div class="back-button" @click="retHome">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      <div class="header-title">出行轨迹</div>
    </div>
    
    <div class="records-scroll-container">
      <div 
        v-for="trail in trails"
        :key="trail.id"
        class="trail-card"
        :class="{ 'active-trail': activeId === trail.id }"
        @click="OnXsCx(trail.id)"
      >
        <div class="card-content">
          <div class="card-header">
            <div class="date-badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g fill="#4D8CFE">
                  <path d="M20 9v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10v2H6v3h14z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                  <path d="M14 14h2v2h-2zm-3 0h2v2h-2zm-3 0h2v2H8z"/>
                  <path d="M10 9h10v2H10z"/>
                </g>
              </svg>
            </div>
            <div class="trail-time">{{ trail.date }} {{ trail.time }}</div>
          </div>
          
          <div class="locations">
            <div class="location-row">
              <div class="location-dot start-dot"></div>
              <div class="location-text">{{ trail.start }}</div>
            </div>
            <div class="location-divider"></div>
            <div class="location-row">
              <div class="location-dot end-dot"></div>
              <div class="location-text">{{ trail.end }}</div>
            </div>
          </div>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-value">{{ trail.distance }}</div>
              <div class="stat-label">距离</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ trail.duration }}</div>
              <div class="stat-label">时长</div>
            </div>
          </div>
        </div>
        <div class="action-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 5L16 12L9 19" stroke="#4D8CFE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeId: 1,
      trails: [
        {
          id: 1,
          date: "2024.10.18",
          time: "14:26",
          start: "浙江省杭州市临安区大园路168号",
          end: "阿里巴巴西溪园区",
          distance: "8.1km",
          duration: "00:32:54",
        },
        {
          id: 2,
          date: "2024.10.18",
          time: "09:15",
          start: "杭州东站",
          end: "杭州市西湖区文三路969号",
          distance: "12.3km",
          duration: "00:48:12",
        },
        {
          id: 3,
          date: "2024.10.17",
          time: "18:45",
          start: "杭州大厦购物中心",
          end: "浙江省杭州市拱墅区丽水路58号",
          distance: "6.2km",
          duration: "00:28:05",
        },
        {
          id: 4,
          date: "2024.10.17",
          time: "10:33",
          start: "杭州市民中心",
          end: "杭州植物园",
          distance: "15.8km",
          duration: "00:57:22",
        },
      ],
    };
  },
  methods: {
    retHome() {
      console.log('返回首页');
      this.$emit("reHome");
    },
    OnXsCx(index) {
      console.log('查看轨迹详情', index);
      this.$emit("onwx");
    },
  },
};
</script>

<style scoped>
.travel-records {
  display: flex;
  flex-direction: column;
  height: 95%;
  border-radius: 20px;
  background: #f7f9fc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.back-button {
  
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #f0f5ff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-left: 15px;
  flex-grow: 1;
}

.records-scroll-container {
  flex: 1;
  overflow-y: auto;
  border-radius: 20px;
  padding: 20px 15px;
  background: #f7f9fc;
}

.trail-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 18px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  overflow: hidden;
}

.trail-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(77, 140, 254, 0.2);
}

.active-trail {
  background: linear-gradient(to right, rgba(77, 140, 254, 0.05), white);
}

.card-content {
  flex: 1;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f4f9;
}

.date-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.date-badge svg {
  width: 24px;
  height: 24px;
}

.trail-time {
  font-size: 16px;
  color: #444;
  font-weight: 500;
}

.locations {
  margin-bottom: 20px;
}

.location-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}

.location-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 12px;
  margin-top: 3px;
  position: relative;
}

.start-dot::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

.start-dot {
  background: #20ce67;
  box-shadow: 0 3px 8px rgba(32, 206, 103, 0.3);
}

.end-dot {
  background: #4D8CFE;
  box-shadow: 0 3px 8px rgba(77, 140, 254, 0.3);
}

.location-text {
  font-size: 15px;
  color: #444;
  line-height: 1.5;
  flex: 1;
  word-break: break-word;
}

.location-divider {
  height: 1px;
  background: #f0f4f9;
  margin: 5px 0 5px 8px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  background: #f8fbff;
  border-radius: 14px;
  padding: 12px 0;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 15px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #4D8CFE;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 13px;
  color: #8892a6;
}

.action-indicator {
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5ff;
  padding: 0 15px;
}

.records-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.records-scroll-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.records-scroll-container::-webkit-scrollbar-thumb {
  background: #d0d9f1;
  border-radius: 4px;
}

.records-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #c0cbea;
}

.active-trail .location-text {
  color: #333;
}

.active-trail .stat-value {
  color: #20ce67;
}

@media (max-width: 480px) {
  .trail-card {
    flex-direction: column;
  }
  
  .action-indicator {
    width: 100%;
    height: 45px;
    padding: 0;
  }
  
  .stat-item {
    padding: 0 10px;
  }
}
</style>
