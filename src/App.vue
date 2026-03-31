<template>

  <Text></Text>
  <!-- <TMTalk></TMTalk> -->
   <!-- <yuHx></yuHx> -->
   <!-- <teamMain></teamMain> -->
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Text from './components/text.vue'
import WM from './components/waimai/wMain.vue'
import S from './components/ces/r.vue'
import voivTalk from './components/TeamTalk/voivTalk.vue'
import yuHx from './components/TeamTalk/yuHx.vue'
import fireMain from './components/fire/fireMain.vue'
import TMTalk from './components/TeamTalk/TMTalk.vue'
import teamMain from './components/TeamTalk/teamMain.vue'
export default {
  name: 'App',
  components: {
    HelloWorld,
    Text,
    WM,
    S,
    voivTalk,
    yuHx,
    fireMain,
    TMTalk,
    teamMain,
  }
  
}
</script>

<style scoped>

</style>
