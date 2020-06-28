<template>
  <div class="ui container">
    <div>
      <h2>Search</h2>
      <div class="ui divider hidden" />
      <form class="ui form" v-on:submit.prevent="search">
        <div class="three fields">
          <div class="field">
            <input type="text" name="value" placeholder="Value" v-model.trim="value" />
          </div>
          <div class="field">
            <input type="text" name="barcode" placeholder="Barcode" v-model.trim="barcode" />
          </div>
          <div class="field">
            <select class="ui fluid dropdown" v-model="type">
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
            <input type="number" name="count" v-model.trim="count" />
          </div>
          <div class="field">
            <button type="submit" class="ui button primary">Search</button>
          </div>
        </div>
      </form>
      <div class="ui divider hidden" />
      <div v-if="logos.length">
        <p>Number of results: {{ resultCount }}</p>
        <LogoCardGrid :logos="logos" :selectable="false" />
      </div>
      <div v-else>
        <p>
          <strong>No logo found</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL, OFF_IMAGE_URL } from "../const";
import LogoCardGrid from "../components/LogoCardGrid";

const transformLogo = logo => {
  const imageUrl = `${OFF_IMAGE_URL}${logo.image.source_image}`;
  const [y_min, x_min, y_max, x_max] = logo.bounding_box;
  logo.image.url = `${ROBOTOFF_API_URL}/images/crop?image_url=${imageUrl}&y_min=${y_min}&x_min=${x_min}&y_max=${y_max}&x_max=${x_max}`;
  return logo;
};

export default {
  name: "InsightListView",
  components: { LogoCardGrid },
  data: function() {
    return {
      logos: [],
      value: "",
      barcode: "",
      type: "",
      resultCount: 0,
      count: 25
    };
  },
  computed: {},
  methods: {
    search: function() {
      const url = `${ROBOTOFF_API_URL}/images/logos`;
      const params = {
        count: this.count,
        annotated: 1
      };

      if (this.barcode) {
        params.barcode = this.barcode;
      }

      if (this.value) {
        params.value = this.value;
      }

      if (this.type) {
        params.type = this.type;
      }

      axios.get(url, { params }).then(({ data }) => {
        this.logos = data.logos.map(transformLogo);
        this.resultCount = data.count;
      });
    }
  },
  mounted() {
    this.search();
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