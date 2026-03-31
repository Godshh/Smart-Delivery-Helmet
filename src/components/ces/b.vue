<template>
    <div class="gnMa">
      <!-- 红绿灯状态区域 -->
      <div class="rlt">
        <div class="rlt1">
          <div class="rlt2">
            <div class="rr" :class="{ 'active': collisionCount > 0 }"></div>
            <div class="ry"></div>
            <div class="rl"></div>
          </div>
          <div class="xingshi21">
            <div>碰撞状态</div>
          </div>
          <div class="xingshi22">
            <div class="xingshi222">{{ collisionStatus }}</div>
          </div>
        </div>
      </div>
  
      <!-- 视频和碰撞计数区域 -->
      <div class="gnxiao">
        <div class="gnxiao1">
          <div class="gnxiao11">
            <div class="gnxiao111">
              <div class="qianfzi">
                <div>碰撞检测视频</div>
                <div class="qiantu">
                  <svg
                    t="1733128171345"
                    class="icon"
                    viewBox="0 0 1078 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="5213"
                    width="25"
                    height="25"
                  >
                    <path
                      d="M577.441684 119.646316l86.231579-36.109474-18.863158 185.397895zM818.890105 0l95.393684 82.997895-226.357894 183.781052zM304.195368 122.341053L380.186947 19.941053l190.787369 222.046315zM0.229053 653.204211a62.410105 62.410105 0 0 1 63.595789-62.517895 30.558316 30.558316 0 0 0 15.629474-19.941053 1216.943158 1216.943158 0 0 0 29.103158-123.957895 142.605474 142.605474 0 0 1 113.178947-119.646315c21.557895-6.467368 43.654737-11.856842 65.751579-17.785264a524.988632 524.988632 0 0 1 171.385263-15.629473c39.882105 4.850526 80.303158 8.084211 119.646316 16.168421a86.231579 86.231579 0 0 1 64.134737 55.511579c19.941053 48.505263 40.96 97.010526 63.056842 144.976842a33.522526 33.522526 0 0 0 19.941053 18.32421 58.475789 58.475789 0 0 1 70.602105 44.193685v0.538947a57.074526 57.074526 0 0 1 2.694737 26.947368l-44.732632 17.785264a444.954947 444.954947 0 0 1 9.701053 52.277894c7.545263 80.842105 14.551579 162.223158 19.402105 243.065263a73.943579 73.943579 0 0 1-9.701053 41.498948 342.123789 342.123789 0 0 1-127.730526 14.551579c-31.258947-17.785263-15.629474-53.894737-27.486316-81.381053l-386.96421 36.648421a306.068211 306.068211 0 0 1-14.012632 85.153684 346.812632 346.812632 0 0 1-130.96421 12.39579 82.081684 82.081684 0 0 1-18.324211-45.271579c-4.850526-33.953684-6.467368-68.446316-9.162105-102.4l-12.934737-191.326316l-43.654737-8.08421a60.577684 60.577684 0 0 1-2.155789-22.096842z m589.608421 104.016842a458.536421 458.536421 0 0 0 54.433684 0 576.673684 576.673684 0 0 0 61.978947-14.551579c29.642105-10.24 21.018947-36.648421 18.324211-59.823158-2.155789-19.402105-14.551579-32.875789-30.72-25.869474a800.282947 800.282947 0 0 0-116.412632 61.44 21.557895 21.557895 0 0 0 12.39579 38.804211z m65.751579-209.111579c-18.324211-47.427368-36.648421-89.465263-51.2-132.581053a68.015158 68.015158 0 0 0-71.68-52.277895c-82.997895 3.772632-165.995789 8.623158-248.993685 15.629474a319.919158 319.919158 0 0 0-80.842105 21.557895 47.858526 47.858526 0 0 0-27.486316 24.791579c-15.629474 54.972632-28.025263 111.023158-42.576842 171.92421a1162.078316 1162.078316 0 0 0 522.778948-49.04421z m-534.63579 251.149473a615.801263 615.801263 0 0 0 63.056842 1.616842 191.649684 191.649684 0 0 0 42.576842-8.08421 43.115789 43.115789 0 0 0 23.713685-22.096842 34.654316 34.654316 0 0 0-17.785264-25.869474 827.930947 827.930947 0 0 0-103.477894-33.414737 27.378526 27.378526 0 0 0-36.648421 13.473685 28.941474 28.941474 0 0 0-2.694737 11.317894c-4.850526 39.343158 4.311579 59.823158 31.258947 63.056842z m651.587369-172.463158a849.219368 849.219368 0 0 0 205.877894-3.772631c-10.778947-49.583158-20.48-95.393684-31.797894-140.665263a37.402947 37.402947 0 0 0-21.018948-20.48 234.549895 234.549895 0 0 0-60.362105-17.246316c-57.128421-5.389474-114.795789-9.162105-172.463158-11.856842-6.467368-16.707368-13.473684-33.414737-19.941053-50.661053 20.48-2.694737 40.421053-4.850526 60.901053-7.545263a372.250947 372.250947 0 0 1 128.808421 12.934737c16.168421 4.850526 32.875789 9.162105 49.044211 14.551579a113.771789 113.771789 0 0 1 85.153684 98.088421 916.210526 916.210526 0 0 0 22.096842 101.322105 22.312421 22.312421 0 0 0 11.317895 16.168421 57.505684 57.505684 0 0 1 46.349473 68.985263l-32.875789 7.006316c-3.233684 52.277895-6.467368 104.555789-10.24 156.294737-1.616842 28.025263-2.694737 56.589474-6.467369 84.075789a75.829895 75.829895 0 0 1-13.473684 37.187369 244.089263 244.089263 0 0 1-98.627368-10.24 279.228632 279.228632 0 0 1-10.778948-70.063158l-107.250526-10.778947c-4.311579-66.829474-9.701053-134.197895-15.090526-201.027369-2.694737-17.785263-5.389474-35.031579-9.701053-52.277895h0.538948z m118.029473 137.970527a31.420632 31.420632 0 0 0 17.785263 18.32421 107.789474 107.789474 0 0 0 31.797895 6.467369 464.410947 464.410947 0 0 0 47.427369-1.077895c19.941053-2.694737 26.947368-19.941053 23.174736-51.2a21.557895 21.557895 0 0 0-19.402105-22.635789 21.881263 21.881263 0 0 0-10.24 2.155789 575.002947 575.002947 0 0 0-77.608421 26.947368 26.947368 26.947368 0 0 0-12.934737 21.018948z"
                      fill="#ffffff"
                      p-id="5214"
                    ></path>
                  </svg>
                </div>
              </div>
              <img :src="videoFrameSrc" class="collision-video" :class="{ 'alert-red': hasCollision }" />
            </div>
          </div>
          <div class="gnxiao12">
            <div class="gnxiao121">
              <div class="qianfzi">
                <div>碰撞次数</div>
              </div>
              <div class="qianfm">{{ collisionCount }}</div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 控制按钮区域 -->
      <div class="xingshi">
        <div class="xingshi1">
          <div class="xingshi2">
            <div class="xingshi21">
              <div>控制</div>
            </div>
            <div class="xingshi22">
              <button @click="startDetection">开始检测</button>
              <button @click="stopDetection">停止检测</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CollisionDetection',
    data() {
      return {
        socket: null,
        collisionCount: 0,
        hasCollision: false,
        videoFrameSrc: '',
        collisionStatus: '正常'
      };
    },
    methods: {
      startDetection() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
  
        // 连接到 WebSocket 服务器
        this.socket = new WebSocket('ws://localhost:8764');
  
        this.socket.onopen = () => {
          console.log('Connected to WebSocket server');
        };
  
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.collisionCount = data.collision_count;
            this.hasCollision = data.has_collision;
            this.videoFrameSrc = 'data:image/jpeg;base64,' + data.frame;
            this.collisionStatus = this.hasCollision ? '碰撞检测中' : '正常';
  
            if (this.hasCollision) {
              setTimeout(() => {
                this.hasCollision = false;
              }, 300);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };
  
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
  
        this.socket.onclose = () => {
          console.log('Disconnected from WebSocket server');
          this.collisionCount = 0;
          this.hasCollision = false;
          this.videoFrameSrc = '';
          this.collisionStatus = '正常';
        };
      },
      stopDetection() {
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
      }
    }
  };
  </script>
  
  <style scoped lang="less">
  .gnMa {
    width: 100%;
    display: flex;
    height: 100%;
    flex-direction: column;
    border-radius: 20px;
  
    .rlt {
      width: 100%;
      height: 125px;
      display: flex;
      justify-content: center;
  
      .rlt1 {
        background-color: #fafafa47;
        width: 95%;
        height: 100%;
        border-radius: 10px;
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: space-evenly;
  
        .rlt2 {
          width: 100%;
          align-items: center;
          justify-content: space-evenly;
          display: flex;
          height: 80%;
  
          .rr {
            background-color: #d81010d8;
            width: 21%;
            height: 80%;
            border-radius: 100px;
            opacity: 0.3;
            &.active {
              opacity: 1;
            }
          }
          .ry {
            background-color: #e8d61549;
            width: 21%;
            height: 80%;
            border-radius: 150px;
          }
          .rl {
            background-color: #3fd8103f;
            width: 21%;
            height: 80%;
            border-radius: 100px;
          }
        }
      }
    }
  
    .gnxiao {
      width: 100%;
      display: flex;
      justify-content: center;
      height: 400px; /* 增加高度以适应视频 */
      align-items: end;
  
      .gnxiao1 {
        width: 95%;
        height: 95%;
        display: flex;
        justify-content: space-between;
  
        .gnxiao11 {
          background-color: #fafafa47;
          width: 70%; /* 视频占更多空间 */
          height: 100%;
          border-radius: 10px;
          justify-content: center;
          align-items: center;
          display: flex;
  
          .gnxiao111 {
            width: 90%;
            height: 90%;
            display: flex;
            flex-direction: column;
  
            .qianfzi {
              color: #ffffff;
              display: flex;
              justify-content: space-between;
  
              .qiantu {
                border: #ffffff solid 5px;
                padding: 10px 12px 10px 12px;
                border-radius: 50px;
              }
            }
  
            .collision-video {
              width: 100%;
              height: 80%;
              object-fit: cover;
              transition: background-color 0.3s;
  
              &.alert-red {
                background-color: rgba(255, 0, 0, 0.5);
              }
            }
          }
        }
  
        .gnxiao12 {
          background-color: #fafafa47;
          width: 25%;
          height: 100%;
          border-radius: 10px;
          justify-content: center;
          align-items: center;
          display: flex;
  
          .gnxiao121 {
            width: 90%;
            height: 90%;
            display: flex;
            flex-direction: column;
  
            .qianfzi {
              color: #ffffff;
              display: flex;
              justify-content: space-between;
            }
  
            .qianfm {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 35px;
              font-weight: bold;
              color: #ce1111;
            }
          }
        }
      }
    }
  
    .xingshi {
      width: 100%;
      height: 150px;
      display: flex;
      justify-content: center;
      align-items: end;
  
      .xingshi1 {
        background-color: #fafafa47;
        border-radius: 10px;
        width: 95%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 95%;
  
        .xingshi2 {
          width: 95%;
          height: 90%;
          display: flex;
          flex-direction: column;
  
          .xingshi21 {
            justify-content: space-between;
            display: flex;
            color: rgb(255, 255, 255);
            align-items: center;
          }
  
          .xingshi22 {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
  
            button {
              padding: 10px 20px;
              font-size: 16px;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 0 10px;
  
              &:hover {
                background-color: #0056b3;
              }
            }
          }
        }
      }
    }
  }
  </style>