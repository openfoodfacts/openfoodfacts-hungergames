<template>
  <div class="container">
    <div class="center">
      <!--four wide column centered-->
      <div v-if="bufferIsEmpty">
        <p v-if="loading">Loading ...</p>
        <p v-else>No remaining images</p>
      </div>
      <template v-else>
        <h3>{{ productName }}</h3>
        <div>
          <a target="_blank" :href="productUrl" class="ui button primary">{{
            $t("questions.view")
          }}</a>
          <a target="_blank" :href="productEditUrl" class="ui button">{{
            $t("questions.edit")
          }}</a>
        </div>
        <div class="ui divider"></div>
        <!-- ask to crop the table -->
        <cropper
          class="imageDisplay"
          :src="selectedPictureURL"
          @change="changeCropCoordinate"
          :canvas="false"
          :checkOrientation="false"
          :crossOrigine="false"
          defaultBoundaries="fit"
        />
      </template>
    </div>
    <div class="questionGrid questionContainer">
      <button class="ui button red annotate" @click="openImageSelector()">
        {{ $t("nutrition.other") }}
      </button>
      <button class="ui button annotate" @click="skipProduct()">
        {{ $t("nutrition.skip") }}
      </button>
      <button class="ui button green annotate" @click="validateText()">
        {{ $t("nutrition.validateIsText") }}
      </button>
      <button class="ui button green annotate" @click="validateTable()">
        {{ $t("nutrition.validateIsATable") }}
      </button>
    </div>

    <!-- The model to select an other image -->
    <sui-modal v-model="openSelectPicture" :closable="false">
      <sui-modal-header>
        {{ $t("nutrition.instruction_select") }}
      </sui-modal-header>
      <div class="selectPictures" v-if="openSelectPicture">
        <img
          v-for="imageUrl in productImages"
          :key="imageUrl.key"
          :class="{ selected: imageUrl.key === selectedPicture }"
          :src="imageUrl.small"
          v-on:click="() => toggleSelectedPicture(imageUrl.key)"
        />
      </div>
      <sui-modal-actions>
        <sui-button negative @click.native="quitWithoutImage">
          {{ $t("nutrition.notAvailableImage") }}
        </sui-button>
        <sui-button
          :disabled="!selectedPicture"
          positive
          @click.native="validateImage"
        >
          {{ $t("nutrition.validate") }}
        </sui-button>
      </sui-modal-actions>
    </sui-modal>
  </div>
</template>

<script>
import axios from "axios";
// import { OFF_URL } from "../const";
import offService from "../off";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const getProducts = async (nbOfPages) => {
  const randomPage = 1 + Math.floor(Math.random() * nbOfPages);
  const {
    data: { products },
  } = await axios(offService.getNutritionToFillUrl(randomPage));
  return products;
};

export default {
  name: "NutritionView",
  components: {
    Cropper,
  },
  data: function() {
    return {
      valueTagInput: "",
      loading: false,
      productBuffer: [],
      openSelectPicture: false,
      selectedPicture: false,
      cropperData: { x0: 0, y0: 0, x1: 0, y1: 0 },
      seenProducts: [],
    };
  },
  computed: {
    productCode: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].code === null
      ) {
        return "";
      }
      return this.productBuffer[0].code;
    },
    productName: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].product_name === null
      ) {
        return "";
      }
      return this.productBuffer[0].product_name;
    },
    productLang: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].lang === null
      ) {
        return "";
      }
      return this.productBuffer[0].lang;
    },
    productUrl: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].code === null
      ) {
        return "";
      }
      return offService.getProductUrl(this.productBuffer[0].code);
    },
    productEditUrl: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].code === null
      ) {
        return "";
      }
      return offService.getProductEditUrl(this.productBuffer[0].code);
    },
    productImages: function() {
      if (
        !this.productBuffer[0] ||
        !this.productBuffer[0].image_nutrition_url
      ) {
        return [];
      }
      const imageUrl = this.productBuffer[0].image_nutrition_url.split(
        "nutrition"
      )[0];
      return Object.keys(this.productBuffer[0].images)
        .filter((increment) => !isNaN(increment))
        .map((increment) => ({
          key: increment,
          small: `${imageUrl}${increment}.400.jpg`,
          full: `${imageUrl}${increment}.jpg`,
        }));
    },
    selectedPictureSuffix: function() {
      if (
        this.productBuffer[0] &&
        this.productBuffer[0].image_nutrition_url &&
        this.productBuffer[0].lang
      ) {
        const imgId = this.productBuffer[0].images[
          `nutrition_${this.productBuffer[0].lang}`
        ].imgid;

        const imageUrl = this.productBuffer[0].image_nutrition_url
          .split("nutrition")[0]
          .split("products")[1];
        return `${imageUrl}${this.selectedPicture || imgId}.jpg`;
      }
      return "";
    },
    selectedPictureURL: function() {
      if (this.productBuffer[0] && this.productBuffer[0].lang) {
        console.log(this.productBuffer[0]);
        console.log(this.productBuffer[0].lang);

        const imgId = this.productBuffer[0].images[
          `nutrition_${this.productBuffer[0].lang}`
        ].imgid;

        const imageUrl = this.productBuffer[0].image_nutrition_url.split(
          "nutrition"
        )[0];
        return `${imageUrl}${this.selectedPicture || imgId}.jpg`;
      }
      return "";
    },
    bufferIsEmpty: function() {
      return this.productBuffer.length === 0;
    },
  },
  methods: {
    toggleSelectedPicture: function(id) {
      if (this.selectedPicture === id) {
        this.selectedPicture = null;
      } else {
        this.selectedPicture = id;
      }
    },
    quitWithoutImage() {
      this.selectedPicture = null;
      this.openSelectPicture = false;
    },
    validateImage() {
      // axios.post(
      //   `${OFF_URL}/cgi/product_image_crop.pl?`,
      //   new URLSearchParams(
      //     `code=${this.productBuffer[0].code}&id=${this.selectedPicture}&id=nutrition_${this.productBuffer[0].lang}`
      //   )
      // );
      this.openSelectPicture = false;
    },
    addProducts: async function() {
      this.loading = true;
      const newProducts = await getProducts(300);
      this.productBuffer = this.productBuffer.concat(
        newProducts.filter((prod) => !this.seenProducts.includes(prod.code))
      );
      this.loading = false;
    },
    fetchSeenProducts: async function() {
      const {
        data: { seen: seenProducts },
      } = await axios("https://amathjourney.com/api/off/seen/");
      this.seenProducts = [...this.seenProducts, ...seenProducts];
    },
    skipProduct() {
      const data = this.productBuffer.shift();
      this.seenProducts = [...this.seenProducts, data.code];
    },
    openImageSelector() {
      // const imageUrl = this.productBuffer[0]["image_nutrition_url"];
      // const imageId = imageUrl
      //   .split("/")
      //   .pop()
      //   .split(".")[0]; //get the first part of the image off/.../nutrition_fr.400.jpg => nutrition_fr

      // axios.post(
      //   `${OFF_URL}/cgi/product_image_unselect.pl?`,
      //   new URLSearchParams(`code=${this.productBuffer[0].code}&id=${imageId}`)
      // );

      this.selectPicture = null;
      this.openSelectPicture = true;
    },
    validateText() {
      axios.post("https://amathjourney.com/api/off/init/", {
        code: this.productCode,
        image_url: this.selectedPictureSuffix,
        is_table: false,
        lang: this.productLang,
        ...this.cropperData,
      });

      this.skipProduct();
    },
    validateTable() {
      axios.post("https://amathjourney.com/api/off/init/", {
        code: this.productCode,
        image_url: this.selectedPictureSuffix,
        is_table: true,
        lang: this.productLang,
        ...this.cropperData,
      });

      this.skipProduct();
    },
    resetProductData() {
      this.selectedPicture = null;
    },
    changeCropCoordinate({ coordinates }) {
      this.cropperData.x0 = coordinates.left;
      this.cropperData.y0 = coordinates.top;
      this.cropperData.x1 = coordinates.left + coordinates.width;
      this.cropperData.y1 = coordinates.top + coordinates.height;
    },
  },
  watch: {
    productCode: function() {
      // watch when a new question is asked
      this.resetProductData();
      if (this.productBuffer.length <= 5 && !this.loading) {
        this.addProducts();
      }
    },
  },
  mounted: function() {
    this.addProducts();
    this.fetchSeenProducts();
    // const vm = this;
    // // to modify
    // window.addEventListener("keyup", function(event) {
    //   if (event.key === "k") vm.skipProduct();
    //   if (event.key === "v") vm.validate();
    // });
  },
};
</script>

<style scoped>
.shadow {
  opacity: 0.2;
}
.unit {
  margin-left: 1rem;
}
button.annotate {
  padding: 1rem 1.5rem;
}
.container {
  width: calc(100vw - 28px);
}
.center {
  text-align: center;
  margin: 0 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  flex-shrink: 1;
}
.selectPictures {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  flex-direction: row;
  overflow-x: auto;
  max-height: 60vh;
}
.selectPictures > img {
  margin: 2rem;
}

.selectPictures > .selected {
  border: 5px solid blue;
}
.imageDisplay {
  background: #ddd !important;
  max-height: 100vw;
  width: 90vw;
}

.questionGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.questionGrid button {
  margin: 0.5rem 1rem;
}

.annotateLine {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.questionContainer {
  position: sticky;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  padding: 0.1rem 0rem;
}
</style>
