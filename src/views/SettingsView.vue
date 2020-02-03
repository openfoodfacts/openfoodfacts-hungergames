<template>
  <div>
    <div class="ui container">
      <h2>Settings</h2>
      <div class="ui action input labeled">
        <div class="ui label">Language</div>
        <input placeholder="Language" v-model="lang" />
        <button class="ui button primary" @click="saveLang">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { localSettings } from "../settings";

export default {
  name: "SettingsView",
  props: [],
  data: function() {
    const settings = localSettings.fetch();
    return {
      lang: settings.lang || "en"
    };
  },
  methods: {
    saveLang: function() {
      localSettings.update("lang", this.lang);
    }
  }
};
</script>
