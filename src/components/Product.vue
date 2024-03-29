<template>
  <div v-if="loaded" class="product-card">
    <h3>{{ productName }}</h3>

    <a target="_blank" :href="productUrl" class="ui button primary">{{
      $t("questions.view")
    }}</a>

    <a target="_blank" :href="productEditUrl" class="ui button">{{
      $t("questions.edit")
    }}</a>

    <div class="ui divider"></div>

    <div v-if="imagesPreview.length > 0">
      <div class="ui basic segment">
        <sui-checkbox v-model="hideImage">
          {{ $t("questions.hide_images") }}
        </sui-checkbox>
      </div>

      <viewer
        :images="imagesPreview"
        :options="imageZoomOptions"
        v-if="!hideImage"
      >
        <img
          :src="url"
          v-for="url in imagesPreview"
          :key="url"
          loading="lazy"
          style="max-height: 200px; max-width: 200px; margin-right: 3px"
        />
      </viewer>
      <div class="ui divider"></div>
    </div>
    <p v-if="brands">
      <strong>{{ $t("questions.brands") }} :</strong>
      {{ brands }}
    </p>
    <p v-if="ingredientsText">
      <strong>{{ $t("questions.ingredients") }}:</strong>
      {{ ingredientsText }}
    </p>
    <p v-if="countries">
      <strong>{{ $t("questions.countries") }}:</strong>
      {{ countries }}
    </p>
  </div>
</template>

<script>
import { localSettings } from "../settings";
import { countryMap } from "../countries";
import offService from "../off";

const BARCODE_REGEX = /(...)(...)(...)(.*)$/;
const splitBarcode = (barcode) => {
  const match = BARCODE_REGEX.exec(barcode);

  if (match !== null) {
    match.shift();
    return match;
  }

  return [barcode];
};

const getImageRootURL = (barcode) => {
  const splittedBarcode = splitBarcode(barcode);

  if (splittedBarcode === null) {
    return null;
  }
  return offService.getImageUrl(splittedBarcode.join("/"));
};

export default {
  name: "Product",
  props: ["barcode"],

  data: function () {
    return {
      hideImage: localSettings.fetch()["hideImage"] || false,

      productName: "",
      brands: "",
      ingredientsText: "",
      countriesTags: [],
      images: {},
      loaded: false,
      imageZoomOptions: {
        toolbar: {
          rotateLeft: 1,
          rotateRight: 1,
        },
      },
    };
  },

  watch: {
    barcode: function (value) {
      if (value) {
        this.update();
      } else {
        this.productName = "";
        this.brands = "";
        this.ingredientsText = "";
        this.countriesTags = [];
        this.images = {};
        this.loaded = false;
      }
    },

    hideImage: function (value) {
      localSettings.update("hideImage", value);
    },
  },
  methods: {
    update: function () {
      offService.getProduct(this.barcode).then((result) => {
        const product = result.data.product;
        this.productName = product.product_name || "";
        this.brands = product.brands || "";
        this.ingredientsText = product.ingredients_text || "";
        this.countriesTags = product.countries_tags || [];
        this.images = product.images || {};
        this.loaded = true;
      });
    },
  },
  computed: {
    productUrl: function () {
      if (this.barcode === null) {
        return "";
      }
      return offService.getProductUrl(this.barcode);
    },
    productEditUrl: function () {
      if (this.barcode === null) {
        return "";
      }
      return offService.getProductEditUrl(this.barcode);
    },
    countries: function () {
      return this.countriesTags.map((c) => countryMap[c]).join(", ");
    },
    imagesPreview: function () {
      const imagesDisplayUrl = [];
      for (const key of Object.keys(this.images)) {
        if (!isNaN(key)) {
          const imageUrl = `${getImageRootURL(this.barcode)}/${key}.jpg`;
          imagesDisplayUrl.push(imageUrl);
        }
      }
      return imagesDisplayUrl;
    },
  },
  mounted() {
    if (this.barcode) {
      this.update();
    }
  },
};
</script>

<style scoped>
@media only screen and (max-width: 767px) {
  .product-card {
    text-align: center;
  }
}

.product-image {
  max-width: 250px;
  max-height: 250px;
  margin: 0 3px;
}
</style>
