<template>
  <div class="ui stackable grid container">
    <div class="five wide column">
      <h2>{{ $t("settings.settings") }}</h2>
      <form class="ui form" v-on:submit.prevent="saveLang">
        <div class="field">
          <div class="ui action input labeled">
            <div class="ui label">{{ $t("settings.language") }}</div>
            <select v-model="selectedLang" class="ui fluid dropdown">
              <option
                v-for="(lang, i) in langs"
                :key="`Lang${i}`"
                :value="lang"
              >
                {{ lang.toUpperCase() }}
              </option>
            </select>
          </div>
        </div>
        <button class="ui button primary">{{ $t("settings.save") }}</button>
      </form>
    </div>
  </div>
</template>

<script>
import { localSettings } from "../settings";
import messages from "../i18n/messages";

export default {
  name: "SettingsView",
  props: [],

  data: function () {
    return {
      selectedLang: this.$i18n.locale,
      langs: Object.keys(messages),
    };
  },
  
  methods: {
    saveLang: function () {
      this.$i18n.locale = this.selectedLang;
      localSettings.update("lang", this.$i18n.locale);
    },
  },
};
</script>
