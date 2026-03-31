<template>
  <div class="co">
    <div class="cotop"><div>智能头盔</div></div>
    <div class="co1">
      <div class="cotu">
        <svg
          t="1732014604982"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11103"
          width="256"
          height="256"
        >
          <path
            d="M903.253333 682.666667c22.826667-52.266667 35.413333-110.08 35.413334-170.666667 0-235.733333-190.933333-426.666667-426.666667-426.666667S85.333333 276.266667 85.333333 512h426.666667l0.213333 170.666667c0 82.56 66.773333 149.333333 149.333334 149.333333s149.333333-66.773333 149.333333-149.333333h92.373333z"
            fill="#FFB22F"
            p-id="11104"
          ></path>
          <path
            d="M661.333333 725.333333c23.466667 0 42.666667-19.2 42.666667-42.666666s-19.2-42.666667-42.666667-42.666667-42.666667 19.2-42.666666 42.666667 19.2 42.666667 42.666666 42.666666z"
            fill="#333333"
            p-id="11105"
          ></path>
        </svg>
      </div>
    </div>
    <div class="coyin"><div></div></div>
    <div class="tuogn">
      <div class="jign">
        <div class="ji1">
          <div class="ji11">
            <div class="jitop">
              双模充电状态
              <div class="mode-switch">
                <span
                  :class="{ active: activeIndex === 0 }"
                  @click="switchMode(0),speck('剩余电量97%')"
                  ref="buttons"
                  >电池</span
                >
                <span
                  :class="{ active: activeIndex === 1 }"
                  @click="switchMode(1),speck('看我太阳能发电！')"
                  ref="buttons"
                  >太阳能</span
                >
                <div class="slider" :style="sliderStyle"></div>
              </div>
            </div>

            <div class="hybrid-energy">
              <!-- 电量显示模块 -->
              <div class="main-battery" v-show="activeIndex === 0">
                <div class="dshu">{{ batteryNumber }}%</div>
                <div class="dzi">总剩余电量</div>
                <div
                  class="battery-layer"
                  :style="{ width: batteryPercentage + '%' }"
                ></div>

                <!-- 状态标签 -->
                <div class="status-tags">
                  <div class="tag solar-status">
                    <div class="dot"></div>
                    <span>太阳能充电中</span>
                  </div>
                  <div class="tag battery-status">
                    <div class="dot"></div>
                    <span>电池健康状态</span>
                  </div>
                </div>
              </div>

              <!-- 太阳能模块 -->
              <div class="solar-stats" v-show="activeIndex === 1">
                <div class="power-flow">
                  <div class="sun-icon">🌤</div>
                  <div class="power-value">+{{ powerValue }}W</div>
                  <div
                    class="charging-bar"
                    :style="{ width: solarCharging + '%' }"
                  ></div>
                </div>
                <div class="storage-info">
                  <div class="storage-item">
                    <label>今日发电</label>
                    <span>{{ todayGenerated.toFixed(2) }}kWh</span>
                  </div>
                  <div class="storage-item">
                    <label>累计储电</label>
                    <span>{{ totalStorage.toFixed(2) }}kWh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="ji2">
          <div class="ji21" @click="onLocateHelmet">
            <div class="ji2p">
              <div class="ji21tu"></div>
              <div class="ji21zi">头盔定位</div>
            </div>
          </div>
          <div class="ji22" @click="speck('寻盔鸣笛!啊呜呜呜啊呜呜呜')">
            <div class="ji2p">
              <div class="ji22tu"></div>
              <div class="ji22zi">寻盔鸣笛</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="gj">
      <div class="gj1">
        <div class="hanzi" @click="initAudio">服务</div>
        <div class="gjco">
          <div class="gjco1" @click="onCXGJ">
            <div class="gjco11">
              <div class="gjco111">
                <div class="gjcozi">历史骑行轨迹</div>
                <div>
                  <svg
                    t="1732032896601"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="4283"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M810.666667 213.333333c72.533333 0 128 55.466667 128 128s-55.466667 128-128 128H213.333333v85.333334h597.333334c119.466667 0 213.333333-93.866667 213.333333-213.333334s-93.866667-213.333333-213.333333-213.333333H213.333333v85.333333h597.333334z"
                      fill="#707070"
                      p-id="4284"
                    ></path>
                    <path
                      d="M213.333333 554.666667h597.333334v-85.333334H213.333333c-119.466667 0-213.333333 93.866667-213.333333 213.333334s93.866667 213.333333 213.333333 213.333333h597.333334v-85.333333H213.333333c-72.533333 0-128-55.466667-128-128s55.466667-128 128-128zM128 42.666667C55.466667 42.666667 0 98.133333 0 170.666667s55.466667 128 128 128 128-55.466667 128-128-55.466667-128-128-128z m0 170.666666c-25.6 0-42.666667-17.066667-42.666667-42.666666s17.066667-42.666667 42.666667-42.666667 42.666667 17.066667 42.666667 42.666667-17.066667 42.666667-42.666667 42.666666z"
                      fill="#707070"
                      p-id="4285"
                    ></path>
                    <path
                      d="M896 725.333333c-72.533333 0-128 55.466667-128 128s55.466667 128 128 128 128-55.466667 128-128-55.466667-128-128-128z m0 170.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667s17.066667-42.666667 42.666667-42.666666 42.666667 17.066667 42.666667 42.666666-17.066667 42.666667-42.666667 42.666667z"
                      fill="#707070"
                      p-id="4286"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="gjco2" @click="onVideo">
            <div class="wear-card">
              <div class="wearing-status">
                <div class="title1">佩戴状态监测</div>
                <div class="recording-status">
                  <div class="led" :class="{ active: isRecording }"></div>
                  <span class="label">{{
                    isRecording ? "录像进行中" : "录像已停止"
                  }}</span>
                </div>
              </div>

              <div>
                <div class="helmet-status" :class="{ wearing: isWearing }">
                  <div class="helmet-icon">🛡️</div>
                  <div class="status-indicator">
                    {{ isWearing ? "已正确佩戴" : "未检测到佩戴" }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import eventBus from "@/eventBus.js";

export default {
  data() {
    return {
      isCameraOn: false,
      isLoading: false,
      videoPath: "",
      activeIndex: 0,
      isWearing: true,
      isRecording: true,
      batteryNumber: 0,
      buttonWidths: [],
      batteryPercentage: 0,
      solarCharging: 0,
      powerValue: 18,
      todayGenerated: 2.4,
      totalStorage: 18.7,
      audioUnlocked: false, // 添加 audioUnlocked 状态
    };
  },
  mounted() {
    this.startSolarSimulation();
    this.animateBattery(97);
    this.animateNumber("batteryNumber", 97);
    this.$nextTick(() => {
      const buttons = this.$el.querySelectorAll(".mode-switch span");
      this.buttonWidths = Array.from(buttons).map((btn) => btn.offsetWidth);
    });

    // 尝试自动解锁音频
    this.initAudio();

  },
  computed: {
    sliderStyle() {
      const offset = this.buttonWidths
        .slice(0, this.activeIndex)
        .reduce((a, b

) => a + b, 0);
      const width = this.buttonWidths[this.activeIndex] || 0;
      return {
        transform: `translateX(${offset}px)`,
        width: `${width}px`,
      };
    },
  },
  methods: {
    initAudio() {
      if (this.audioUnlocked) return;

      // 尝试播放一个无声的音频来解锁音频权限
      const audio = new Audio();
      audio.play().catch((error) => {
        console.warn("自动解锁音频失败，需用户交互:", error);
      });

      this.audioUnlocked = true;
      console.log("✅ 已尝试解锁音频播放");
    },
    async toggleCamera() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        if (!this.isCameraOn) {
          const response = await fetch(
            "http://192.168.99.44:5000/start_recording",
            {
              method: "POST",
            }
          );
          const data = await response.json();
          if (data.status === "recording started") {
            this.isCameraOn = true;
          }
        } else {
          const response = await fetch("http://192.168.99.44/stop_recording", {
            method: "POST",
          });
          const data = await response.json();
          if (data.status === "recording stopped") {
            this.videoPath = data.video_path;
            this.isCameraOn = false;
            alert(`视频已保存至：${this.videoPath}`);
          }
        }
      } catch (error) {
        console.error("操作失败:", error);
        alert("操作失败，请检查树莓派连接");
      } finally {
        this.isLoading = false;
      }
    },
    speck(text) {
      // 触发父组件事件
      this.$emit("onSpeck", text);
    },
    onCXGJ() {
      console.log(1);
      this.$emit("onCx");
    },
    onGN() {
      console.log(2);
      this.$emit("onGn");
    },
    onVideo() {
      console.log(3);
      this.$emit("onVideo");
    },
    onLocateHelmet() {
      eventBus.emit('locate-helmet');
      this.speck('头盔定位啦！');
      alert('已发送头盔定位请求');
    },
    switchMode(index) {
      this.activeIndex = index;
      if (index === 0) {
        this.batteryPercentage = 0;
        this.animateBattery(97);
        this.animateNumber("batteryNumber", 97);
      } else {
        this.animateSolar(68);
      }
      console.log("当前模式:", index);
    },
    animateBattery(target) {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= target) {
          clearInterval(interval);
        } else {
          current += 1;
          this.batteryPercentage = current;
        }
      }, 20);
    },
    animateSolar(target) {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= target) {
          clearInterval(interval);
        } else {
          current += 1;
          this.solarCharging = current;
        }
      }, 25);
    },
    animateNumber(key, target) {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= target) {
          clearInterval(interval);
        } else {
          current += 1;
          this[key] = current;
        }
      }, 20);
    },
    startSolarSimulation() {
      this.powerValue = this.randomInt(15, 25);
      this.todayGenerated = 2.4;
      this.totalStorage = 18.7;

      setInterval(() => {
        this.powerValue = this.randomInt(15, 25);
        this.todayGenerated =
          parseFloat(this.todayGenerated) + Math.random() * 0.1;
        this.totalStorage =
          parseFloat(this.totalStorage) + Math.random() * 0.05;
      }, 3000);
    },
    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
  },
};
</script>

<style lang="less" scoped>
.co {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: auto;
  background-color: #fff;
  height: 100%;
  border-radius: 20px;
  .cotop {
    font-size: 25px;
    color: #000000;
    background-color: #ffffff;
    border-radius: 20px 20px 0px 0px;
    div {
      margin: 20px;
    }
  }
  .co1 {
    justify-content: center;
    align-items: center;
    flex-direction: column;
    display: flex;
  }
}
.coyin {
  display: flex;
  justify-content: center;
  div {
    background-color: #ab9b9b;
    width: 180px;
    height: 15px;
    border-radius: 45%;
  }
}
.tuogn {
  margin-top: 15px;
  .jign {
    height: 180px;
    width: 100%;
    display: flex;
    justify-content: space-around;
  }
  .ji1 {
    background-color: #f7f7f7;
    width: 46%;
    height: 100%;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    .ji11 {
      width: 80%;
      height: 80%;
    }
    .jitop {
      // font-size: clamp(14px, 2vw, 18px);
      font-size: 18px;
    }
    .dian {
      margin-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .dshu {
        font-size: 20px;
        font-weight: bolder;
      }
      .dzi {
        color: #adadad;
      }
    }
    .diantu {
      margin-top: 10px;
      width: 100%;
      height: 50px;
      display: flex;
      .dtz1 {
        width: 94%;
        border: #e9e7e7 3px solid;
        height: 100%;
        border-radius: 20px;
        display: flex;
        div {
          //电量97%
          background-color: #4ffd6c;
          width: 97%;
          border-radius: 17px;
        }
      }
      .dtz2 {
        width: 4%;
        height: 100%;
        display: flex;
        align-items: center;
        div {
          background-color: #e9e7e7;
          width: 100%;
          height: 20px;
        }
      }
    }
  }
  .ji2 {
    width: 46%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    .ji21 {
      background-color: #66d777;
      width: 100%;
      height: 47%;
      border-radius: 20px;
      display: flex;
      justify-content: center;
      .ji21tu {
        background-color: #137e1c;
        width: 55px;
        height: 55px;
        border-radius: 50px;
      }
      .ji21zi {
        font-size: 18px;
      }
    }
    .ji2p {
      width: 80%;
      justify-content: space-between;
      display: flex;
      align-items: center;
    }
    .ji22 {
      background-color: #cf3232;
      width: 100%;
      height: 48%;
      border-radius: 20px;
      display: flex;
      justify-content: center;
      .ji22tu {
        background-color: #7e1313;
        width: 55px;
        height: 55px;
        border-radius: 50px;
      }
      .ji22zi {
        font-size: 18px;
      }
    }
  }
}
.gj {
  margin-top: 5px;
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  .gj1 {
    width: 96%;
    display: flex;
    flex-direction: column;
    .hanzi {
      font-size: 26px;
    }
    .gjco {
      padding-top: 15px;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      .gjco1 {
        width: 48%;
        height: 100%;
        background-color: #db1b1b;
        display: flex;
        border-radius: 14px;
        background-image: url(/src/img/map.jpg);
        background-size: cover; /* 背景图片的大小 */
        background-position: center; /* 背景图片的位置 */
        display: flex;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        justify-content: center;
        .gjco11 {
          margin-top: 120px;
          background-color: #fff;
          width: 90%;
          opacity: 0.7;
          height: 35px;
          border-radius: 6px;
          .gjco111 {
            justify-content: center;
            align-items: center;
            display: flex;
            font-weight: 600;
            height: 100%;
            .gjcozi {
              margin-right: 10px;
              font-size: 12px;
              color: #0a0202;
            }
          }
        }
      }
    }
  }
}
.tuogn {
  .jign {
    height: 180px;
    width: 100%;
    display: flex;
    justify-content: space-around;
  }
  .ji1 {
    background: linear-gradient(145deg, #ffffff, #f5f5f5);
    width: 46%;
    height: 100%;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.3);
    .ji11 {
      width: 80%;
      height: 80%;
    }
    .jitop {
      font-size: 18px;
      color: #3c3c3c;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .dian {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .dshu {
        font-size: 26px;
        font-weight: 800;
        color: #2c3e50;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
      }
      .dzi {
        color: #909399;
        font-size: 14px;
      }
    }
    .diantu {
      margin-top: 15px;
      width: 100%;
      height: 50px;
      display: flex;
      align-self: flex-end;
      .dtz1 {
        width: 94%;
        background: rgba(232, 232, 232, 0.6);
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        position: relative;
        div {
          background: linear-gradient(90deg, #6de89b 0%, #4bc2ff 100%);
          width: 97%;
          border-radius: 17px;
          height: 100%;
          box-shadow: inset 2px 0 4px rgba(255, 255, 255, 0.3);
          position: relative;
          &::after {
            content: "";
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.6) 0%,
              rgba(255, 255, 255, 0.2) 100%
            );
          }
        }
      }
      .dtz2 {
        width: 4%;
        height: 100%;
        display: flex;
        align-items: center;
        div {
          background: rgba(210, 210, 210, 0.8);
          width: 100%;
          height: 20px;
          border-radius: 4px;
        }
      }
    }
  }
  .ji2 {
    width: 46%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    gap: 15px;
    .ji21,
    .ji22 {
      width: 100%;
      height: 47%;
      border-radius: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      &:active {
        transform: scale(0.98);
      }
    }
    .ji21 {
      background: linear-gradient(135deg, #6cd479, #4abf54);
      .ji21tu {
        background: rgba(19, 126, 28, 0.9);
        width: 55px;
        height: 55px;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .ji21zi {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
        letter-spacing: 1px;
      }
    }
    .ji22 {
      background: linear-gradient(135deg, #ff6161, #e33b3b);
      .ji22tu {
        background: rgba(126, 19, 19, 0.9);
        width: 55px;
        height: 55px;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .ji22zi {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
        letter-spacing: 1px;
      }
    }
    .ji2p {
      width: 80%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
    }
  }
}
.gj {
  margin-top: 5px;
  width: 100%;
  height: 200px;
  .gj1 {
    width: 96%;
    .hanzi {
      font-size: 20px;
      color: #3c3c3c;
      font-weight: 600;
      padding-left: 8px;
    }
    .gjco {
      padding-top: 15px;
      .gjco1 {
        border-radius: 14px;
        overflow: hidden;
        position: relative;
        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.4) 0%,
            transparent 50%
          );
        }
        .gjco11 {
          margin-top: 120px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          .gjco111 {
            color: #2c3e50;
            .gjcozi {
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
/* 添加所有hover效果 */
.ji21:hover,
.ji22:hover {
  transform: translateY(-2px);
}
// 达瓦达瓦达瓦达瓦达瓦达瓦大·的蛙壶打完好的
.ji1 {
  /* 保持原有容器样式不变 */
  .hybrid-energy {
    width: 100%;
    height: 80%;
    position: relative;
  }
  .main-battery {
    text-align: center;
    margin-bottom: 18px;
    .dshu {
      font-size: 25px;
      color: #2ecc71;
      font-weight: 800;
      text-shadow: 0 2px 4px rgba(46, 204, 113, 0.2);
    }
    .dzi {
      color: #95a5a6;
      font-size: 12px;
      letter-spacing: 1px;
    }
    .battery-layer {
      position: absolute;
      height: 15%;
      background: linear-gradient(90deg, #2ecc71 0%, #1abc9c 100%);
      border-radius: 12px;
      transition: width 0.5s;
    }
  }
  .status-tags {
    margin-top: 30px;
    display: flex;
    gap: 12px;
    .tag {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      &.solar-status .dot {
        background: linear-gradient(45deg, #f1c40f, #f39c12);
      }
      &.battery-status .dot {
        background: linear-gradient(45deg, #2ecc71, #1abc9c);
      }
    }
  }
  @keyframes solar-pulse {
    0%,
    100% {
      opacity: 0.95;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes ripple {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
}
// 达瓦达瓦大屋顶
/* 切换控制器样式 */
.jitop {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mode-switch {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  span {
    position: relative;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    z-index: 0;
    transition: color 0.3s;
    &.active {
      color: #fff;
    }
  }
  .slider {
    position: absolute;
    height: 80%;
    background: linear-gradient(45deg, #2ecc71, #1abc9c);
    border-radius: 16px;
    top: 10%;
    left: 0;
    transition: all 0.3s ease;
  }
}
.main-battery {
  text-align: center;
  padding: 12px 0;
  animation: fadeIn 0.5s;
}
.solar-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideUp 0.5s;
}
.power-flow {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  margin-top: 10px;
  border-radius: 12px;
  .sun-icon {
    font-size: 24px;
  }
  .power-value {
    font-size: 18px;
    color: #f1c40f;
    font-weight: bold;
  }
  .charging-bar {
    height: 10px;
    background: linear-gradient(90deg, #f1c40f, #f39c12);
    border-radius: 5px;
    margin-left: auto;
    width: 40%;
  }
}
.storage-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  .storage-item {
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 8px;
    label {
      display: block;
      color: #95a5a6;
      font-size: 12px;
    }
    span {
      font-weight: bold;
      font-size: 14px;
      color: #2c3e50;
    }
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.mode-switch span.active {
  background-color: #2dc234;
  border-radius: 15px;
  color: #ffffff; /* 当前激活变白色，搭配绿色背景 */
}
.mode-switch span {
  position: relative;
  z-index: 1;
  color: #333; /* 默认黑色 */
}
/* 佩戴状态样式 */
.gjco2 {
  width: 47%;
  height: 100%;
  display: flex;
  padding-bottom: 5px;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #ffffff, #f5f5f5);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.wear-card {
  background: rgba(255, 255, 255, 0.0);
  width: 90%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  padding: 0px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.0);
}
.wearing-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title1 {
  font-size: 20px;
  color: #3c3c3c;
  font-weight: 600;
}
.helmet-status {
  text-align: center;
  padding: 0px 0px;
}
.helmet-icon {
  font-size: 4em;
  transition: all 0.3s;
  margin-bottom: 0px;
}
.wearing .helmet-icon {
  color: #2563eb;
  transform: scale(1.1);
}
.status-indicator {
  font-size: 16px;
  color: #2563eb;
  font-weight: 600;
  display: flex;
  padding: 5px;
  justify-content: center;
  align-items: center;
  height: 16px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.1);
}
/* 录像状态指示 */
.recording-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 20px;
  margin-top: 0;
  padding: 0 0;
}
.led {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s;
}
.led.active {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
.label {
  color: #64748b;
  font-weight: 500;
}
.status-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.95em;
}
.icon {
  font-size: 1.2em;
}
</style>