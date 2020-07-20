<template>
  <div class="ui container">
    <div>
      <h2>{{$t("logos.detail")}}</h2>
      <p>{{$t("logos.id")}} {{ logoId }}</p>
      <p>{{$t("logos.barcode")}} {{ barcode }}</p>
      <p>
        <a :href="imageURL">{{$t("logos.full_image")}}</a>
      </p>
      <img width="300px" :src="cropURL" />
      <div class="ui divider" />
      <form class="ui form" v-on:submit.prevent="updateLogo">
        <div class="three fields">
          <div class="field">
            <input type="text" name="value" :placeholder="$t('logos.value')" v-model.trim="annotationValue" />
          </div>
          <div class="field">
            <select class="ui fluid dropdown" v-model="annotationType">
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
            <button type="submit" class="ui button primary" tabindex="0">{{$t("logos.update")}}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL, OFF_IMAGE_URL } from "../const";

const getImageURL = logo => `${OFF_IMAGE_URL}${logo.image.source_image}`;

const getCropURL = logo => {
  const imageUrl = getImageURL(logo);
  const [y_min, x_min, y_max, x_max] = logo.bounding_box;
  return `${ROBOTOFF_API_URL}/images/crop?image_url=${imageUrl}&y_min=${y_min}&x_min=${x_min}&y_max=${y_max}&x_max=${x_max}`;
};

export default {
  name: "InsightListView",
  components: {},
  data: function() {
    return {
      annotationValue: "",
      annotationType: "",
      imageURL: "",
      cropURL: "",
      barcode: ""
    };
  },
  computed: {
    logoId: function() {
      return this.$route.params.id;
    }
  },
  methods: {
    loadLogo: function() {
      axios
        .get(`${ROBOTOFF_API_URL}/images/logos/${this.logoId}`)
        .then(({ data }) => {
          this.imageURL = getImageURL(data);
          this.cropURL = getCropURL(data);
          this.annotationValue = data.annotation_value;
          this.annotationType = data.annotation_type;
          this.barcode = data.image.barcode;
        });
    },
    updateLogo: function() {
      if (this.annotationType.length == 0) return;

      let value = this.annotationValue.toLowerCase();
      if (
        this.annotationType === "packager_code" ||
        this.annotationType === "qr_code"
      ) {
        value = "";
      }
      const params = {
        value: value,
        type: this.annotationType
      };
      axios
        .put(`${ROBOTOFF_API_URL}/images/logos/${this.logoId}`, params, {
          withCredentials: true
        })
        .then(() => {
          window.console.log("Updated!");
        });
    }
  },
  mounted() {
    this.loadLogo();
  }
};
</script>
