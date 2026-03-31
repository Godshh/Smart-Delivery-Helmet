<template>
  <div class="delivery-container">
    <div class="order-card" v-for="order in pendingOrders" :key="order.id">
      <div class="card-header pickup">
        <div class="status-label"><span class="icon">⏱</span> 待取货</div>
        <div class="time-remaining">
          <span class="highlight">{{ formatRemainingTime(order) }}</span> 后出发
        </div>
        <div class="order-number">订单号: {{ order.orderNumber }}</div>
      </div>

      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress"
            :style="{ width: progressPercentage(order) + '%' }"
          ></div>
        </div>
        <div class="progress-labels">
          <div class="label active">
            <span class="step-indicator">1</span>
            已接单
          </div>
          <div class="label">
            <span class="step-indicator">2</span>
            取货中
          </div>
          <div class="label">
            <span class="step-indicator">3</span>
            配送中
          </div>
        </div>
      </div>

      <div class="route-info">
        <div class="route-point pickup-point">
          <div class="point-icon">
            <svg viewBox="0 0 24 24">
              <path
                d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"
              />
            </svg>
          </div>
          <div class="point-details">
            <div class="name">{{ order.store }} (取货点)</div>
            <div class="address">{{ order.storeAddress }}</div>
            <div class="instructions">备注: 请出示取货码 #{{ order.id }}</div>
          </div>
        </div>

        <div class="route-divider">
          <div class="divider-line"></div>

        </div>

        <div class="route-point delivery-point">
          <div class="point-icon">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"
              />
            </svg>
          </div>
          <div class="point-details">
            <div class="name">{{ order.customer }} (收货人)</div>
            <div class="address">{{ order.userAddress }}</div>
            <div class="phone">📱 {{ order.phoneNumber }}</div>
          </div>
        </div>
      </div>

      <div class="note-box" v-if="order.note">
        <span class="note-icon">📝 顾客备注：</span>
        {{ order.note }}
      </div>

      <div class="action-container">
        <button class="btn secondary" @click="$emit('navigate', order.id)">
          <span class="icon"></span> 路线导航
        </button>
        <button class="btn contact">
          <span class="icon">📞</span> 联系顾客
        </button>
        <button class="btn primary" @click="pickupOrder(order)">
          <span class="icon"></span> 确认取货
        </button>
      </div>
    </div>

    <div v-if="pendingOrders.length === 0" class="empty-state">
      <div class="empty-icon-wrapper">
        <div class="empty-icon">📦</div>
      </div>
      <div class="empty-text">没有待取货的订单</div>
      <div class="empty-hint">快去"新任务"中抢单吧！</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["orders"],
  computed: {
    pendingOrders() {
      return (this.orders || []).filter((order) => order.status === "pending");
    },
  },
  methods: {
    formatRemainingTime(order) {
      const remainingMinutes = Math.max(
        0,
        (new Date(order.pickupTime) - new Date()) / 60000
      );
      return `${Math.floor(remainingMinutes)}分${Math.round(
        (remainingMinutes % 1) * 60
      )}秒`;
    },

    progressPercentage(order) {
      const createdTime = new Date(order.createTime).getTime();
      const now = new Date().getTime();
      const estimatedTime = new Date(order.pickupTime).getTime();
      const totalTime = estimatedTime - createdTime;
      const elapsedTime = now - createdTime;

      if (elapsedTime <= 0) return 0;
      if (elapsedTime >= totalTime) return 100;

      return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    },

    pickupOrder(order) {
      order.status = "delivering";
      this.$emit("update-task", { id: order.id, status: "delivering" });
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
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    margin-bottom: 18px;
    overflow: hidden;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;

      &.pickup {
        background: linear-gradient(90deg, #fff8e1, #fff9e6);
        border-bottom: 2px solid #ffecb3;
      }

      .status-label {
        background: #ffc107;
        color: #fafaf9;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;

        .icon {
          margin-right: 5px;
        }
      }

      .time-remaining {
        font-size: 14px;
        font-weight: 500;

        .highlight {
          font-size: 16px;
          font-weight: 700;
          color: #353301;
          min-width: 70px;
          display: inline-block;
          text-align: center;
        }
      }

      .order-number {
        font-size: 13px;
        color: #777;
        background: #f4f4f4;
        padding: 3px 8px;
        border-radius: 4px;
        font-family: monospace;
      }
    }

    .progress-container {
      padding: 12px 18px 8px;

      .progress-bar {
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;

        .progress {
          height: 100%;
          background: linear-gradient(90deg, #ffc107, #ff9800);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
      }

      .progress-labels {
        display: flex;
        justify-content: space-between;
        padding: 0 5px;

        .label {
          font-size: 12px;
          color: #9e9e9e;
          position: relative;
          text-align: center;
          min-width: 60px;

          &.active {
            color: #ff9800;
            font-weight: 600;
          }

          .step-indicator {
            display: block;
            width: 20px;
            height: 20px;
            background: #e0e0e0;
            border-radius: 50%;
            line-height: 20px;
            text-align: center;
            font-size: 11px;
            color: #9e9e9e;
            margin: 0 auto 5px;
          }

          &.active .step-indicator {
            background: #ffc107;
            color: #6d4c00;
          }
        }
      }
    }

    .route-info {
      padding: 0 16px;

      .route-point {
        display: flex;
        margin-bottom: 16px;

        .point-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          margin-right: 14px;

          svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
          }
        }

        .point-details {
          flex: 1;

          .name {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 4px;
          }

          .address {
            font-size: 13px;
            color: #5f5f5f;
            margin-bottom: 4px;
          }

          .instructions,
          .phone {
            font-size: 12px;
            background: #f7f7f7;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
            color: #e65100;
          }
        }

        &.pickup-point {
          .point-icon {
            background: #fff8e1;
            color: #ff9800;
          }

          .name {
            color: #ff9800;
          }
        }

        &.delivery-point {
          .point-icon {
            background: #e8f5e9;
            color: #4caf50;
          }

          .name {
            color: #4caf50;
          }
        }
      }

      .route-divider {
        position: relative;
        height: 20px;

        padding-left: 17px;
        .divider-line {
          position: absolute;

          bottom: 3px;
          width: 2px;
          height: 80px;
          background: repeating-linear-gradient(
            to bottom,
            #ddd,
            #ddd 3px,
            transparent 3px,
            transparent 6px
          );
        }
      }
    }

    .note-box {
      margin: 8px 16px 15px;
      padding: 10px 12px;
      background: #f5f5f5;
      border-left: 3px solid #ff9800;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      color: #666;
    }

    .action-container {
      display: flex;
      padding: 0 14px 14px;
      gap: 10px;

      .btn {
        flex: 1;
        padding: 12px 0;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;

        .icon {
          margin-right: 6px;
          font-size: 16px;
        }

        &.primary {
          background: linear-gradient(to bottom, #4caf50, #388e3c);
          color: white;
          box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);

          &:hover {
            background: linear-gradient(to bottom, #43a047, #2e7d32);
            transform: translateY(-1px);
          }
        }

        &.secondary {
          background: #e9f5ff;
          color: #2196f3;
          border: 1px solid #bbdefb;

          &:hover {
            background: #d0e9ff;
          }
        }

        &.contact {
          background: #fff0ed;
          color: #f44336;
          border: 1px solid #ffcdd2;

          &:hover {
            background: #ffe4e0;
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 50px 20px 30px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-top: 40px;

    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      background: #fff8e1;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;

      .empty-icon {
        font-size: 40px;
        color: #ffc107;
      }
    }

    .empty-text {
      font-size: 18px;
      font-weight: 600;
      color: #616161;
      margin-bottom: 8px;
    }

    .empty-hint {
      font-size: 14px;
      color: #9e9e9e;
      max-width: 260px;
      line-height: 1.4;
    }
  }
}
</style>
