<template>
  <div class="delivery-container">
    <div class="order-card" v-for="order in newOrders" :key="order.id">
      <div class="card-header">
        <div class="time-limit">
          <span class="highlight">{{ order.time }}</span> 内送达
        </div>
        <div class="reward">
          ￥<span class="value">{{ order.reward }}</span>
        </div>
      </div>

      <div class="distance-info">
        <div class="distance-item">
          <div class="icon location-icon">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"
              />
            </svg>
          </div>
          <div class="store-info">
            <div class="address shop">{{ order.store }}</div>
            <div class="detail">{{ order.storeAddress }}</div>
            <div class="distance">
              <span class="value">{{ order.Sdistance }}</span> |
              <span class="eta">预计{{ new Date(order.pickupTime).toLocaleTimeString() }}到达</span>
            </div>
          </div>
        </div>

        <div class="route-indicator">
          <div class="dot start"></div>
          <div class="dashed-line"></div>
          <div class="dot end"></div>
        </div>

        <div class="distance-item">
          <div class="icon customer-icon">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </div>
          <div class="customer-info">
            <div class="address">{{ order.userAddress }}</div>
            <div class="detail">
              <span class="customer">{{ order.customer }}</span>
              <span class="phone">{{ order.phoneNumber }}</span>
            </div>
            <div class="distance">
              <span class="value">{{ order.Ydistance }}</span> |
              <span class="eta">预计{{ new Date(order.eta).toLocaleTimeString() }}送达</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="order.note" class="note">
        <span class="note-icon">📝 备注:</span> {{ order.note }}
      </div>

      <div class="action-container">
        <button class="btn accept" @click="acceptOrder(order)">
          <span class="icon"></span> 立即抢单
        </button>
        <button class="btn reject" @click="$emit('navigate', order.id)">
          <span class="icon"></span> 查看地图
        </button>
      </div>
    </div>

    <div v-if="newOrders.length === 0" class="empty-state">
      <img
        src="data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24'%3e%3cpath fill='%23cccccc' d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm0 12.99l-5-2.73v-4.1l5 2.73 5-2.73v4.09l-5 2.74z'/%3e%3c/svg%3e"
        alt="No orders"
        class="empty-icon"
      />
      <div class="empty-text">当前无新订单</div>
      <div class="empty-subtext">休息一下，随时会有新的配送任务</div>
      <button class="btn refresh" @click="$emit('refresh')">
        <span class="icon">🔄</span> 刷新订单
      </button>
    </div>
  </div>
</template>

<script>
import eventBus from '@/eventBus.js'


export default {
  props: {
    orders: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  mounted() {
    this._voiceAcceptHandler = () => {
      const first = this.newOrders[0];
      if (first) this.acceptOrder(first);
    };
    eventBus.on("voice-accept-order", this._voiceAcceptHandler);
  },
  beforeUnmount() {
    eventBus.off("voice-accept-order", this._voiceAcceptHandler);
  },
  computed: {
    newOrders() {
      return (this.orders || []).filter((order) => order.status === "new");
    },
  },
  methods: {
    formatTime(time) {
      if (!(time instanceof Date)) return time;
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
acceptOrder(order) {
  console.log("抢单按钮点击，订单:", order);
    order.status = "pending";
    this.$emit("update-task", { id: order.id, status: "pending" });
    eventBus.emit("add-order-to-map", order);
  },
  },
};
</script>

<style scoped lang="less">
.delivery-container {
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */

  .order-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
    overflow: hidden;
    position: relative;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fef295;
      border-bottom: 1px solid #ffe0ce;

      .time-limit {
        font-size: 14px;
        color: #666;

        .highlight {
          font-weight: 700;
          color: #ff7a46;
          font-size: 16px;
        }
      }

      .reward {
        font-size: 15px;
        font-weight: bold;
        color: #ff6b35;

        .value {
          font-size: 20px;
          margin-left: 2px;
        }
      }
    }

    .distance-info {
      padding: 16px;
      position: relative;

      .distance-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .icon {
          min-width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 12px;

          svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
          }
        }

        .location-icon {
          background: #e3f2fd;
          color: #2196f3;
        }

        .customer-icon {
          background: #e8f5e9;
          color: #4caf50;
        }

        .store-info,
        .customer-info {
          flex: 1;

          .address {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 4px;

            &.shop {
              color: #ff6b35;
            }
          }

          .detail {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            // .customer {
            // }

            .phone {
              font-weight: 500;
              color: #1976d2;
            }
          }

          .distance {
            font-size: 12px;
            color: #888;

            .value {
              color: #ff6b35;
              font-weight: 600;
            }

            .eta {
              color: #4caf50;
              background: #e8f5e9;
              padding: 2px 6px;
              border-radius: 4px;
              margin-left: 6px;
            }
          }
        }
      }

      .route-indicator {
        position: absolute;
        left: 30px;
        top: 42px;
        bottom: 82px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 2px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2196f3;
          z-index: 2;

          &.start {
            background: #ff6b35;
          }

          &.end {
            background: #4caf50;
          }
        }

        .dashed-line {
          height: calc(100% - 40px);
          border-left: 2px dashed #90caf9;
          flex: 1;
        }
      }
    }

    .note {
      padding: 10px 16px;
      background: #fff8e1;
      margin: 0 16px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #755e11;
      border: 1px solid #ffecb3;
      display: flex;
      align-items: flex-start;

      .note-icon {
        font-weight: 600;
        margin-right: 6px;
        min-width: 50px;
      }
    }

    .action-container {
      display: flex;
      padding: 0 16px 16px;
      gap: 12px;

      .btn {
        flex: 1;
        padding: 12px 0;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;

        .icon {
          margin-right: 8px;
          font-size: 18px;
        }

        &.accept {
          background: linear-gradient(135deg, #ffd633, #ffb300);
          color: #724f00;
          box-shadow: 0 2px 8px rgba(255, 179, 0, 0.3);

          &:hover {
            background: linear-gradient(135deg, #ffcc00, #ffa000);
            transform: translateY(-1px);
          }

          &:active {
            transform: translateY(1px);
            box-shadow: 0 1px 4px rgba(255, 179, 0, 0.3);
          }
        }

        &.reject {
          background: #dbdddf;
          color: #4a4848;
          border: 1px solid #ddd;

          &:hover {
            background: #e4e7eb;
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

    .empty-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      opacity: 0.3;
    }

    .empty-text {
      font-size: 18px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }

    .empty-subtext {
      font-size: 14px;
      color: #999;
      margin-bottom: 24px;
      max-width: 300px;
    }

    .refresh {
      padding: 10px 24px;
      background: #f0f2f5;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      color: #555;
      cursor: pointer;
      display: flex;
      align-items: center;

      &:hover {
        background: #e4e7eb;
      }

      .icon {
        margin-right: 6px;
        animation: rotate 1.5s linear infinite;
      }

      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
}
.delivery-container::-webkit-scrollbar {
  display: none; /* Chrome / Safari / Edge */
}
</style>


  