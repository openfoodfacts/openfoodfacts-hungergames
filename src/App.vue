<template>
  <div :dir="dir">
    <Menu />
    <sui-segment attached="bottom">
      <router-view />
    </sui-segment>
  </div>
</template>

<script>
import Menu from "./components/Menu";

export default {
  name: "app",
  components: { Menu },
  data: function() {
    var userLang = navigator.language || navigator.userLanguage;

    return { dir: ["he", "ar"].includes(userLang) ? "rtl" : "ltr" };
  },
};
</script>

<style scoped>
.menu-container {
  margin-bottom: 1rem;
}

.segment {
  border: none !important;
}
</style>
