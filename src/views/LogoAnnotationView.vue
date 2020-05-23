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
        <div class="ui grid">
          <div class="three wide column" v-for="logo in logos" :key="logo.id">
            <div
              class="ui fluid card ann-logo"
              @click="toggleSelectLogo(logo)"
              :class="`${logo.selected ? 'selected' : ''}`"
            >
              <div class="image">
                <img width="100px" :src="logo.image.url" />
              </div>
              <div class="content">
                <p v-if="logo.distance">Distance: {{ logo.distance }}</p>
                <p
                  v-if="logo.annotation_value"
                >Annotation: {{ logo.annotation_value }} ({{ logo.annotation_type }})</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL, OFF_IMAGE_URL } from "../const";

const transformLogo = logo => {
  const imageUrl = `${OFF_IMAGE_URL}${logo.image.source_image}`;
  const [y_min, x_min, y_max, x_max] = logo.bounding_box;
  logo.image.url = `${ROBOTOFF_API_URL}/images/crop?image_url=${imageUrl}&y_min=${y_min}&x_min=${x_min}&y_max=${y_max}&x_max=${x_max}`;
  logo.selected = false;
  return logo;
};

export default {
  name: "InsightListView",
  components: {},
  data: function() {
    return {
      logos: [],
      noLogoAvailable: false,
      valueInput: "",
      typeInput: ""
    };
  },
  computed: {
    isValidAnnotation: function() {
      if (this.logos.length === 0) return false;
      if (this.typeInput.length === 0) return false;
      if (this.selectedLogos.length === 0) return false;
      if (this.typeInput === "packager_code") return true;
      if (this.valueInput.length === 0) return false;
      return true;
    },
    selectedLogos: function() {
      return this.logos.filter(l => l.selected === true);
    }
  },
  methods: {
    loadLogos: function() {
      axios.get(`${ROBOTOFF_API_URL}/ann/random?count=25`).then(({ data }) => {
        const results = data.results;
        axios
          .all(
            results.map(r =>
              axios(`${ROBOTOFF_API_URL}/images/logos/${r.logo_id}`)
            )
          )
          .then(responses => {
            this.logos = results
              .map((r, i) => ({
                distance: r.distance,
                ...responses[i].data
              }))
              .map(transformLogo);
          });
      });
    },
    toggleSelectLogo: function(logo) {
      if (logo.annotation_value) return;
      logo.selected = !logo.selected;
    },
    sendAnnotations: function() {
      const params = {
        annotations: this.selectedLogos.map(logo => ({
          logo_id: logo.id,
          value: this.valueInput,
          type: this.typeInput
        }))
      };
      axios
        .post(`${ROBOTOFF_API_URL}/images/logos/annotate`, params)
        .then(() => {
          this.loadLogos();
        });
      this.valueInput = "";
      this.typeInput = "";
    }
  },
  mounted() {
    this.loadLogos();
  }
};
</script>

<style scoped>
.ann-logo {
  cursor: pointer;
}

.ann-logo.selected {
  background-color: #4a5971;
  color: #ffffff;
}
</style>