<template>
  <div v-if="loaded">
    <h3>{{ productName }}</h3>
    <a target="_blank" :href="productUrl" class="ui button primary">{{$t('questions.view')}}</a>
    <a target="_blank" :href="productEditUrl" class="ui button">{{$t('questions.edit')}}</a>
    <div class="ui divider"></div>

    <div v-if="imagesPreview.length > 0">
      <div class="ui basic segment">
        <span @click="toggleLoadImage" class="borderless-button">{{ loadImageButtonText }}</span>
      </div>
      <viewer :images="imagesPreview" :options="imageZoomOptions" v-if="loadImage">
        <img
          :src="url"
          v-for="url in imagesPreview"
          :key="url"
          loading="lazy"
          style="max-height: 200px; max-width: 200px; margin-right: 3px;"
        />
      </viewer>
      <div class="ui divider"></div>
    </div>
    <p v-if="brands">
      <strong>{{$t('questions.brands')}} :</strong>
      {{ brands }}
    </p>
    <p v-if="ingredientsText">
      <strong>{{$t('questions.ingredients')}}:</strong>
      {{ ingredientsText }}
    </p>
    <p v-if="countries">
      <strong>{{$t('questions.countries')}}:</strong>
      {{ countries }}
    </p>
  </div>
</template>

<script>
import axios from "axios";
import { OFF_API_URL, OFF_IMAGE_URL } from "../const";
import { countryMap } from "../countries";
import { getProductUrl, getProductEditUrl } from "../off";

const BARCODE_REGEX = /(...)(...)(...)(.*)$/;
const splitBarcode = barcode => {
  const match = BARCODE_REGEX.exec(barcode);

  if (match !== null) {
    match.shift();
    return match;
  }

  return [barcode];
};

const getImageRootURL = barcode => {
  const splittedBarcode = splitBarcode(barcode);

  if (splittedBarcode === null) {
    return null;
  }
  return `${OFF_IMAGE_URL}/${splittedBarcode.join("/")}`;
};

export default {
  name: "Product",
  props: ["barcode"],
  data: function() {
    return {
      productName: "",
      brands: "",
      ingredientsText: "",
      countriesTags: [],
      images: {},
      loaded: false,
      loadImage: true,
      imageZoomOptions: {
        toolbar: {
          rotateLeft: 1,
          rotateRight: 1
        }
      }
    };
  },
  watch: {
    barcode: function(value) {
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
    }
  },
  methods: {
    update: function() {
      axios
        .get(
          `${OFF_API_URL}/product/${this.barcode}.json?fields=product_name,brands,ingredients_text,countries_tags,images`
        )
        .then(result => {
          const product = result.data.product;
          this.productName = product.product_name || "";
          this.brands = product.brands || "";
          this.ingredientsText = product.ingredients_text || "";
          this.countriesTags = product.countries_tags || [];
          this.images = product.images || {};
          this.loaded = true;
        });
    },
    toggleLoadImage: function() {
      this.loadImage = !this.loadImage;
    }
  },
  computed: {
    loadImageButtonText: function() {
      if (this.loadImage) return this.$t("questions.hide_images");
      else return this.$t("questions.display_images");
    },
    productUrl: function() {
      if (this.barcode === null) {
        return "";
      }
      return getProductUrl(this.barcode);
    },
    productEditUrl: function() {
      if (this.barcode === null) {
        return "";
      }
      return getProductEditUrl(this.barcode);
    },
    countries: function() {
      return this.countriesTags.map(c => countryMap[c]).join(", ");
    },
    imagesPreview: function() {
      const imagesDisplayUrl = [];
      for (const key of Object.keys(this.images)) {
        if (!isNaN(key)) {
          const imageUrl = `${getImageRootURL(this.barcode)}/${key}.jpg`;
          imagesDisplayUrl.push(imageUrl);
        }
      }
      return imagesDisplayUrl;
    }
  },
  mounted() {
    if (this.barcode) {
      this.update();
    }
  }
};
</script>

<style scoped>
.product-image {
  max-width: 250px;
  max-height: 250px;
  margin: 0 3px;
}

.borderless-button {
  color: #2185d0;
  cursor: pointer;
}

.borderless-button:hover {
  text-decoration: underline;
}
</style>
