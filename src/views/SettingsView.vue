<template>
  <div>
    <div class="ui container">
      <h2>{{$t('settings.settings')}}</h2>
      <div class="ui action input labeled">
        <div class="ui label">{{$t('settings.language')}}</div>
        <select v-model="selectedLang">
          <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">{{ lang }}</option>
        </select>
        <button class="ui button primary" @click="saveLang">{{$t('settings.save')}}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { localSettings } from "../settings";
import messages from '../i18n/messages'

export default {
  name: "SettingsView",
  props: [],
  data: function() {
    return {
      selectedLang: this.$i18n.locale,
      langs: Object.keys(messages)
    }
  },
  methods: {
    saveLang: function() {
      this.$i18n.locale = this.selectedLang;
      localSettings.update("lang", this.$i18n.locale);
    }
  }
};
</script>
