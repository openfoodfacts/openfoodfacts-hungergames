<template>
  <div class="ui container">
    <div>
      <h2>{{$t("logos.search")}}</h2>
      <div class="ui divider hidden" />
      <form class="ui form" v-on:submit.prevent="search">
        <div class="three fields">
          <div class="field">
            <input type="text" name="value" :placeholder="$t('logos.value')" v-model.trim="value" />
          </div>
          <div class="field">
            <input type="text" name="barcode" :placeholder="$t('logos.barcode')" v-model.trim="barcode" />
          </div>
          <div class="field">
            <select class="ui fluid dropdown" v-model="type">
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
            <input type="number" name="count" v-model.trim="count" />
          </div>
          <div class="field">
            <button type="submit" class="ui button primary">{{$t("logos.search")}}</button>
          </div>
        </div>
      </form>
      <div class="ui divider hidden" />
      <div v-if="logos.length">
        <p>{{$t("logos.number_of_results")}} {{ resultCount }}</p>
        <LogoCardGrid :logos="logos" :selectable="false" />
      </div>
      <div v-else>
        <p>
          <strong>{{$t("logos.no_found")}}</strong>
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
