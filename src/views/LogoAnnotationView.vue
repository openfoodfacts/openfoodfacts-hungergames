<template>
  <div class="ui container">
    <div>
      <h2>Logo annotations</h2>

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
      noLogoAvailable: false
    };
  },
  computed: {},
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
      logo.selected = !logo.selected;
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