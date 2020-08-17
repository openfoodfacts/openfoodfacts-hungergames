<template>
  <div :class="{centered: centered}">
    <div class="ui active inline loader" v-if="show" :class="[size]"></div>
  </div>
</template>

<script>
export default {
  name: "LoadingSpinner",
  props: {
    show: {
      type: Boolean,
      required: true
    },
    centered: {
      type: Boolean,
      required: false,
      default: true
    },
    size: {
      type: String,
      required: false,
      default: 'huge'
    }
  }
};
</script>

<style scoped>
.centered {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
