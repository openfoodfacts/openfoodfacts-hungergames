<template>
  <div class="ui grid stackable">
    <div class="four wide column centered">
      <div v-if="bufferIsEmpty">
        <p v-if="loading">Loading ...</p>
        <p v-else>No remaining images</p>
      </div>
      <div v-else class="insight-column">
        <h3>{{ productName }}</h3>
        <a target="_blank" :href="productUrl" class="ui button primary">{{
          $t("questions.view")
        }}</a>
        <a target="_blank" :href="productEditUrl" class="ui button">{{
          $t("questions.edit")
        }}</a>
        <div class="ui divider"></div>
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
          <sui-table-header-cell>{{
            $t("nutrition.table.value")
          }}</sui-table-header-cell>
          <sui-table-header-cell>{{
            $t("nutrition.table.ispresent")
          }}</sui-table-header-cell>
        </sui-table-header>
        <sui-table-row
          v-for="nutritiveValue in currentProductData"
          :key="nutritiveValue.id"
        >
          <sui-table-cell>{{
            $t(`nutrition.nutriments.${nutritiveValue.id}`)
          }}</sui-table-cell>
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
              v-if="getNutrimentUnits(nutritiveValue.id).length > 1"
              v-model="currentProductData[nutritiveValue.id]['unit']"
              :options="getNutrimentUnits(nutritiveValue.id)"
              class="unit"
            />

            <span class="unit" v-else>{{
              getNutrimentUnits(nutritiveValue.id)[0]
            }}</span>
          </sui-table-cell>
          <sui-table-cell>
            <sui-checkbox
              name="public"
              :label="
                nutritiveValue.visible
                  ? $t('nutrition.present')
                  : $t('nutrition.absent')
              "
              v-model="currentProductData[nutritiveValue.id]['visible']"
            />
          </sui-table-cell>
        </sui-table-row>
      </sui-table>
      <div>
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
          @click="validate()"
        >
          {{ $t("nutrition.validate") }}
        </button>
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
import nutrimentsDefaultUnit from "../data/nutritions";
import { OFF_URL } from "../const";
import offService from "../off";
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
  data: function() {
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
  computed: {
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
    bufferIsEmpty: function() {
      return this.productBuffer.length === 0;
    },
  },
  methods: {
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~|.)*[0-9]+| *)$");
    },
    clearValueTagInput() {
      this.valueTagInput = "";
    },
    addProducts: async function() {
      this.loading = true;
      const newProducts = await getProducts(20);
      this.productBuffer = this.productBuffer.concat(newProducts);
      this.loading = false;
    },
    skipProduct() {
      this.productBuffer.shift();
    },
    validate() {
      const toDelete = Object.keys(this.currentProductData).filter(
        (nutrimentId) => !this.currentProductData[nutrimentId].visible
      );
      const toFill = Object.keys(this.currentProductData)
        .filter(
          (nutrimentId) =>
            this.currentProductData[nutrimentId] &&
            this.currentProductData[nutrimentId].visible &&
            this.currentProductData[nutrimentId].data &&
            this.isInvalid(this.currentProductData[nutrimentId].data) &&
            this.currentProductData[nutrimentId].data.length > 0
        )
        .map((nutrimentId) => ({
          name: nutrimentId,
          value: `${this.currentProductData[nutrimentId].data}${this
            .currentProductData[nutrimentId].unit || ""}`,
          quantity: this.currentProductData[nutrimentId].data,
          unit: this.currentProductData[nutrimentId].unit,
        }));

      axios.post(
        `${OFF_URL}/cgi/product_jqm2.pl?`,
        new URLSearchParams(
          `${toFill
            .map((data) => `${data.name}=${data.quantity}&`)
            .join("")}${toFill
            .map((data) => (data.unit ? `${data.name}_unit=${data.unit}&` : ""))
            .join("")}${toDelete.map((name) => `${name}=""&`).join("")}code=${
            this.productBuffer[0]["code"]
          }`
        )
      ); // The status of the response is not displayed so no need to wait the response
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
    productBuffer: function(newProductBuffer, oldProductBuffer) {
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
  mounted: function() {
    this.addProducts();

    const vm = this;
    window.addEventListener("keyup", function(event) {
      if (event.target.nodeName == "BODY") {
        if (event.key === "k") vm.skipProduct();
        if (event.key === "v") vm.validate();
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
  padding: 2rem 2.5rem;
}
</style>
