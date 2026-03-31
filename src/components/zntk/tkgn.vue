<template>
  <div class="tgmian">
    <div class="cxtop">
      <div @click="reHome">
        <img src="@/img/左箭头.png" style="width: 35px; height: 35px" />
      </div>
      <div>功能</div>
    </div >
    <div class="gnsp"></div>
    <div class="gnm">
      <div class="gnm1">
        <div class="gnright">
          <div class="gnr"></div>
          <div class="gny"></div>
          <div class="gng"></div>
        </div>
        <div class="gntext">
            <div>前方碰撞预警</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data(){
    return{

    };
  },
  methods:{
    reHome(){
      console.log(1)
      this.$emit('reHome')
    }
  },
};
</script>

<style scoped lang="less">
.tgmian {
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  
  .gnsp {
    margin-top: 15px;
    background-color: #000000;
    width: 100%;
    
    height: 380px;
  }
  .gnm {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .gnm1 {

      width: 95%;
      height: 95%;
      display: flex;
      flex-direction: column;
      .gnright {
        background-color: #000000;
        width: 100%;
        height: 100px;
        border-radius: 35px;
        display: flex;
        justify-content: space-evenly;
        align-items: center;

        .gnr {
          background-color: #ff0000;
          width: 80px;
          height: 80px;
          border-radius: 50px;
        }
        .gny {
          background-color: #727270;
          width: 80px;
          height: 80px;
          border-radius: 50px;
        }
        .gng {
          background-color: #727270;
          width: 80px;
          height: 80px;
          border-radius: 50px;
        }
        

      }
      .gntext{
        background-color: #606060;
        width: 100%;
        margin-top: 15px;
        height: 250px;
        border-radius: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #11f609;
        font-size: 35px;
      }
    }
  }
}
.cxtop {
  font-size: 25px;
  color: #e6e6e6;
  background-color: #000000;
  display: flex;
  align-items: center;
  border-radius: 20px 20px 0px 0px;
  div {
    margin: 20px;
  }
}
</style>