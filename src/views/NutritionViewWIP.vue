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
        <!-- ask what type is the image -->
        <template v-if="currentQuestion === CLASSIFY_QUESTION">
          <v-zoomer class="cropper" :minScale="0">
            <img
              :src="selectedPictureURL"
              style="object-fit: contain; width: 100%; height: 100%;"
            />
          </v-zoomer>
        </template>
        <!-- ask to crop the table -->
        <template v-else-if="currentQuestion === CROP_QUESTION">
          <cropper
            class="cropper"
            :src="selectedPictureURL"
            @change="changeCropCoordinate"
            :canvas="false"
            :checkOrientation="false"
            :crossOrigine="false"
          />
        </template>
        <!-- ask to fill line per line the table -->
        <template v-else-if="currentQuestion === FILL_QUESTION">
          <v-zoomer class="cropper" :minScale="0">
            <img
              :src="selectedPictureURL"
              style="object-fit: contain; width: 100%; height: 100%;"
            />
          </v-zoomer>
        </template>
      </template>
    </div>
    <div class="questionGrid" v-if="currentQuestion === CLASSIFY_QUESTION">
      <button
        data-tooltip="Shortcut: d"
        class="ui button red annotate"
        @click="deleteProduct()"
      >
        {{ $t("nutrition.delete") }}
      </button>
      <button
        data-tooltip="Shortcut: k"
        class="ui button annotate"
        @click="skipProduct()"
      >
        {{ $t("nutrition.skip") }}
      </button>
      <button
        data-tooltip="Shortcut: v"
        class="ui button green annotate"
        @click="validateText()"
      >
        {{ $t("nutrition.validateIsText") }}
      </button>
      <button
        data-tooltip="Shortcut: v"
        class="ui button green annotate"
        @click="validateTable()"
      >
        {{ $t("nutrition.validateIsATable") }}
      </button>
    </div>
    <div class="questionGrid" v-else-if="currentQuestion === CROP_QUESTION">
      <button class="ui button annotate" @click="validateCorp(false)">
        {{ $t("nutrition.skipCrop") }}
      </button>
      <button class="ui button green annotate" @click="validateCorp(false)">
        {{ $t("nutrition.useCrop") }}
      </button>
    </div>
    <div
      class="questionContainer annotateLine"
      v-else-if="currentQuestion === FILL_QUESTION"
    >
      <span>{{ $t(`nutrition.nutriments.${nutritiveValue.id}`) }}</span>
      <sui-input
        :disabled="!nutritiveValue.visible"
        :error="isInvalid(currentProductData[nutritiveValue.id]['data'])"
        v-model="currentProductData[nutritiveValue.id]['data']"
        v-focus
      />

      <sui-dropdown
        :disabled="!nutritiveValue.visible"
        style="min-width: 3rem"
        selection
        :placeholder="$t('nutrition.unit')"
        v-if="getNutrimentUnits(nutritiveValue.id).length > 1"
        v-model="currentProductData[nutritiveValue.id]['unit']"
        :options="getNutrimentUnits(nutritiveValue.id)"
        class="unit"
      />
      <button class="ui button annotate" @click="nextNutriment()">
        {{ $t("nutrition.next") }}
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
import nutrimentsDefaultUnit from "../data/nutritions";
// import { OFF_URL } from "../const";
import offService from "../off";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const constants = {
  CLASSIFY_QUESTION: -2,
  CROP_QUESTION: -1,
  FILL_QUESTION: 0,
};

const getProducts = async (nbOfPages) => {
  const randomPage = Math.floor(Math.random() * nbOfPages);
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
      currentProductData: {},
      currentQuestion: constants.CLASSIFY_QUESTION,
      openSelectPicture: false,
      selectedPicture: false,
      nutritiveId: 0,
      ...constants,
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
    nutritiveValue: function() {
      if (this.currentQuestion !== constants.FILL_QUESTION) {
        return {};
      }

      return this.currentProductData[
        Object.keys(this.currentProductData)[this.nutritiveId]
      ];
    },
  },
  methods: {
    nextNutriment() {
      if (this.nutritiveId + 1 < Object.keys(this.currentProductData).length) {
        this.nutritiveId += 1;
      } else {
        this.validate();
      }
    },
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~|.)*[0-9]+| *)$");
    },
    clearValueTagInput() {
      this.valueTagInput = "";
    },
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
      this.skipProduct();
    },
    validateImage() {
      // axios.post(
      //   `${OFF_URL}/cgi/product_image_crop.pl?`,
      //   new URLSearchParams(
      //     `code=${this.productBuffer[0].code}&id=${this.selectedPicture}&id=nutrition_${this.productBuffer[0].lang}`
      //   )
      // );
      this.openSelectPicture = false;
      this.currentQuestion = constants.CROP_QUESTION;
    },
    addProducts: async function() {
      this.loading = true;
      const newProducts = await getProducts(20);
      this.productBuffer = this.productBuffer.concat(newProducts);
      this.loading = false;
    },
    skipProduct() {
      this.currentQuestion = constants.CLASSIFY_QUESTION;
      this.productBuffer.shift();
    },
    deleteProduct() {
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
      this.currentQuestion = constants.FILL_QUESTION;
    },
    validateTable() {
      this.currentQuestion = constants.CROP_QUESTION;
    },
    validateCorp(useCrop) {
      if (useCrop) {
        // add here the extraction of dat from api call
        this.currentQuestion = constants.FILL_QUESTION;
      }
      this.currentQuestion = constants.FILL_QUESTION;
    },
    validate() {
      // const toDelete = Object.keys(this.currentProductData).filter(
      //   (nutrimentId) => !this.currentProductData[nutrimentId].visible
      // );
      // const toFill = Object.keys(this.currentProductData)
      //   .filter(
      //     (nutrimentId) =>
      //       this.currentProductData[nutrimentId] &&
      //       this.currentProductData[nutrimentId].visible &&
      //       this.currentProductData[nutrimentId].data &&
      //       this.isInvalid(this.currentProductData[nutrimentId].data) &&
      //       this.currentProductData[nutrimentId].data.length > 0
      //   )
      //   .map((nutrimentId) => ({
      //     name: nutrimentId,
      //     value: `${this.currentProductData[nutrimentId].data}${this
      //       .currentProductData[nutrimentId].unit || ""}`,
      //     quantity: this.currentProductData[nutrimentId].data,
      //     unit: this.currentProductData[nutrimentId].unit,
      //   }));

      // axios.post(
      //   `${OFF_URL}/cgi/product_jqm2.pl?`,
      //   new URLSearchParams(
      //     `${toFill
      //       .map((data) => `${data.name}=${data.quantity}&`)
      //       .join("")}${toFill
      //       .map((data) => (data.unit ? `${data.name}_unit=${data.unit}&` : ""))
      //       .join("")}${toDelete.map((name) => `${name}=""&`).join("")}code=${
      //       this.productBuffer[0]["code"]
      //     }`
      //   )
      // ); // The status of the response is not displayed so no need to wait the response

      this.skipProduct();
    },
    resetProductData() {
      const data = {};

      for (const nutrimentId of Object.keys(nutrimentsDefaultUnit)) {
        data[nutrimentId] = {
          id: nutrimentId,
          data: "",
          unit: nutrimentsDefaultUnit[nutrimentId],
          visible: true,
        };
      }
      this.currentProductData = data;
      this.nutritiveId = 0;
      this.selectedPicture = null;
    },
    getNutrimentUnits(nutrimentId) {
      switch (nutrimentId) {
        case "nutriment_energy-kcal":
          return ["kcal"];
        case "nutriment_energy-kj":
          return ["kJ"];
        default:
          return [
            { text: "g", value: "g" },
            { text: "mg", value: "mg" },
          ];
      }
    },
    changeCropCoordinate({ coordinates, canvas }) {
      console.log(coordinates, canvas);
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

    const vm = this;
    window.addEventListener("keyup", function(event) {
      if (event.target.nodeName == "BODY") {
        if (event.key === "k") vm.skipProduct();
        if (event.key === "v") vm.validate();
      } else if (
        event.target.nodeName == "INPUT" &&
        event.key === "Enter" &&
        vm.currentQuestion === constants.FILL_QUESTION
      ) {
        vm.nextNutriment();
      }
    });
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
  flex-direction: row;
  overflow: auto;
}
.selectPictures > img {
  margin: 2rem;
}

.selectPictures > .selected {
  border: 5px solid blue;
}
.cropper {
  background: #ddd !important;
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
  padding: 0.5rem 0.5rem;
}
</style>
