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
            <LoadingSpinner :size="'medium'" :centered="false" :show="loading" />
            <button v-if="!loading" type="submit" class="ui button primary" tabindex="0">{{$t("logos.update")}}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from "../components/LoadingSpinner";
import robotoffService from "../robotoff";
import offService from "../off";
import { IS_DEVELOPMENT_MODE } from "../const.js";

const getImageURL = logo => offService.getImageUrl(logo.image.source_image);

const getCropURL = logo => {
  return robotoffService.getCroppedImageUrl(
    getImageURL(logo), logo.bounding_box
  )
};

export default {
  name: "InsightListView",
  components: {LoadingSpinner},
  data: function() {
    return {
      annotationValue: "",
      annotationType: "",
      imageURL: "",
      cropURL: "",
      barcode: "",
      loading: false
    };
  },
  computed: {
    logoId: function() {
      return this.$route.params.id;
    }
  },
  methods: {
    loadLogo: function() {
      this.loading = true;
      robotoffService
        .loadLogo(this.logoId)
        .then(({ data }) => {
          this.imageURL = getImageURL(data);
          this.cropURL = getCropURL(data);
          this.annotationValue = data.annotation_value;
          this.annotationType = data.annotation_type;
          this.barcode = data.image.barcode;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        })
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
      this.loading = true;
      if(IS_DEVELOPMENT_MODE){
        console.log(`Updated`)
        this.loading = false;
      } else {
        robotoffService
        .updateLogo(this.logoId, value, this.annotationType)
        .then(() => {
          this.loading = false;
          window.console.log("Updated!");
        })
        .catch(() => {
          this.loading = false;
        })
      }
    }
  },
  mounted() {
    this.loadLogo();
  }
};
</script>
