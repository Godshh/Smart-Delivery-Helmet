<template>
  <div class="service-center">
    <!-- 顶部身份临时提示 -->
    <div class="identity-header" v-if="showIdentityTip">
      <transition name="fade">
        <div :key="currentIdentity.name" class="identity-info">
          <img :src="currentIdentity.icon" class="identity-icon" />
          <span class="identity-text">{{ currentIdentity.name }}</span>
        </div>
      </transition>
    </div>

    <!-- 滑动内容 -->
    <swiper
      :direction="'vertical'"
      :slides-per-view="1"
      :mousewheel="true"
      :effect="'creative'"
      :creative-effect="{
        prev: {
          translate: [0, -60, 0], // 上一个滑块往上轻推
          scale: 0.95, // 稍微小一点
          opacity: 0.7,
        },
        next: {
          translate: [0, 0, 0], // 下一个滑块往下轻推
          scale: 0.95,
          opacity: 0.7,
        },
      }"
      class="service-swiper"
      @slideChangeTransitionStart="onSlideStart"
      @slideChangeTransitionEnd="onSlideEnd"
      ref="swiperRef"
    >


      <!-- 山地骑行 -->
      <swiper-slide class="slide mountain">
        <rider class="rider"></rider>
      </swiper-slide>

      <!-- 摩托通勤 -->
      <swiper-slide class="slide commute">
        <moto class="moto"></moto>

      </swiper-slide>
    </swiper>
  </div>
</template>
    
<script>
import "swiper/swiper-bundle.css";
import SwiperCore, { Mousewheel, EffectCreative } from "swiper";
import { Swiper, SwiperSlide } from "swiper/vue";
import wMain from "../waimai/wMain.vue";
import moto from "./moto.vue";
import rider from "./rider.vue";
SwiperCore.use([Mousewheel, EffectCreative]);

export default {
  name: "ServiceCenter",
  components: {
    Swiper,
    SwiperSlide,
    wMain,
    moto,
    rider
  },
  data() {
    return {
      currentIndex: 0,
      showIdentityTip: false,
      identities: [
        {
          name: "日常模式",
          icon: require("@/assets/imgs/mountain.png"),
        },
        {
          name: "音乐模式",
          icon: require("@/assets/imgs/commute.png"),
        },
      ],
      tipTimeout: null,
    };
  },
  computed: {
    currentIdentity() {
      return this.identities[this.currentIndex];
    },
  },
  methods: {
    onSlideChange(swiper) {
      this.currentIndex = swiper.activeIndex;
    },
    onSlideStart() {
      this.showIdentityTip = false; // 先隐藏，等待新的身份再显示
      if (this.tipTimeout) clearTimeout(this.tipTimeout);
    },

    onSlideEnd(swiper) {
      this.currentIndex = swiper.activeIndex;
      this.$nextTick(() => {
        this.showIdentityTip = true; // 等 slide 切完再显示
      });
      this.tipTimeout = setTimeout(() => {
        this.showIdentityTip = false;
      }, 1500); // 展示时间稍微延长一点，更顺滑
    },
  },
};
</script>
    
<style scoped>
.service-center {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  border-radius: 15px;
}

/* 顶部身份栏 */
.identity-header {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  
}

/* 身份图标 */
.identity-icon {
  width: 28px;
  height: 28px;
  margin-right: 10px;
}

/* 身份文字 */
.identity-text {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
}

/* 添加进出动画，包括位移和透明度 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Swiper */
.service-swiper {
  height: 100%;
}

/* Slide页面样式保持不变（略） */
.slide {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 80px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  border-radius: 15px;
}
.delivery::before,
.mountain::before,
.commute::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px);
  z-index: 1;
}
.delivery {
  background: linear-gradient(135deg, #ffedd5, #f97316);
}
.mountain {
  background: linear-gradient(135deg, #bbf7d0, #ffffffd7);
}
.commute {
  background: linear-gradient(135deg, #c7d2fe, #3b82f6);
}
.rider{
  position: absolute;
  top: 0;
  z-index: 2;
  width: 100%;

  height: 100%;
  display: flex;

  flex-direction: column;
}
.waimai{
  position: absolute;
  top: 0;
  z-index: 2;
  width: 100%;

  height: 100%;
  display: flex;
}
.moto{
  position: absolute;
  top: 0;
  z-index: 2;
  width: 100%;

  height: 100%;
  display: flex;
}
.identity-title {
  position: relative;
  z-index: 2;
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 40px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}
.card {
  position: relative;
  z-index: 2;
  width: 80%;
  margin: 12px 0;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}
</style>
  
  
  
  