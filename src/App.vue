<template>
  <div>
    <div class="menu-container">
      <sui-menu class="large" attached="top">
        <sui-dropdown item icon="bars" simple>
          <sui-dropdown-menu>
            <sui-dropdown-header>Games</sui-dropdown-header>
            <router-link class="item" to="/questions">Questions</router-link>
            <router-link class="item" to="/logos">Logos</router-link>

            <sui-dropdown-divider />
            <sui-dropdown-header>Personalize</sui-dropdown-header>

            <router-link class="item" to="/insights">Insights</router-link>
            <router-link class="item" to="/settings">Settings</router-link>
          </sui-dropdown-menu>
        </sui-dropdown>

        <sui-menu-menu position="right">
          <router-link class="item" to="/settings">
            <sui-icon name="cog" />
          </router-link>
        </sui-menu-menu>
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
