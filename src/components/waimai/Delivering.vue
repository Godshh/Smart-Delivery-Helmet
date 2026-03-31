<template>
  <div class="delivery-container">
    <div class="order-card" v-for="order in deliveringOrders" :key="order.id">
      <div class="card-header delivering">
        <div class="status-label">
          <span class="icon">🚚</span> 正在配送
        </div>
        <div class="time-remaining">
          <div>剩余时间</div>
          <span class="highlight">{{ formatRemainingTime(order) }}</span>
        </div>
        <div class="order-number">#{{ order.orderNumber }}</div>
      </div>
      <div class="delivery-info">
        <div class="destination-panel">
          <div class="info-item">
            <span class="label">目的地：</span>
            <span class="value">{{ order.userAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">顾客：</span>
            <span class="value">{{ order.customer }}</span>
          </div>
          <div class="info-item">
            <span class="label">电话：</span>
            <span class="value phone"><a :href="'tel:'+order.phoneNumber">{{ order.phoneNumber }}</a></span>
          </div>
        </div>
        
        <div class="notes-panel" v-if="order.note">
          <div class="note-icon">📝</div>
          <div class="note-content">
            <div class="note-header">顾客备注</div>
            <div class="note-text">{{ order.note }}</div>
          </div>
        </div>
      </div>
      
      <div class="action-container">
        <button class="btn secondary" @click="$emit('navigate', order.id)">
          <span class="icon"></span> 导航路线
        </button>
        <button class="btn contact">
          <span class="icon">📞</span> 联系顾客
        </button>
        <button class="btn primary" @click="completeOrder(order)">
          <span class="icon"></span> 我已送达
        </button>
      </div>
    </div>
    
    <div v-if="deliveringOrders.length === 0" class="empty-state">
      <div class="delivery-man">
        <div class="helmet"></div>
        <div class="head"></div>
        <div class="body"></div>
        <div class="arm left"></div>
        <div class="arm right"></div>
        <div class="box"></div>
      </div>
      <div class="empty-text">没有配送中的订单</div>
      <div class="empty-hint">所有订单已送达！休息一下吧</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["orders"],
  computed: {
    deliveringOrders() {
      return (this.orders || []).filter(order => order.status === "delivering");
    }
  },
  methods: {
    formatRemainingTime(order) {
      const remainingTime = Math.max(0, (new Date(order.eta) - new Date()) / 60000);
      const minutes = Math.floor(remainingTime);
      const seconds = Math.round((remainingTime - minutes) * 60);
      
      if (minutes <= 0 && seconds <= 0) return "0分钟";
      if (minutes > 0) return `${minutes}分${seconds}秒`;
      return `${seconds}秒`;
    },
    
    completeOrder(order) {
      // 在实际应用中，这里会触发送货完成的API调用
      this.$emit("update-task", { id: order.id, status: "completed" });
    }
  }
};
</script>

<style scoped lang="less">
@primary-color: #4caf50;
@warning-color: #ff9800;
@danger-color: #f85f54;

.delivery-container {


  height: 100vh;
  overflow-y: auto;
  
  .order-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    margin-bottom: 18px;
    overflow: hidden;
    position: relative;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      
      &.delivering {
        background: linear-gradient(90deg, #e8f5e9, #e6f7e9);
        border-bottom: 2px solid #c8e6c9;
      }
      
      .status-label {
        background: @primary-color;
        color: white;
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
        text-align: center;
        font-size: 12px;
        color: #666;
        background: #f9f9f9;
        padding: 4px 12px;
        border-radius: 12px;
        
        .highlight {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: @danger-color;
          margin-top: 3px;
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
    
    
    .delivery-info {
      padding: 15px 18px 5px;
      
      .destination-panel {
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        margin-bottom: 15px;
        
        .info-item {
          display: flex;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px dotted #eee;
          
          &:last-child {
            border-bottom: none;
          }
          
          .label {
            min-width: 60px;
            color: #666;
            font-weight: 600;
          }
          
          .value {
            flex: 1;
            font-weight: 500;
            color: #333;
            
            &.phone a {
              color: #1976d2;
              text-decoration: none;
              font-weight: 600;
              
              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
      
      .notes-panel {
        display: flex;
        background: #fff8e1;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        
        .note-icon {
          font-size: 24px;
          margin-right: 12px;
          color: #ffa000;
        }
        
        .note-content {
          .note-header {
            font-size: 13px;
            font-weight: 600;
            color: #755e11;
            margin-bottom: 5px;
          }
          
          .note-text {
            font-size: 14px;
            color: #9c7b16;
            line-height: 1.4;
          }
        }
      }
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
          background: linear-gradient(to bottom, #e0120e, #d32f2f);
          color: white;
          box-shadow: 0 2px 5px rgba(202, 204, 202, 0.3);
          
          &:hover {
            background: linear-gradient(to bottom, #f14e4c, #c62828);
            transform: translateY(-1px);
          }
                  
          &:active {
            transform: translateY(1px);
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
    padding: 40px 20px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-top: 30px;
    
    .delivery-man {
      position: relative;
      width: 120px;
      height: 140px;
      margin-bottom: 25px;
      
      .helmet {
        position: absolute;
        top: 10px;
        left: 45px;
        width: 30px;
        height: 25px;
        background: #e0e0e0;
        border-radius: 50% 50% 5px 5px;
      }
      
      .head {
        position: absolute;
        top: 0;
        left: 40px;
        width: 40px;
        height: 40px;
        background: #f9d8b4;
        border-radius: 50%;
      }
      
      .body {
        position: absolute;
        top: 60px;
        left: 30px;
        width: 60px;
        height: 50px;
        background: #1976d2;
        border-radius: 10px;
      }
      
      .arm {
        position: absolute;
        top: 60px;
        width: 15px;
        height: 40px;
        background: #1976d2;
        
        &.left {
          left: 15px;
          transform: rotate(20deg);
        }
        
        &.right {
          right: 15px;
          transform: rotate(-20deg);
        }
      }
      
      .box {
        position: absolute;
        bottom: 20px;
        left: 45px;
        width: 30px;
        height: 20px;
        background: @warning-color;
        transform: rotate(15deg);
        
        &::before {
          content: "";
          position: absolute;
          top: -8px;
          left: 12px;
          width: 8px;
          height: 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 50%;
        }
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
