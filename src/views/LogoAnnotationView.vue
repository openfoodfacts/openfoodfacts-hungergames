<template>
  <div class="ui container">
    <div>
      <h2>{{$t("logos.annotations")}}</h2>
      <form class="ui form" v-on:submit.prevent="sendAnnotations">
        <div class="three fields">
          <div class="field">
            <input type="text" name="value" :placeholder="$t('logos.value')" v-model.trim="valueInput" />
          </div>
          <div class="field">
            <select class="ui fluid dropdown" v-model="typeInput">
              <option value>{{$t("logos.type")}}</option>
              <option value="label">{{$t("logos.label")}}</option>
              <option value="brand">{{$t("logos.brand")}}</option>
              <option value="packager_code">{{$t("logos.packager_code")}}</option>
              <option value="packaging">{{$t("logos.packaging")}}</option>
              <option value="qr_code">{{$t("logos.qr_code")}}</option>
              <option value="category">{{$t("logos.category")}}</option>
              <option value="nutrition_label">{{$t("logos.nutrition_label")}}</option>
              <option value="store">{{$t("logos.store")}}</option>
            </select>
          </div>
          <div class="field">
            <button
              type="submit"
              class="ui button primary"
              tabindex="0"
              :class="{ disabled: !isValidAnnotation }"
            >{{$t("logos.submit")}}</button>
          </div>
        </div>
      </form>
      <div class="ui divider hidden" />
      <div v-if="logos">
        <div>
          <p>
            <span @click="selectLogos(true)" class="borderless-button">{{$t("logos.select_all")}}</span> /
            <span @click="selectLogos(false)" class="borderless-button">{{$t("logos.unselect_all")}}</span>
          </p>
        </div>
        <div class="ui divider hidden" />
        <LogoCardGrid
          v-if="selectedLogos.length > 0"
          :logos="selectedLogos"
          v-on:toggle-select-logo="toggleSelectLogo"
        />
        <LogoCardGrid
          :logos="unselectedLogos"
          v-on:toggle-select-logo="toggleSelectLogo"
          v-if="unselectedLogos.length > 0"
        />
      </div>
    </div>
  </div>
</template>

<script>
import robotoffService from "../robotoff";
import { OFF_IMAGE_URL } from "../const";
import LogoCardGrid from "../components/LogoCardGrid";
import { getURLParam } from "../utils";

const transformLogo = logo => {
  logo.image.url = robotoffService.getCroppedImageUrl(
    `${OFF_IMAGE_URL}${logo.image.source_image}`, logo.bounding_box
  )
  logo.selected = false;
  return logo;
};

const getAnnCount = defaultValue => {
  const count = getURLParam("count");
  if (count.length == 0) return defaultValue;
  return parseInt(count, 10) || defaultValue;
};

export default {
  name: "InsightListView",
  components: { LogoCardGrid },
  data: function() {
    return {
      logos: [],
      noLogoAvailable: false,
      valueInput: "",
      typeInput: "",
      targetLogoId: getURLParam("logo_id"),
      annCount: getAnnCount(100)
    };
  },
  computed: {
    isValidAnnotation: function() {
      if (this.logos.length === 0) return false;
      if (this.typeInput.length === 0) return false;
      if (this.selectedLogos.length === 0) return false;
      if (
        this.valueInput.length === 0 &&
        ["label", "brand", "category", "store"].includes(this.typeInput)
      )
        return false;
      return true;
    },
    selectedLogos: function() {
      return this.logos.filter(l => l.selected === true);
    },
    unselectedLogos: function() {
      return this.logos.filter(l => l.selected === false);
    }
  },
  methods: {
    loadLogos: function() {
      robotoffService
        .getLogoAnnotations(this.targetLogoId, getURLParam("index"), this.annCount)
        .then(({ data }) => {
          const results = data.results;
          robotoffService
            .getLogosImages(results.map(r => r.logo_id))
            .then(response => {
              const logoData = response.data.logos;
              this.logos = results
                .map(r => ({
                  distance: r.distance,
                  ...logoData.filter(l => l.id == r.logo_id)[0]
                }))
                .map(transformLogo);
            });
        });
    },
    toggleSelectLogo: function(logo) {
      const logoId = logo.id;
      const l = this.logos.filter(logo => logo.id === logoId)[0];
      l.selected = !l.selected;
    },
    sendAnnotations: function() {
      let value = this.valueInput.toLowerCase();

      if (this.typeInput === "packager_code" || this.typeInput === "qr_code") {
        value = "";
      }
      const annotations = this.selectedLogos.map(logo => ({
        logo_id: logo.id,
        value: value,
        type: this.typeInput
      }))
      robotoffService
        .annotateLogos(annotations)
        .then(() => {
          this.targetLogoId = "";
          this.loadLogos();
        });
      this.valueInput = "";
      this.typeInput = "";
    },
    selectLogos: function(select) {
      this.logos.forEach(logo => {
        if (logo.annotation_value) return;
        logo.selected = select;
      });
    }
  },
  mounted() {
    this.loadLogos();
  }
};
</script>

<style scoped>
.borderless-button {
  color: #2185d0;
  cursor: pointer;
}

.borderless-button:hover {
  text-decoration: underline;
}
</style>
