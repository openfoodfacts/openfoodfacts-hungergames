<template>
  <div id="app">
    <div class="ui secondary pointing menu">
      <router-link class="item" to="/questions">Questions</router-link>
      <router-link class="item" to="/insights">Insights</router-link>
      <router-link class="item" to="/settings">Settings</router-link>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: "app",
  data: function() {
    return {};
  }
};
</script>
