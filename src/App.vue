<template>
  <div>
    <div class="menu-container">
      <sui-menu class="large" attached="top">
        <sui-dropdown item icon="bars" simple>
          <sui-dropdown-menu>
            <sui-dropdown-header>Games</sui-dropdown-header>
            <router-link class="item" to="/questions">Questions</router-link>
            <router-link class="item" to="/logos">Logos</router-link>
            <router-link class="item" to="/nutritions">Nutritions</router-link>

            <sui-dropdown-divider />
            <sui-dropdown-header>Manage</sui-dropdown-header>

            <router-link class="item" to="/insights">Insights</router-link>
            <router-link class="item" to="/settings">Settings</router-link>
          </sui-dropdown-menu>
        </sui-dropdown>
      </sui-menu>
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

<style scoped>
.menu-container {
  margin-bottom: 1rem;
}
</style>
