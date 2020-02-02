<template>
  <div v-if="loaded">
    <h3>{{ productName }}</h3>
    <a target="_blank" :href="productUrl" class="ui button primary">View</a>
    <a target="_blank" :href="productEditUrl" class="ui button">Edit</a>
    <div class="ui divider"></div>

    <div v-if="imagesPreview.length > 0">
      <viewer :images="imagesPreview" :options="imageZoomOptions">
        <img
          :src="url"
          v-for="url in imagesPreview"
          :key="url"
          style="max-height: 200px; max-width: 200px; margin-right: 3px;"
        />
      </viewer>
      <div class="ui divider"></div>
    </div>
    <p v-if="brands">
      <strong>Brands :</strong>
      {{ brands }}
    </p>
    <p v-if="ingredientsText">
      <strong>Ingredients:</strong>
      {{ ingredientsText }}
    </p>
    <p v-if="countries">
      <strong>Countries:</strong>
      {{ countries }}
    </p>
  </div>
</template>

<script>
import axios from "axios";
import { OFF_API_URL, OFF_IMAGE_URL } from "../const";
import { countryMap } from "../countries";
import subDomain from "../subdomain";

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
    }
  },
  computed: {
    productUrl: function() {
      if (this.barcode === null) {
        return "";
      }
      return `https://${subDomain.subDomain}.openfoodfacts.org/product/${this.barcode}`;
    },
    productEditUrl: function() {
      if (this.barcode === null) {
        return "";
      }
      return `https://${subDomain.subDomain}.openfoodfacts.org/cgi/product.pl?type=edit&code=${this.barcode}`;
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
</style>