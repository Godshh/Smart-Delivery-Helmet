<template>
  <div class="main" v-if="showDenlu">
    <div class="top">
      <div class="bi">
        <div class="tub">
          <img
            src="imgs/zq.jpg"
            alt=""
            width="50"
            height="50"
            style="border-radius: 50px"
          />
        </div>
        <div class="den" @click="ToDenlu">张盔盔</div>
      </div>
      <div class="time">{{ currentTime }}</div>
    </div>

    <div id="wrapper" ref="wrapper">
      <div class="container1" ref="container1">
        <Map />
      </div>

      <div class="resizer" @mousedown="initResize"  @touchstart="initResize">
        <div class="zi"></div>
      </div>

      <div class="container2" ref="container2">
        <KM
          v-if="zhu === 'kt'"
          @onSpeck="handCallAI"
          @onCx="showGXJ"
          @onGn="showGn"
          @onVideo="showVideo"
        />
        <!-- <WM v-else-if="zhu === 'wm'" /> -->
        <GnMain v-else-if="zhu === 'gogn'" />
        <WM
          v-else-if="zhu === 'goshi'"
          :orders="orders"
          @update-task="updateTask"
        />
        <CXGJ v-else-if="zhu === 'wxgj'" @reHome="qhKt" @onwx="showXs" />
        <GZ v-else-if="zhu === 'gh'" @reHome="showGXJ" />
        <service-center v-else-if="zhu === 'servecs'" @reHome="qhKt" />
        <sb v-else-if="zhu === 'sb'" @reHome="qhKt"></sb>
        <teamMain v-else-if="zhu === 'team'"  />
        <RadarFeedback v-else-if="zhu === 'radar'" @reHome="qhKt" />
        <RadarDisplay v-else-if="zhu === 'radarDisplay'" @reHome="qhKt" />
        <TKGN v-else @reHome="qhKt" />

        <div class="zhuxian">
          <div class="zhuxian1">
            <div class="zhudian1" @click="onWM"></div>
            <div class="zhudian1" @click="qhKt"></div>
            <div class="zhudian1" @click="qhGn"></div>
            <div class="zhudian1" @click="qhshix"></div>
            <div class="zhudian1" @click="onTeam"></div>
            <div class="zhudian1" @click="onRadar"></div>
            <div class="zhudian1" @click="onRadarDisplay"></div>
          </div>
        </div>
      </div>
    </div>
    <a-imodel ref="childRef"></a-imodel>
  </div>

  <Denlu v-else @showdenlu="getValueFromChild" />
</template>


<script>
import sb from "./zntk/sb.vue";
import WM from "./waimai/wMain.vue";
import KM from "./zntk/kMain.vue";
import Map from "./ditu/zmap.vue";
import CXGJ from "./zntk/cxgj.vue";
import GZ from "./zntk/gz.vue";
import TKGN from "./zntk/tkgn.vue";
import GnMain from "./cargn/gnMain.vue";
import shiMain from "./shiping/shiMain.vue";
import Denlu from "./denlu.vue";
import teamMain from "./TeamTalk/teamMain.vue";
import RadarFeedback from "./zntk/radarFeedback.vue";
import RadarDisplay from "./zntk/radarDisplay.vue";

import ServiceCenterVue from "./servecs/ServiceCenter.vue";

import text11 from "./servecs/text11.vue";

import text12 from "./servecs/text12.vue";

import AImodel from "./servecs/AImodel.vue";

export default {
  name: "App",
  components: {
    WM,
    KM,
    sb,
    Map,
    CXGJ,
    text11,
    GZ,
    TKGN,
    GnMain,
    shiMain,
    Denlu,
    text12,
    ServiceCenter: ServiceCenterVue,
    AImodel,
    teamMain,
    RadarFeedback,
    RadarDisplay,
  },
  data() {
    return {
      startX: 0,
      startWidth1: 0,
      startWidth2: 0,
      container1: null,
      container2: null,
      currentTime: this.formatTime(new Date()),
      zhu: "kt",
      showDenlu: false,
    };
  },
  mounted() {
    setInterval(this.updateTime, 5000);
  },
  methods: {
    // 获取外卖订单数据
    updateTask({ id, status }) {
      const order = this.orders.find((o) => o.id === id);
      if (order) {
        order.status = status;
      }
    },
    handCallAI(data) {
      console.log(data);
      this.$refs.childRef.speak(data);
    },
    getValueFromChild(value) {
      this.showDenlu = value;
    },
    ToDenlu() {
      this.showDenlu = !this.showDenlu;
    },
    updateTime() {
      this.currentTime = this.formatTime(new Date());
    },
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },
    showGn() {
      this.zhu = "gn";
    },
    showVideo() {
      this.zhu = "sb";
    },
    onWM() {
      // this.zhu = 'wm';
      this.zhu = "servecs";
    },
    showGXJ() {
      this.zhu = "wxgj";
    },
    qhKt() {
      this.zhu = "kt";

      // servecs
    },
    showXs() {
      this.zhu = "gh";
    },
    qhGn() {
      this.zhu = "gogn";
    },
    qhshix() {
      this.zhu = "goshi";
    },
    qhtext() {
      this.zhu = "text";
    },
    onTeam() {
      this.zhu = "team";
    },
    onRadar() {
      this.zhu = "radar";
    },
    onRadarDisplay() {
      this.zhu = "radarDisplay";
    },

// 分栏拖动初始化
  initResize(e) {
    e.preventDefault();

    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;

    const container1 = this.$refs.container1;
    const container2 = this.$refs.container2;

    if (!container1 || !container2) return;

    this.container1 = container1;
    this.container2 = container2;
    this.startX = clientX;
    this.startWidth1 = container1.offsetWidth;
    this.startWidth2 = container2.offsetWidth;

    // 绑定事件
    if (isTouch) {
      document.addEventListener("touchmove", this.resize, { passive: false });
      document.addEventListener("touchend", this.stopResize);
    } else {
      document.addEventListener("mousemove", this.resize);
      document.addEventListener("mouseup", this.stopResize);
    }
  },

  // 拖动分栏逻辑
  resize(e) {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;

    if (!this.container1 || !this.container2 || !this.$refs.wrapper) return;

    if (isTouch) e.preventDefault(); // 阻止触摸滚动页面

    const delta = clientX - this.startX;
    const wrapperWidth = this.$refs.wrapper.offsetWidth;

    const newWidth1 = this.startWidth1 + delta;
    const newWidth2 = this.startWidth2 - delta;

    const minWidthLeft = 400; // 左侧最小宽度
    const minWidthRight = 550; // 右侧最小宽度

    if (
      newWidth1 >= minWidthLeft &&
      newWidth2 >= minWidthRight &&
      newWidth1 + newWidth2 <= wrapperWidth
    ) {
      this.container1.style.flex = `0 0 ${newWidth1}px`;
      this.container2.style.flex = `0 0 ${newWidth2}px`;
    }
  },

  // 拖动结束解绑事件
  stopResize(e) {
    if (e.type.startsWith("touch")) {
      document.removeEventListener("touchmove", this.resize);
      document.removeEventListener("touchend", this.stopResize);
    } else {
      document.removeEventListener("mousemove", this.resize);
      document.removeEventListener("mouseup", this.stopResize);
    }
  },
  },
};
</script>

<style scoped lang="less">
#wrapper {
  display: flex;
  width: 97%;
  height: 800px;
  position: relative;
}
.bi {
  align-items: center;
  display: flex;
}
.time {
  font-size: 35px;
  color: #ffffff;
}
.top {
  width: 97%;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  height: 55px;
  justify-content: space-between;

  .tub {
    border-radius: 50px;
    width: 50px;
    display: flex;
    height: 50px;
    justify-content: center;
    align-items: center;
    border: #fcfcfe solid 2px;

    opacity: 0.8;
  }
  .den {
    font-size: 20px;
    color: #ffffff;
    margin-left: 20px;
    font-weight: bolder;
  }
}
.resizer {
  opacity: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 15px;
  cursor: ew-resize;

  border-radius: 20px;
  .zi {
    width: 5px;
    background-color: #eff1f0c3;
    height: 75px;
    border-radius: 5px;
  }
}
.main {
  background: linear-gradient(
    135deg,
    #0769f3,
    #0408e5,
    #36f6f9,
    #e40aa6,
    #a30fe8
  );
  flex-direction: column;
  position: absolute;
  top: 0;
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  display: flex;

  justify-content: center;
  align-items: center;
  left: 0;
  width: 100%;
  height: 100%;
}
.container1 {
  flex: 1;
  border-radius: 20px;
  display: flex;
}
.container2 {
  flex: 1;

  border-radius: 20px;
  display: flex;
  flex-direction: column;
}
.zhuxian {
  width: 100%;
  margin-top: 5px;

  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;

  .zhuxian1 {
    display: flex;
    gap: 14px; // 用gap替代margin间距
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .zhudian1 {
    width: 15px;
    height: 15px;
    background: linear-gradient(145deg, #f0f0f0, #c5c5c5);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    // 悬停效果
    &:hover {
      transform: scale(1.2);
      background: linear-gradient(145deg, #6ab7ff, #1a73e8);
      box-shadow: 0 3px 8px rgba(26, 115, 232, 0.3);
    }
    &.active {
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #4a90e2, #1a73e8);
      box-shadow: 0 0 12px rgba(26, 115, 232, 0.4);
      animation: pulse 1.5s infinite;
    }

    // 点击涟漪效果
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.3s ease-out;
    }

    &:active::after {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }

    // 当前选中状态
    &[class*="active"] {
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #4a90e2, #1a73e8);
      box-shadow: 0 0 12px rgba(26, 115, 232, 0.4);
    }
  }
}
// 增加呼吸动画
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>