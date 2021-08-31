<template>
  <sui-menu attached="top">
    <sui-dropdown item icon="bars" simple class="mobile only">
      <sui-dropdown-menu>
        <template v-for="item in menu">
          <sui-dropdown-header v-if="!item.to" :key="item.label">
            {{ item.label }}
          </sui-dropdown-header>
          <sui-dropdown-divider v-if="!item.label" :key="item.label" />
          <router-link
            active-class="active"
            class="item"
            :to="item.to"
            :key="item.label"
            v-if="item.to"
          >
            {{ item.label }}
          </router-link>
        </template>
      </sui-dropdown-menu>
    </sui-dropdown>

    <sui-menu-item class="item mobile hidden">
      <img src="~/../assets/logo.png" />
    </sui-menu-item>

    <router-link
      v-for="item in menuItems"
      active-class="active"
      class="item mobile hidden"
      :to="item.to"
      :key="item.to"
    >
      {{ item.label }}
    </router-link>

    <sui-menu-menu position="right">
      <sui-menu-item v-on:click="openHelper" class="helpButton">
        <sui-icon name="help" />
      </sui-menu-item>
    </sui-menu-menu>
    <Helper :open="helperIsOpen" v-on:close-helper="closeHelper" />
  </sui-menu>
</template>

<script>
import { localSettings } from "../settings";
import Helper from "./Helper";

const intialSettings = localSettings.fetch();
localSettings.update("tuto-done", true);

export default {
  data: function () {
    return {
      menu: [
        { label: this.$t("menu.games") },
        { label: this.$t("menu.questions"), to: "/questions" },
        { label: this.$t("menu.logos"), to: "/logos" },
        // {label: this.$t('menu.nutritions'), to:'/nutritions'},
        {},
        { label: this.$t("menu.manage"), type: "header" },
        { label: this.$t("menu.insights"), to: "/insights" },
        { label: this.$t("menu.settings"), to: "/settings" },
      ],
      helperIsOpen: !intialSettings["tuto-done"],
    };
  },
  components: { Helper },
  computed: {
    menuItems: function () {
      return this.menu.filter((item) => {
        return item.to;
      });
    },
  },
  methods: {
    closeHelper: function () {
      this.helperIsOpen = false;
    },
    openHelper: function () {
      this.helperIsOpen = true;
    },
  },
};
</script>

<style scoped>
.menu-container {
  margin-bottom: 1rem;
}
.helpButton:hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
