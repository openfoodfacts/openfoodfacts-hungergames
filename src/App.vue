<template>
  <div>
    <div class="menu-container">
      <sui-menu class="large" attached="top">
        <sui-dropdown item icon="bars" simple>
          <sui-dropdown-menu>
            <sui-dropdown-header>{{$t('menu.games')}}</sui-dropdown-header>
            <router-link class="item" to="/questions">{{$t('menu.questions')}}</router-link>
            <router-link class="item" to="/logos">{{$t('menu.logos')}}</router-link>

            <sui-dropdown-divider />
            <sui-dropdown-header>{{$t('menu.manage')}}</sui-dropdown-header>

            <router-link class="item" to="/insights">{{$t('menu.insights')}}</router-link>
            <router-link class="item" to="/settings">{{$t('menu.settings')}}</router-link>
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
