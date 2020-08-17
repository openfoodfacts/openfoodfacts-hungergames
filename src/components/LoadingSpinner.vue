<template>
  <div class="loading-spinner" v-if="show">
    <div class="loading-spinner-content">
      <div></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoadingSpinner",
  props: {
    show: {
      type: Boolean,
      required: true
    }
  }
};
</script>

<style scoped>
@keyframes loading-spinner-content {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-spinner-content div {
  position: absolute;
  animation: loading-spinner-content 1s linear infinite;
  width: 80px;
  height: 80px;
  top: 10px;
  left: 10px;
  border-radius: 50%;
  box-shadow: 0 4px 0 0 #1d3f72;
  transform-origin: 40px 41px;
}
.loading-spinner {
  width: 100px;
  height: 100px;
  display: inline-block;
  overflow: hidden;
  background: #fff;
}
.loading-spinner-content {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
}
.loading-spinner-content div {
  box-sizing: content-box;
}
</style>
