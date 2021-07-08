<template>
  <div class="ui grid stackable">
    <div class="eight wide column centered">
      <!--four wide column centered-->
      <div>
        <select v-model="country">
          <option value="">country</option>
          <option>Australia</option>
          <option>Austria</option>
          <option>Belgium</option>
          <option>Denmark</option>
          <option>France</option>
          <option>Germany</option>
          <option>Greece</option>
          <option>Italy</option>
          <option>Sweden</option>
          <option>Switzerland</option>
          <option>United Kingdom</option>
          <option>United States</option>
        </select>
        <input v-model="contributor" placeholder="contributor" />
      </div>
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

        <template v-if="step == 0">
          <cropper
            class="imageDisplay"
            :src="imageURL"
            :canvas="false"
            :checkOrientation="false"
            :crossOrigine="false"
            @change="changeCropCoordinate"
          />
        </template>
        <template v-else>
          <div
            :style="
              `width: min(50vw, 800px); height: calc(min(50vw, 800px) * ${
                imageZoomOptions.coordinates
                  ? imageZoomOptions.coordinates.height /
                    imageZoomOptions.coordinates.width
                  : 1
              })`
            "
          >
            <interactiveImage
              :v-if="imageZoomOptions.image"
              :image="imageZoomOptions.image"
              :coordinates="imageZoomOptions.coordinates"
              :clickableBoxes="clickableBoxes"
              :anotationToValidate="anotationToValidate"
              :bestMatch="bestMatch"
              :boxesHighlight="nutrimentToFill.boxes"
              :attributedBoxesIds="attributedBoxesIds"
              :onlyPredictions="useOnlyPredictions"
              v-on:nutriPredictionAccept="nutriPredictionAccepted"
              v-on:nutriPredictionCancel="nutriPredictionCanceled"
              v-on:validatedBox="validateHumanAnnotation"
            />
          </div>
        </template>
      </template>

      <div class="questionContainer annotateLine">
        <sui-step-group step-number="four">
          <sui-step :active="step == 0" :title="$t('nutrition.steps.1')" />
          <sui-step :active="step == 1" :title="$t('nutrition.steps.2')" />
          <sui-step
            :active="step == 2 || step == 3"
            :title="$t('nutrition.steps.3')"
          />
          <sui-step :active="step == 4" :title="$t('nutrition.steps.4')" />
        </sui-step-group>
        <template v-if="step == 1">
          <div class="line2">
            <span>{{ $t(`nutrition.basis`) }}</span>
            <sui-input
              :error="isInvalid(basisData['quantity'])"
              v-model="basisData['quantity']"
              style="width:5rem"
              v-focus
              inputmode="decimal"
            /><span style="font-size:1.5rem; margin-right: 0.5rem;">g/ml</span>
            <sui-checkbox
              :label="$t(`nutrition.servingSize`)"
              v-model="basisData['isServingSize']"
            />
          </div>
        </template>
        <template :v-else-if="step >= 0 && step <= 4">
          <div class="line2">
            <p v-if="step == 0">
              {{ $t("nutrition.instructions.cropTheTable") }}
            </p>
            <p v-if="step == 2">
              {{ $t("nutrition.instructions.verifyNutrimentDetected") }}
            </p>
            <p v-if="step == 3">
              {{ $t("nutrition.instructions.selectMissingNutriments") }}
            </p>
            <p v-if="step == 4">
              {{ $t("nutrition.instructions.selectValue") }}
              <span class="nutrimentName">{{
                $t(`nutrition.nutriments.${nutrimentToFill.id}`)
              }}</span>
            </p>
          </div>
        </template>

        <div class="line4">
          <button
            class="ui button annotate"
            :class="{ disabled: step === 0 }"
            @click="prevStep()"
          >
            {{ $t("nutrition.prev") }}
          </button>
          <button
            class="ui button annotate"
            :class="{ disabled: !canGoNext }"
            @click="nextStep()"
          >
            {{ $t("nutrition.next") }}
          </button>
        </div>
        <div class="line4">
          <button class="ui button negative annotate" @click="skipProduct()">
            {{ $t("nutrition.skip") }}
          </button>
          <button
            class="ui button positive annotate"
            :class="{ disabled: !canValidate }"
            @click="validate()"
          >
            {{ $t("nutrition.validate") }}
          </button>
        </div>
      </div>
    </div>

    <div class="eight wide column centered">
      <NutritionTable
        v-model="currentProductData"
        v-on:setNurtiIndex="setNutrimentValueIndex"
        :nutrimentToFillIndex="nutrimentToFillIndex"
        :selectLine="step === 4"
      />
    </div>
  </div>
</template>

<script>
import axios from "axios";
import nutrimentsDefaultUnit from "../data/nutritions";
import tableExtraction from "../utils/tableExtraction";
import { OFF_URL } from "../const"; //OFF_IMAGE_URL
import offService from "../off";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import InteractiveImage from "../components/InteractiveImage";
import NutritionTable from "../components/NutritionTable";
const getProducts = async (nbOfPages, country = "", contributor = "") => {
  const randomPage = 1 + Math.floor(Math.random() * nbOfPages);
  const {
    data: { products },
  } = await axios(
    offService.getNutritionToFillUrl(randomPage, country, contributor)
  );
  return products;
};
export default {
  name: "NutritionView",
  components: {
    Cropper,
    InteractiveImage,
    NutritionTable,
  },
  data: function() {
    return {
      loading: false,
      productBuffer: [],
      currentProductData: {},
      basisData: { quantity: "100", isServingSize: false },
      nutritiveId: -2,
      imageZoomOptions: {
        coordinates: null,
        image: null,
      },
      extracted: null,
      step: 0,
      nutritionPredictionIndex: 0,
      nutrimentToFillIndex: 0,
      country: "",
      contributor: "",
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
    productLang: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].lang === null
      ) {
        return "";
      }
      return this.productBuffer[0].lang;
    },
    imageURL: function() {
      if (
        this.productBuffer.length === 0 ||
        this.productBuffer[0].image_nutrition_url === null
      ) {
        return "";
      }
      const imgId = this.productBuffer[0].images[
        `nutrition_${this.productBuffer[0].lang}`
      ].imgid;
      return `${
        this.productBuffer[0]["image_nutrition_url"].split("nutrition_")[0]
      }${imgId}.jpg`;
      // return `${OFF_IMAGE_URL}${this.productBuffer[0].image_url}`;
    },
    bufferIsEmpty: function() {
      return this.productBuffer.length === 0;
    },
    proposedNutriments: function() {
      return "";
    },
    boxes: function() {
      if (!this.extracted || !this.extracted.filteredBoxes) {
        return [];
      }
      return this.extracted.filteredBoxes;
    },
    clickableBoxes: function() {
      if (this.step === 3) {
        return this.extracted.filteredBoxes.map((box) => {
          return {
            boxes: [{ ...box }],
            values: box.description,
          };
        });
      }
      if (this.step === 4) {
        return this.extracted.values.map(({ boxesIndexes, text }) => {
          return {
            boxes: boxesIndexes.map((i) => this.extracted.filteredBoxes[i]),
            values: text[0],
          };
        });
      }
      return [];
    },
    anotationToValidate: function() {
      if (this.step !== 2) {
        return {};
      }
      return {
        text: this.extracted.nutriments[this.nutritionPredictionIndex]["text"],
        key: this.extracted.nutriments[this.nutritionPredictionIndex]["key"],
        boxes: this.extracted.nutriments[this.nutritionPredictionIndex][
          "boxes"
        ].map((i) => this.extracted.filteredBoxes[i]),
      };
    },
    currentValue: function() {
      if (
        !this.extracted ||
        !this.extracted.values ||
        this.nutritiveId < 0 ||
        this.nutritiveId >= this.extracted.values.length
      ) {
        return {};
      }
      return this.extracted.values[this.nutritiveId];
    },
    nutriKeys: function() {
      return Object.keys(this.currentProductData).sort(
        (a, b) => this.currentProductData[a].y - this.currentProductData[b].y
      );
    },
    useOnlyPredictions: function() {
      return this.step === 3;
    },
    nutrimentToFill() {
      if (this.step !== 4) {
        return {};
      }
      const key = this.nutriKeys[this.nutrimentToFillIndex];
      return this.currentProductData[key];
    },
    attributedBoxesIds() {
      return [
        ...Object.keys(this.currentProductData).flatMap((key) =>
          this.currentProductData[key].boxes.map((x) => x.id)
        ),
        ...Object.keys(this.currentProductData).flatMap((key) =>
          this.currentProductData[key].valueBoxes
            ? this.currentProductData[key].valueBoxes.map((x) => x.id)
            : []
        ),
      ];
    },
    canValidate() {
      return this.step === 4;
    },
    canGoNext() {
      if (this.step === 4) {
        return false;
      }
      if (
        this.step === 3 &&
        Object.keys(this.currentProductData).length === 0
      ) {
        return false;
      }
      return true;
    },
  },
  methods: {
    bestMatch({ search, lang = "" }) {
      if (this.step !== 3) {
        return [];
      }
      return tableExtraction.bestMatch({
        search,
        lang,
        except: Object.keys(this.currentProductData),
      });
    },
    prevStep() {
      if (this.step === 1) {
        // return to cropp step. But before that must erase all the computed data because boxes will not be the same
        this.resetProductData();
        return null;
      }
      if (this.step == 2) {
        this.step -= 1;
        return null;
      }
      if (this.step == 3) {
        this.step -= 2;
        return null;
      }
      if (this.step == 4) {
        this.step -= 1;
        return null;
      }
    },
    nextStep() {
      this.step += 1;
      if (this.step === 1) {
        this.extracted = {
          ...tableExtraction.getData(
            this.productBuffer[0].ocrData,
            this.imageZoomOptions
          ),
        };
        // this.extracted = {filteredBoxes, values, nutriment}
        console.log(this.extracted);
      }
      if (this.step === 2) {
        this.nextPrediction();
      }
    },
    nextPrediction(initial = true) {
      let index = this.nutritionPredictionIndex;
      if (!initial) {
        index += 1;
      }
      while (
        index < this.extracted.nutriments.length &&
        (!this.extracted.nutriments[index].key ||
          this.currentProductData[this.extracted.nutriments[index].key] !==
            undefined)
      ) {
        // We stop on a box only if there is a prediction not already attributed
        index += 1;
      }
      if (index == this.extracted.nutriments.length) {
        this.nextStep();
      } else {
        this.nutritionPredictionIndex = index;
      }
    },
    nutriPredictionAccepted() {
      const { key, boxes: nutriBoxes } = this.extracted.nutriments[
        this.nutritionPredictionIndex
      ];
      const keysToAdd = [];
      if (key === "nutriment_energy") {
        keysToAdd.push("nutriment_energy-kj");
        keysToAdd.push("nutriment_energy-kcal");
      } else {
        keysToAdd.push(key);
      }
      const boxes = this.boxes;
      keysToAdd.forEach((k) => {
        this.currentProductData = {
          ...this.currentProductData,
          [k]: {
            id: k,
            data: "",
            unit: nutrimentsDefaultUnit[k],
            x: Math.min(...nutriBoxes.map((i) => boxes[i].minX)),
            y: Math.min(...nutriBoxes.map((i) => boxes[i].minY)),
            boxes: [...nutriBoxes.map((i) => boxes[i])],
            valueBoxes: [],
          },
        };
      });
      this.nextPrediction(false);
    },
    nutriPredictionCanceled() {
      this.nextPrediction(false);
    },
    validateHumanAnnotation(descrition) {
      if (this.step === 3) {
        const { key, boxes } = descrition;
        const keysToAdd = [];
        if (key === "nutriment_energy") {
          keysToAdd.push("nutriment_energy-kj");
          keysToAdd.push("nutriment_energy-kcal");
        } else {
          keysToAdd.push(key);
        }
        keysToAdd.forEach((k) => {
          this.currentProductData = {
            ...this.currentProductData,
            [k]: {
              id: k,
              data: "",
              unit: nutrimentsDefaultUnit[k],
              x: Math.min(...boxes.map((box) => box.minX)),
              y: Math.min(...boxes.map((box) => box.minY)),
              boxes: [...boxes.map((x) => ({ ...x }))],
              valueBoxes: [],
            },
          };
        });
      } else if (this.step === 4) {
        const { values, boxes } = descrition;
        const val = values
          .toLowerCase()
          .match("^((<|>|<=|>=|~|.)*[0-9]+| *)")
          .filter((x) => x !== "")[0];
        let unit = values
          .toLowerCase()
          .match(/[a-z]*/g)
          .filter((x) => x !== "")[0];
        if (unit === "kj") {
          unit = "kJ";
        }
        this.currentProductData = {
          ...this.currentProductData,
          [this.nutrimentToFill.id]: {
            ...this.currentProductData[this.nutrimentToFill.id],
            valueBoxes: [...boxes.map((x) => ({ ...x }))],
            data: val,
            unit: unit,
          },
        };
        if (
          false ===
          this.nutriKeys.reduce(
            (accumulator, currentValue) =>
              accumulator && !!this.currentProductData[currentValue].data,
            true
          )
        ) {
          // if there is a nutriment not filled
          let nextIndex =
            (this.nutrimentToFillIndex + 1) % this.nutriKeys.length;
          while (
            nextIndex !== this.nutrimentToFillIndex &&
            this.currentProductData[this.nutriKeys[nextIndex]].data
          ) {
            nextIndex = (nextIndex + 1) % this.nutriKeys.length;
          }
          this.nutrimentToFillIndex = nextIndex;
        }
      }
    },
    setNutrimentValueIndex(index) {
      this.nutrimentToFillIndex = index;
    },
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~|.)*[0-9]+| *)$");
    },
    changeCropCoordinate({ coordinates, image }) {
      this.imageZoomOptions = {
        ...this.imageZoomOptions,
        coordinates,
        image,
        minX: coordinates.left,
        maxX: coordinates.left + coordinates.width,
        minY: coordinates.top,
        maxY: coordinates.top + coordinates.height,
      };
    },
    addProducts: async function(country, contributor) {
      this.loading = true;
      const newProducts = await getProducts(100, country, contributor);
      this.productBuffer = this.productBuffer.concat(newProducts);
      this.loading = false;
    },
    replaceProducts: async function(country, contributor) {
      this.loading = true;
      const newProducts = await getProducts(1, country, contributor);
      this.productBuffer = [...newProducts];
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
        correctedData[data.name] = `${data.quantity}&`;
      });
      // axios.post("https://amathjourney.com/api/off/correct/", {
      //   code: this.productCode,
      //   true_value: correctedData,
      // });
      this.skipProduct();
    },
    resetProductData() {
      this.currentProductData = {};
      this.basisData = {
        quantity: "100",
        isServingSize: false,
      };
      this.extracted = null;
      this.step = 0;
      this.nutritionPredictionIndex = 0;
      this.nutrimentToFillIndex = 0;
    },
  },
  watch: {
    productCode: function() {
      // watch when a new question is asked
      this.resetProductData();
      if (this.productBuffer.length <= 5 && !this.loading) {
        this.addProducts(this.country, this.contributor);
      }
      if (
        this.productBuffer[0] &&
        this.productBuffer[0].image_nutrition_url &&
        this.productBuffer[0].lang
      ) {
        const imgId = this.productBuffer[0].images[
          `nutrition_${this.productBuffer[0].lang}`
        ].imgid;
        const imageUrl = `${
          this.productBuffer[0].image_nutrition_url
            .split("nutrition")[0]
            .split("products")[1]
        }${imgId}.jpg`;
        const code = this.productBuffer[0].code;
        tableExtraction
          .getOCRdata(imageUrl)
          .then((response) => {
            if (this.productBuffer[0].code === code) {
              // const nutritionKey = `nutrition_${this.productBuffer[0].lang}`;
              this.productBuffer[0] = {
                ...this.productBuffer[0],
                ocrData: response,
                sizes: {
                  full: {
                    ...this.productBuffer[0].images[imgId].sizes.full,
                  },
                  small: {
                    ...this.productBuffer[0].images[imgId].sizes["400"],
                  },
                },
              };
            }
          })
          .catch(() => {
            // TODO : should notify the server that the OCR does not exist
            if (this.productBuffer[0].code === code) {
              this.skipProduct();
            }
          });
      }
    },
    nutriKeys: function() {
      // prevent overflow
      if (this.nutrimentToFillIndex >= this.nutriKeys.length) {
        this.nutrimentToFillIndex =
          this.nutrimentToFillIndex % this.nutriKeys.length || 0;
      }
    },
    country: function() {
      const vm = this;
      const currentCountry = this.country;
      const currentContributor = this.contributor;
      setTimeout(() => {
        if (
          currentCountry === vm.country &&
          currentContributor === vm.contributor
        ) {
          this.replaceProducts(vm.country, vm.contributor);
        } else {
          console.log("change");
        }
      }, 500);
    },
    contributor: function() {
      const vm = this;
      const currentCountry = this.country;
      const currentContributor = this.contributor;
      setTimeout(() => {
        if (
          currentCountry === vm.country &&
          currentContributor === vm.contributor
        ) {
          this.replaceProducts(vm.country, vm.contributor);
        } else {
          console.log("change");
        }
      }, 500);
    },
  },
  mounted: function() {
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
button.annotate {
  padding: 1rem 1.5rem;
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
.nutrimentName {
  color: blue;
  font-size: 1.5rem;
}
</style>
