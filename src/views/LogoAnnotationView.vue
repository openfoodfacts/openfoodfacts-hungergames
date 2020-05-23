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
              @click="selectLogo(logo)"
              :class="`${page.active ? 'selected' : ''}`"
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
    loadLogo: function() {
      const params = {
        count: 1
      };

      axios.get(`${ROBOTOFF_API_URL}/images/logos`, { params }).then(result => {
        const logos = result.data.logos;

        if (logos.length == 0) {
          this.noLogoAvailable = true;
        } else {
          const logo = logos[0];
          this.logos.push(transformLogo(logo));
          this.loadSimilarLogos(logo.id);
        }
      });
    },
    loadSimilarLogos: function(logoId) {
      axios
        .get(`${ROBOTOFF_API_URL}/ann/${logoId}?count=25`)
        .then(({ data }) => {
          const results = data.results;
          axios
            .all(
              results.map(r =>
                axios(`${ROBOTOFF_API_URL}/images/logos/${r.logo_id}`)
              )
            )
            .then(responses => {
              const logos = results
                .map((r, i) => ({
                  distance: r.distance,
                  ...responses[i].data
                }))
                .map(transformLogo);
              this.logos = this.logos.concat(logos);
            });
        });
    },
    selectLogo: function(logo) {
      logo.selected = true;
    }
  },
  mounted() {
    this.loadLogo();
  }
};
</script>

<style scoped>
.ann-logo {
  cursor: pointer;
}

.ann-logo.selected {
  background-color: blue;
}
</style>