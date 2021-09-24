<template>
  <div>
    <Menu />
    <Login />
    <sui-segment attached="bottom">
      <router-view />
    </sui-segment>
  </div>
</template>

<script>
import Menu from "./components/Menu";
import Login from "./components/Login";

export default {
  name: "app",
  components: { Menu, Login },
  data: function() {
    return {};
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
