<template>
  <div>
    <div class="ui container">
      <h2>{{$t('label.settings')}}</h2>
      <div class="ui action input labeled">
        <div class="ui label">{{$t('label.language')}}</div>
        <select v-model="$i18n.locale">
          <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">{{ lang }}</option>
        </select>
        <!-- <input placeholder="Language" v-model="lang" /> -->
        <button class="ui button primary" @click="saveLang">{{$t('label.save')}}</button>
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
    return { langs: ['en', 'it'] }
    // const settings = localSettings.fetch();
    // return {
    //   lang: settings.lang || "en"
    // };
  },
  methods: {
    saveLang: function() {
      localSettings.update("lang", this.$i18n.locale);
    }
  }
};
</script>
