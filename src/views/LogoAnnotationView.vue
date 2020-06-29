<template>
  <div class="ui container">
    <div>
      <h2>Logo annotations</h2>
      <form class="ui form" v-on:submit.prevent="sendAnnotations">
        <div class="three fields">
          <div class="field">
            <input type="text" name="value" placeholder="Value" v-model.trim="valueInput" />
          </div>
          <div class="field">
            <select class="ui fluid dropdown" v-model="typeInput">
              <option value>Type</option>
              <option value="label">Label</option>
              <option value="brand">Brand</option>
              <option value="packager_code">Packager code</option>
              <option value="packaging">Packaging</option>
              <option value="qr_code">QR code</option>
              <option value="category">Category</option>
              <option value="nutrition_label">Nutrition label</option>
              <option value="store">Store</option>
            </select>
          </div>
          <div class="field">
            <button
              type="submit"
              class="ui button primary"
              tabindex="0"
              :class="{ disabled: !isValidAnnotation }"
            >Submit</button>
          </div>
        </div>
      </form>
      <div class="ui divider hidden" />
      <div v-if="logos">
        <div>
          <p>
            <span @click="selectLogos(true)" class="borderless-button">Select all</span> /
            <span @click="selectLogos(false)" class="borderless-button">Unselect all</span>
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
import axios from "axios";
import { ROBOTOFF_API_URL, OFF_IMAGE_URL } from "../const";
import LogoCardGrid from "../components/LogoCardGrid";
import { getURLParam } from "../utils";

const transformLogo = logo => {
  const imageUrl = `${OFF_IMAGE_URL}${logo.image.source_image}`;
  const [y_min, x_min, y_max, x_max] = logo.bounding_box;
  logo.image.url = `${ROBOTOFF_API_URL}/images/crop?image_url=${imageUrl}&y_min=${y_min}&x_min=${x_min}&y_max=${y_max}&x_max=${x_max}`;
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
      const url =
        this.targetLogoId.length > 0
          ? `${ROBOTOFF_API_URL}/ann/${this.targetLogoId}`
          : `${ROBOTOFF_API_URL}/ann`;

      const params = {
        count: this.annCount
      };

      const index = getURLParam("index");
      if (index.length > 0) params.index = index;

      axios.get(url, { params }).then(({ data }) => {
        const results = data.results;
        axios
          .get(
            `${ROBOTOFF_API_URL}/images/logos?logo_ids=${results
              .map(r => r.logo_id)
              .join(",")}`
          )
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
      const params = {
        annotations: this.selectedLogos.map(logo => ({
          logo_id: logo.id,
          value: value,
          type: this.typeInput
        }))
      };
      axios
        .post(`${ROBOTOFF_API_URL}/images/logos/annotate`, params, {
          withCredentials: true
        })
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