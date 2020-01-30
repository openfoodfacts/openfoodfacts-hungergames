<template>
  <div id="app">
    <div class="ui secondary pointing menu">
      <router-link class="item" to="/questions">Questions</router-link>
      <router-link class="item" to="/ingredients">Ingredients</router-link>
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
