<template>
  <div class="ui grid stackable">
    <div class="four wide column centered">
      <div class="insight-column">
        <div class="ui form">
          <div class="ui icon input" id="value-tag-input">
            <input
              class="ui input"
              placeholder="value (fanta, en:organic,...)"
              v-model="valueTagInput"
            />
            <i @click="clearValueTagInput()" v-if="valueTagInput" class="times link icon"></i>
          </div>
          <!-- <div class="ui toggle checkbox" style="margin-top: 0.5rem;">
            <input v-model="sortByPopularity" type="checkbox" name="sortBy" />
            <label>Sort by popularity</label>
          </div>-->
        </div>
        <div class="ui divider hidden"></div>
        <viewer :options="imageZoomOptions" style="height: 300px">
          <img
            :class="[imageRotationClass]"
            :src="productBuffer[0]['image_nutrition_url']"
            style="max-height: 300px;
          max-width: 300px;"
          />
        </viewer>
      </div>
    </div>
    <div class="ten wide column centered">
      <sui-table celled definition>
        <sui-table-header>
          <sui-table-header-cell />
          <sui-table-header-cell>{{$t("nutrition.table.value")}}</sui-table-header-cell>
          <sui-table-header-cell>{{$t("nutrition.table.ispresent")}}</sui-table-header-cell>
        </sui-table-header>
        <sui-table-row v-for="nutritiveValue in currentProductData" :key="nutritiveValue.id">
          <sui-table-cell>{{ nutritiveValue.name }}</sui-table-cell>
          <sui-table-cell style="display: flex">
            <sui-input
              :disabled="!nutritiveValue.visible"
              style="flex-grow:1"
              :error="isInvalid(currentProductData[nutritiveValue.id]['data'])"
              v-model="currentProductData[nutritiveValue.id]['data']"
            />

            <sui-dropdown
              :disabled="!nutritiveValue.visible"
              style="min-width: 3rem"
              selection
              :placeholder="$t('nutrition.table.unit')"
              v-if="getNutrimentUnits(nutritiveValue.name).length > 1"
              v-model="currentProductData[nutritiveValue.id]['unit']"
              :options="getNutrimentUnits(nutritiveValue.name)"
              class="unit"
            />

            <span class="unit" v-else>{{ getNutrimentUnits(nutritiveValue.name)[0] }}</span>
          </sui-table-cell>
          <sui-table-cell>
            <sui-checkbox
              name="public"
              :label="nutritiveValue.visible?$t('nutrition.present'):$t('nutrition.absent')"
              v-model="currentProductData[nutritiveValue.id]['visible']"
            />
          </sui-table-cell>
        </sui-table-row>
      </sui-table>
      <!-- <button
            data-inverted
            data-tooltip="Shortcut: n"
            class="ui button red annotate"
            @click="annotate(0)"
          >
            No
          </button>
          <button
            data-inverted
            data-tooltip="Shortcut: k"
            class="ui button annotate"
            @click="annotate(-1)"
          >
            Skip
          </button>
          <button
            data-inverted
            data-tooltip="Shortcut: o"
            class="ui button green annotate"
            @click="annotate(1)"
          >
            Yes
      </button>-->
    </div>
    <div class="flex-center" style="margin-top: 100px;">
      <div class="loading-spinner" v-if="loading">
        <div class="loading-spinner-content">
          <div></div>
        </div>
      </div>
      <div v-if="noRemainingQuestion">
        <h2>No questions remaining</h2>
      </div>
    </div>
    <!-- <div class="six wide column centered">
      <Product :barcode="currentQuestionBarcode" />
    </div>
    <div class="three wide column annotation-column">
      <AnnotationCounter
        :remainingCount="remainingQuestionCount"
        :lastAnnotations="lastAnnotations"
        :sessionAnnotatedCount="sessionAnnotatedCount"
      />
    </div>-->
  </div>
</template>

<script>
import axios from "axios";
// import { localSettings } from "../settings";
import nutriments from "../data/nutritions";
import { OFF_URL } from "../const";
// import { annotate as robotoffAnnotate } from "../robotoff";
// import Product from "../components/Product";
// import AnnotationCounter from "../components/AnnotationCounter";

const getProducts = async (nbOfPages) => {
  const randomPage = Math.floor(Math.random() * nbOfPages);
  const {
    data: { products },
  } = await axios(
    `${OFF_URL}/state/photos-validated/state/nutrition-facts-to-be-completed/${randomPage}.json?fields=code,lang,image_nutrition_url,product_name`
  );
  return products;
};

export default {
  name: "NutritionView",
  components: {},
  data: function () {
    return {
      valueTagInput: "",
      imageZoomOptions: {
        toolbar: {
          rotateLeft: 1,
          rotateRight: 1,
        },
      },
      loading: false,
      productBuffer: [],
      currentProductData: {},
    };
  },
  methods: {
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~)*[0-9]+| *)$");
    },
    clearValueTagInput() {
      this.valueTagInput = "";
    },
    addProducts: async function () {
      this.loading = true;
      const newProducts = await getProducts(20);
      this.productBuffer = this.productBuffer.concat(newProducts);
      this.loading = false;
    },
    skipProduct() {
      this.productBuffer.shift();
    },
    resetProductData() {
      const data = {};

      for (const nutrimentName of Object.keys(nutriments)) {
        data[nutriments[nutrimentName]] = {
          id: nutriments[nutrimentName],
          name: nutrimentName,
          data: "",
          unit: null,
          visible: true,
        };
      }
      this.currentProductData = data;
    },
    getNutrimentUnits(nutrimentName) {
      switch (nutrimentName) {
        case "Energy (kCal)":
          return ["kcal"];
        case "Energy (kJ)":
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
    productBuffer: function (newProductBuffer, oldProductBuffer) {
      if (newProductBuffer.length <= 5 && !this.loading) {
        this.addProducts();
      }
      if (
        newProductBuffer[0] &&
        (!oldProductBuffer[0] ||
          newProductBuffer[0].code !== oldProductBuffer[0].code)
      ) {
        //if we have a product to display, and this product just changed
        this.resetProductData();
      }
    },
  },
  mounted: function () {
    this.addProducts();
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
</style>
