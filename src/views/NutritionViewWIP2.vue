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
        <cropper
          class="imageDisplay"
          :src="imageURL"
          :canvas="false"
          :checkOrientation="false"
          :crossOrigine="false"
          :stencil-props="{
            handlers: {},
            movable: false,
            scalable: false,
          }"
          :stencilSize="
            ({ boundaries }) => {
              return {
                width: boundaries.width,
                height: boundaries.height,
              };
            }
          "
          :default-visible-area="defaultVisibleArea"
        />
      </template>
    </div>

    <div class="questionContainer annotateLine">
      <template v-if="nutritiveId == -1">
        <div class="line2">
          <span>{{ $t(`nutrition.basis`) }}</span>
          <sui-input
            :error="isInvalid(basisData['quantity'])"
            v-model="basisData['quantity']"
            style="width:5rem"
            v-focus
          /><span style="font-size:1.5rem; margin-right: 0.5rem;">g</span>
          <sui-checkbox
            :label="$t(`nutrition.servingSize`)"
            v-model="basisData['isServingSize']"
          />
        </div>
      </template>
      <template v-else>
        <div class="line1">
          <button
            v-for="(prediction, index) in predictions"
            :key="index"
            @click="setNutriment(prediction)"
          >
            {{ prediction }}
          </button>
        </div>
        <div class="line2">
          <span>{{ $t(`nutrition.nutriments.${nutritiveValue.id}`) }}</span>
          <sui-input
            :error="isInvalid(currentProductData[nutritiveValue.id]['data'])"
            v-model="currentProductData[nutritiveValue.id]['data']"
            v-focus
          />

          <sui-dropdown
            style="min-width: 3rem"
            selection
            :placeholder="$t('nutrition.unit')"
            v-if="getNutrimentUnits(nutritiveValue.id).length > 1"
            v-model="currentProductData[nutritiveValue.id]['unit']"
            :options="getNutrimentUnits(nutritiveValue.id)"
            class="unit"
          />
        </div>
      </template>
      <div class="line3">
        <button
          class="ui button annotate"
          :disabled="nutrimentId == -1"
          @click="prevNutriment()"
        >
          {{ $t("nutrition.prev") }}
        </button>
        <button
          class="ui button annotate"
          :disabled="!remainNutriments"
          @click="nextNutriment()"
        >
          {{ $t("nutrition.next") }}
        </button>
      </div>
      <div class="line4">
        <button class="ui button annotate" @click="skipProduct()">
          {{ $t("nutrition.skip") }}
        </button>

        <button
          class="ui positive button annotate"
          @click="validate()"
          :disabled="remainNutriments"
        >
          {{ $t("nutrition.end") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import nutrimentsDefaultUnit from "../data/nutritions";
import { OFF_IMAGE_URL, OFF_URL } from "../const";
import offService from "../off";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const getProducts = async () => {
  const { data: products } = await axios.get(
    "https://amathjourney.com/api/off/"
  );
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
      basisData: {},
      openSelectPicture: false,
      selectedPicture: false,
      nutritiveId: -1,
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
    imageURL: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].image_url === null
      ) {
        return "";
      }
      return `${OFF_IMAGE_URL}${this.productBuffer[0].image_url}`;
    },
    bufferIsEmpty: function() {
      return this.productBuffer.length === 0;
    },
    nutritiveValue: function() {
      return this.currentProductData[
        Object.keys(this.currentProductData)[this.nutritiveId]
      ];
    },
    predictions: function() {
      if (
        this.productBuffer.length === 0 ||
        !this.productBuffer[0].simple_prediction
      ) {
        return [];
      }

      const id = Object.keys(this.currentProductData)[this.nutritiveId];
      if (!this.productBuffer[0].simple_prediction[id]) {
        return [];
      }
      return this.productBuffer[0].simple_prediction[id].filter((item, pos) => {
        return (
          /\d/.test(item) &&
          this.productBuffer[0].simple_prediction[id].findIndex(
            (val) => val === item
          ) == pos
        );
      });
    },
    defaultVisibleArea() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].x0 === null
      ) {
        return {};
      }
      const { x0, y0, x1, y1 } = this.productBuffer[0];
      return {
        width: x1 - x0,
        height: y1 - y0,
        left: x0,
        top: y0,
      };
    },
    remainNutriments() {
      return this.nutritiveId + 1 < Object.keys(this.currentProductData).length;
    },
  },
  methods: {
    nextNutriment() {
      console.log(this.currentProductData);
      if (this.remainNutriments) {
        this.nutritiveId += 1;
      }
    },
    prevNutriment() {
      if (this.nutritiveId > -1) {
        this.nutritiveId -= 1;
      }
    },
    setNutriment(prediction) {
      const val = prediction
        .match(/[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*/g)
        .filter((x) => x !== "")[0];
      const unit = prediction.match(/[a-z]*/g).filter((x) => x !== "")[0];

      if (unit === "kj") {
        this.currentProductData[this.nutritiveValue.id]["unit"] = "kJ";
      } else if (unit) {
        this.currentProductData[this.nutritiveValue.id]["unit"] = unit;
      }
      this.currentProductData[this.nutritiveValue.id]["data"] = val;
      this.nextNutriment();
    },
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~|.)*[0-9]+| *)$");
    },
    addProducts: async function() {
      this.loading = true;
      const newProducts = await getProducts();
      console.log(newProducts);
      this.productBuffer = this.productBuffer.concat(newProducts);
      this.loading = false;
    },
    skipProduct() {
      this.productBuffer.shift();
    },
    getBasisTextForAPI() {
      if (this.basisData.quantity && !this.isInvalid(this.basisData.quantity)) {
        if (this.basisData.isServingSize) {
          return `nutrition_data_per=serving&serving_size=${this.basisData.quantity}g`;
        }
        return `nutrition_data_per=${this.basisData.quantity}g`;
      }
      return "";
    },
    validate() {
      const withData = Object.keys(this.currentProductData)
        .filter(
          (nutrimentId) =>
            this.currentProductData[nutrimentId] &&
            this.currentProductData[nutrimentId].data &&
            !this.isInvalid(this.currentProductData[nutrimentId].data) &&
            this.currentProductData[nutrimentId].data.length > 0
        )
        .map((nutrimentId) => ({
          name: nutrimentId,
          value: `${this.currentProductData[nutrimentId].data}${this
            .currentProductData[nutrimentId].unit || ""}`,
          quantity: this.currentProductData[nutrimentId].data,
          unit: this.currentProductData[nutrimentId].unit,
        }));
      const withoutData = Object.keys(this.currentProductData)
        .filter(
          (nutrimentId) =>
            this.currentProductData[nutrimentId] &&
            !this.currentProductData[nutrimentId].data
        )
        .map((nutrimentId) => ({
          name: nutrimentId,
          value: "",
          quantity: "",
          unit: "",
        }));
      const basisText = this.getBasisTextForAPI();

      axios.post(
        `${OFF_URL}/cgi/product_jqm2.pl?`,
        new URLSearchParams(
          `${withData
            .map((data) => `${data.name}=${data.quantity}&`)
            .join("")}${withData
            .map((data) => (data.unit ? `${data.name}_unit=${data.unit}&` : ""))
            .join("")}${withoutData.map((name) => `${name}=""&`).join("")}${
            basisText ? `${basisText}&` : ""
          }code=${this.productBuffer[0]["code"]}`
        )
      ); // The status of the response is not displayed so no need to wait the response
      const correctedData = {};
      withData.forEach((data) => {
        correctedData[data.name] = data.quantity;
      });

      axios.post("https://amathjourney.com/api/off/correct/", {
        code: this.productCode,
        true_value: correctedData,
      });
      this.skipProduct();
    },
    resetProductData() {
      const data = {};

      for (const nutrimentId of Object.keys(nutrimentsDefaultUnit)) {
        data[nutrimentId] = {
          id: nutrimentId,
          data: "",
          unit: nutrimentsDefaultUnit[nutrimentId],
        };
      }
      this.currentProductData = data;
      this.basisData = {
        quantity: "",
        isServingSize: false,
      };
      this.nutritiveId = -1;
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
      if (event.target.nodeName == "INPUT" && event.key === "Enter") {
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
  max-width: 21cm;
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
  /* display: flex;
  justify-content: center;
  flex-wrap: wrap; */
}

.questionContainer {
  position: sticky;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 0.5rem;
}

.line1,
.line2,
.line3,
.line4 {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 4px;
}

.line2 {
  justify-content: center;
  align-items: center;
}
.line3 {
  justify-content: space-between;
}
.line1 {
  justify-content: space-around;
}
.line4 {
  justify-content: stretch;
}
.line4 button {
  flex-grow: 1;
}

.line1 button {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  margin-bottom: 0.5rem;
}
</style>
