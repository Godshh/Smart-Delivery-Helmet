<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- 头部信息 -->
      <div class="bg-white p-4 rounded-lg shadow mb-4">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">外卖员数据统计</h1>
        <div class="flex flex-col md:flex-row items-center gap-4 mb-4">
          <img src="imgs/ww.jpg" alt="个人头像" class="profile-image" />
          <div class="flex-1">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <p><strong>姓名：</strong> 张三</p>
              <p><strong>工号：</strong> DS12345</p>
              <p><strong>累计订单：</strong> 1280</p>
              <p><strong>平均评分：</strong> 4.8/5.0</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">本月订单</h2>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-bold text-blue-600">256</p>
            <p class="text-sm text-green-500">↑ 12% 较上月</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">本月收入</h2>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-bold text-green-600">¥5,280</p>
            <p class="text-sm text-green-500">↑ 8% 较上月</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">平均配送时间</h2>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-bold text-yellow-600">26分钟</p>
            <p class="text-sm text-red-500">↑ 2% 较上月</p>
          </div>
        </div>
      </div>

      <!-- 评价摘要 -->
      <div class="bg-white p-4 rounded-lg shadow mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">顾客评价摘要</h2>
        <ul class="space-y-2">
          <li v-for="(comment, index) in customerComments" :key="index" class="p-2 bg-gray-50 rounded">
            <div class="flex justify-between">
              <span class="text-sm font-medium">{{ comment.customer }}</span>
              <div class="flex">
                <span v-for="n in 5" :key="n" class="text-sm">
                  <span v-if="n <= comment.rating" class="text-yellow-400">★</span>
                  <span v-else class="text-gray-300">★</span>
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-600">{{ comment.text }}</p>
          </li>
        </ul>
      </div>

      <!-- 配送区域热力图 -->
      <div class="bg-white p-4 rounded-lg shadow mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">配送区域热力图</h2>
        <div ref="heatmapContainer" class="h-80 rounded-lg border"></div>
      </div>

      <!-- 数据详情表格 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-700">订单详情</h2>
          <div class="flex gap-2">
            <select v-model="timeRange" class="border rounded p-1 text-sm">
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
            </select>
            <button @click="exportData" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              导出数据
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th class="px-4 py-2 border-b">订单号</th>
                <th class="px-4 py-2 border-b">日期</th>
                <th class="px-4 py-2 border-b">金额</th>
                <th class="px-4 py-2 border-b">配送时间</th>
                <th class="px-4 py-2 border-b">评分</th>
                <th class="px-4 py-2 border-b">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b">{{ order.id }}</td>
                <td class="px-4 py-2 border-b">{{ order.date }}</td>
                <td class="px-4 py-2 border-b">¥{{ order.amount }}</td>
                <td class="px-4 py-2 border-b">{{ order.deliveryTime }}分钟</td>
                <td class="px-4 py-2 border-b">
                  <div class="flex">
                    <span v-for="n in 5" :key="n" class="text-sm">
                      <span v-if="n <= order.rating" class="text-yellow-400">★</span>
                      <span v-else class="text-gray-300">★</span>
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2 border-b">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': order.status === '已完成',
                      'bg-yellow-100 text-yellow-800': order.status === '配送中',
                      'bg-red-100 text-red-800': order.status === '已取消'
                    }"
                    class="px-2 py-1 rounded text-xs"
                  >
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-between items-center mt-4">
          <p class="text-sm text-gray-500">显示 {{ filteredOrders.length }} 条，共 {{ orders.length }} 条</p>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 border rounded text-sm"
              :class="{ 'bg-blue-500 text-white': currentPage > 1 }"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              上一页
            </button>
            <button
              class="px-3 py-1 border rounded text-sm"
              :class="{ 'bg-blue-500 text-white': currentPage < totalPages }"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader";

export default {
  name: "DeliveryStatistics",
  data() {
    return {
      timeRange: 'month',
      currentPage: 1,
      pageSize: 10,
      customerComments: [
        { customer: '顾客A', rating: 5, text: '送餐速度很快，态度也很好！' },
        { customer: '顾客B', rating: 4, text: '食物保温做得不错，下次还会点。' },
        { customer: '顾客C', rating: 5, text: '准时送达，很满意。' },
        { customer: '顾客D', rating: 3, text: '送餐有点晚，但态度还不错。' }
      ],
      orders: [
        { id: 'ORD20250501', date: '2025-05-01', amount: 38, deliveryTime: 25, rating: 5, status: '已完成' },
        { id: 'ORD20250502', date: '2025-05-02', amount: 45, deliveryTime: 28, rating: 4, status: '已完成' },
        { id: 'ORD20250503', date: '2025-05-03', amount: 29, deliveryTime: 22, rating: 5, status: '已完成' },
        { id: 'ORD20250504', date: '2025-05-04', amount: 52, deliveryTime: 30, rating: 3, status: '已完成' },
        { id: 'ORD20250505', date: '2025-05-05', amount: 41, deliveryTime: 26, rating: 4, status: '已完成' },
        { id: 'ORD20250506', date: '2025-05-06', amount: 36, deliveryTime: 24, rating: 5, status: '已完成' },
        { id: 'ORD20250507', date: '2025-05-07', amount: 48, deliveryTime: 29, rating: 4, status: '已完成' },
        { id: 'ORD20250508', date: '2025-05-08', amount: 33, deliveryTime: 23, rating: 5, status: '已完成' },
        { id: 'ORD20250509', date: '2025-05-09', amount: 42, deliveryTime: 27, rating: 4, status: '已完成' },
        { id: 'ORD20250510', date: '2025-05-10', amount: 39, deliveryTime: 25, rating: 5, status: '已完成' },
        { id: 'ORD20250511', date: '2025-05-11', amount: 44, deliveryTime: 28, rating: 4, status: '已完成' },
        { id: 'ORD20250512', date: '2025-05-12', amount: 37, deliveryTime: 24, rating: 5, status: '已完成' },
        { id: 'ORD20250513', date: '2025-05-13', amount: 51, deliveryTime: 31, rating: 3, status: '已完成' },
        { id: 'ORD20250514', date: '2025-05-14', amount: 43, deliveryTime: 27, rating: 4, status: '已完成' },
        { id: 'ORD20250515', date: '2025-05-15', amount: 35, deliveryTime: 23, rating: 5, status: '已完成' },
        { id: 'ORD20250516', date: '2025-05-16', amount: 47, deliveryTime: 29, rating: 4, status: '配送中' },
        { id: 'ORD20250517', date: '2025-05-17', amount: 32, deliveryTime: 0, rating: 0, status: '配送中' },
        { id: 'ORD20250518', date: '2025-05-18', amount: 40, deliveryTime: 0, rating: 0, status: '已取消' }
      ],
      map: null
    };
  },
  computed: {
    filteredOrders() {
      // 根据时间范围筛选订单
      let filtered = [...this.orders];
      
      // 分页
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return filtered.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.orders.length / this.pageSize);
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initHeatmap();
    });
  },
  beforeDestroy() {
    // 销毁地图实例
    if (this.map) {
      this.map.destroy();
    }
  },
  methods: {
    initHeatmap() {
      window._AMapSecurityConfig = {
        securityJsCode: "ed85bc8a6f2f5af29325bc59c75a70ec",
      };
      AMapLoader.load({
        key: "973684a430e0a55f1dc0f700ec295997",
        version: "2.0",
        plugins: ["AMap.HeatMap"],
      })
        .then((AMap) => {
          this.map = new AMap.Map(this.$refs.heatmapContainer, {
            viewMode: "2D",
            zoom: 12,
            center: [120.21, 30.29], // 杭州市中心坐标
          });

          // 构造热力图
          const heatmap = new AMap.HeatMap(this.map, {
            radius: 25,
            opacity: [0, 0.8]
          });

          // 设置热力图数据
          const heatmapData = {
            max: 100,
            data: [
              { lng: 120.20, lat: 30.28, count: 90 },
              { lng: 120.21, lat: 30.29, count: 80 },
              { lng: 120.19, lat: 30.27, count: 70 },
              { lng: 120.22, lat: 30.28, count: 60 },
              { lng: 120.20, lat: 30.30, count: 50 },
              { lng: 120.18, lat: 30.29, count: 40 },
              { lng: 120.21, lat: 30.27, count: 30 },
              { lng: 120.23, lat: 30.29, count: 20 },
              { lng: 120.19, lat: 30.31, count: 10 }
            ]
          };
          
          heatmap.setDataSet(heatmapData);
        })
        .catch((e) => {
          console.error("地图加载失败:", e);
        });
    },
    exportData() {
      alert('数据导出功能（模拟）：已将' + this.timeRange + '的数据导出到Excel');
    }
  }
};
</script>

<style scoped>
.min-h-screen {
  min-height: 80vh;
  background-color: #f3f4f6;
}

.max-w-4xl {
  max-width: 896px;
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

tr:hover {
  background: #f1f5f9;
}

@media (max-width: 768px) {
  .md\:flex-row {
    flex-direction: column;
  }

  .md\:grid-cols-2, .md\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .profile-image {
    width: 60px;
    height: 60px;
  }

  .h-64, .h-80 {
    height: 200px;
  }
}
</style>