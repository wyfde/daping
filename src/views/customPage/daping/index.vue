<template>
  <div class="custom-page" style="position: relative;">
    <h1>自定义页面</h1>
    <p>这是一个自定义的 darkVue 页面。</p>
    <!-- 修复后的全屏按钮，使用原生 CSS 定位 -->
    <button 
      @click="openFullscreen" 
      style="position: absolute; top: 20px; right: 20px; background: none; border: 0; cursor: pointer;"
    >
      <!-- 确保 SVG 路径正确，建议使用绝对路径或正确的别名 -->
      <img 
        src="@/assets/images/quanping.png" 
        alt="全屏" 
        style="width: 24px; height: 24px;" 
      />
    </button>
  </div>
</template>

<script>
export default {
  name: "CustomPage",
  methods: {
    openFullscreen() {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  }
}
</script>

<style scoped>
.custom-page {
  padding: 20px;
  /* 确保父容器有足够高度，避免按钮超出视口 */
  min-height: 100vh; 
}
</style>    