<template>
  <div class="ui grid stackable">
    <div class="five wide column centered">
      <div class="insight-column">
        <div
          class="tag"
          :class="{ selected: insightType === selectedInsightType }"
          v-for="insightType of availableInsightTypes"
          :key="insightType"
          @click="selectInsightType(insightType)"
        >
          {{ $t("questions." + insightType) }}
        </div>
        <div class="ui form">
          <div class="ui icon input" id="value-tag-input">
            <input
              class="ui input"
              :placeholder="$t('questions.value_search')"
              v-model="valueTagInput"
            />
            <i
              @click="clearValueTagInput()"
              v-if="valueTagInput"
              class="times link icon"
            ></i>
          </div>
          <div class="ui toggle checkbox" style="margin-top: 0.5rem">
            <input v-model="sortByPopularity" type="checkbox" name="sortBy" />
            <label>{{ $t("questions.popularity_sort") }}</label>
          </div>
        </div>
        <div class="ui divider" />
        <div class="ui hidden divider"></div>
        <div v-if="currentQuestion">
          <h3>{{ currentQuestion.question }}</h3>
          <div v-if="valueTagQuestionsURL.length">
            <router-link :to="valueTagQuestionsURL" target="_blank">
              <div class="ui big label">
                {{ currentQuestion.value }}
                <i
                  style="margin-left: 0.5rem"
                  class="external alternate icon small blue"
                ></i>
              </div>
            </router-link>
          </div>
          <div v-else>
            <div class="ui big label">{{ currentQuestion.value }}</div>
          </div>
          <div class="ui divider hidden"></div>
          <viewer :options="imageZoomOptions" style="height: 300px">
            <img
              :class="[imageRotationClassName]"
              :src="currentQuestionImageUrl"
              style="max-height: 300px; max-width: 300px"
            />
          </viewer>
          <div class="ui divider hidden"></div>
          <div>
            <button
              data-inverted
              data-tooltip="Shortcut: n"
              class="ui button red annotate"
              @click="annotate(0)"
            >
              {{ $t("questions.no") }}
            </button>
            <button
              data-inverted
              data-tooltip="Shortcut: k"
              class="ui button annotate"
              @click="annotate(-1)"
            >
              {{ $t("questions.skip") }}
            </button>
            <button
              data-inverted
              data-tooltip="Shortcut: o"
              class="ui button green annotate"
              @click="annotate(1)"
            >
              {{ $t("questions.yes") }}
            </button>
          </div>
        </div>
        <div class="flex-center" v-else style="margin-top: 100px">
          <LoadingSpinner :show="loading" />
          <div v-if="noRemainingQuestion">
            <h2>{{ $t("questions.no_questions_remaining") }}</h2>
          </div>
        </div>
      </div>
    </div>
    <div class="six wide column centered">
      <Product :barcode="currentQuestionBarcode" />
    </div>
    <div class="three wide column annotation-column">
      <AnnotationCounter
        :remainingCount="remainingQuestionCount"
        :lastAnnotations="lastAnnotations"
        :sessionAnnotatedCount="sessionAnnotatedCount"
      />
    </div>
  </div>
</template>

<script>
import robotoffService from "../robotoff";
import Product from "../components/Product";
import LoadingSpinner from "../components/LoadingSpinner";

import AnnotationCounter from "../components/AnnotationCounter";

const updateURLParam = (key, value) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(key, value);
  const newRelativePathQuery =
    window.location.pathname + "?" + urlParams.toString();
  history.pushState(null, "", newRelativePathQuery);
};

const deleteURLParam = (key) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.has(key)) {
    return;
  }

  urlParams.delete(key);

  const newRelativePathQuery =
    window.location.pathname +
    (urlParams.toString().length ? `?${urlParams.toString()}` : "");

  history.pushState(null, "", newRelativePathQuery);
};

const getURLParam = (key) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.has(key)) {
    return "";
  }

  return urlParams.get(key);
};

const NO_QUESTION_LEFT = "NO_QUESTION_LEFT";

const insightTypesNames = {
  label: "label",
  category: "category",
  brand: "brand",
  product_weight: "product weight",
};

const randomInsightTypeChoices = ["label", "category", "brand"];

const getRandomInsightType = () =>
  randomInsightTypeChoices[
    Math.floor(randomInsightTypeChoices.length * Math.random())
  ];

const getInitialInsightType = () => {
  const urlParamValue = getURLParam("type");

  if (urlParamValue.length) {
    return urlParamValue;
  }

  return getRandomInsightType();
};

const reformatTagMapping = {
  " ": "-",
  "'": "-",
  "&": "",
  à: "a",
  â: "a",
  ä: "a",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  î: "i",
  ï: "i",
  ô: "o",
  ö: "o",
  û: "u",
  ù: "u",
  ü: "u",
};

const reformatValueTag = (value) => {
  let output = value.trim().toLowerCase();
  for (const [search, replace] of Object.entries(reformatTagMapping)) {
    output = output.replace(new RegExp(search, "g"), replace);
  }
  output = output.replace(/-{2,}/g, "-");
  return output;
};

export default {
  name: "QuestionView",
  components: { Product, AnnotationCounter, LoadingSpinner },
  data: function () {
    return {
      valueTag: getURLParam("value_tag"),
      valueTagInput: getURLParam("value_tag"),
      valueTagTimeout: null,
      currentQuestion: null,
      questionBuffer: [],
      remainingQuestionCount: 0,
      lastAnnotations: [],
      sessionAnnotatedCount: 0,
      insightTypesNames: insightTypesNames,
      selectedInsightType: getInitialInsightType(),
      imageRotation: 0,
      seenInsightIds: new Set(),
      sortByPopularity: false,
      brandFilter: getURLParam("brand"),
      countryFilter: getURLParam("country"),
      imageZoomOptions: {
        toolbar: {
          rotateLeft: 1,
          rotateRight: 1,
        },
      },
    };
  },
  watch: {
    valueTagInput: function () {
      clearTimeout(this.valueTagTimeout);

      if (this.valueTagInput.length == 0) {
        this.valueTag = "";
        deleteURLParam("value_tag");
        return;
      }

      const valueTagInput = this.valueTagInput.toLowerCase();

      this.valueTagTimeout = setTimeout(() => {
        this.valueTag = reformatValueTag(valueTagInput);
        updateURLParam("value_tag", this.valueTag);
      }, 1000);
    },
    valueTag: function () {
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    sortByPopularity: function () {
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    selectedInsightType: function () {
      this.updateInsightTypeUrlParam();
    },
  },
  methods: {
    clearValueTagInput() {
      this.valueTagInput = "";
    },
    rotateImage() {
      window.console.log(this.imageRotation);
      if (this.imageRotation === 0) {
        this.imageRotation = 90;
      } else if (this.imageRotation === 90) {
        this.imageRotation = 180;
      } else if (this.imageRotation === 180) {
        this.imageRotation = 270;
      } else if (this.imageRotation === 270) {
        this.imageRotation = 0;
      }
    },
    updateInsightTypeUrlParam() {
      updateURLParam("type", this.selectedInsightType);
    },
    updateLastAnnotations(question, annotation) {
      this.lastAnnotations.push({
        question,
        annotation,
      });

      if (this.lastAnnotations.length > 10) {
        this.lastAnnotations.shift();
      }
    },
    selectInsightType: function (insightType) {
      this.selectedInsightType = insightType;
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    annotate: function (annotation) {
      if (annotation !== -1) {
        robotoffService.annotate(this.currentQuestion.insight_id, annotation);
        this.updateLastAnnotations(this.currentQuestion, annotation);
        this.remainingQuestionCount -= 1;
        this.sessionAnnotatedCount += 1;
      }
      this.updateCurrentQuestion();

      if (!this.noRemainingQuestion && this.questionBuffer.length <= 2) {
        this.loadQuestions();
      }
    },
    updateCurrentQuestion: function () {
      this.currentQuestion = null;
      if (this.questionBuffer.length > 0) {
        this.currentQuestion = this.questionBuffer.shift();
      } else {
        window.console.error(
          "question buffer is empty, cannot update current question!"
        );
      }
    },
    loadQuestions: function () {
      const sortBy = this.sortByPopularity ? "popular" : "random";
      const count = 10;
      robotoffService
        .questions(
          sortBy,
          this.selectedInsightType,
          this.valueTag,
          this.brandFilter,
          this.countryFilter !== "en:world" ? this.countryFilter : null,
          count
        )
        .then((result) => {
          this.remainingQuestionCount = result.data.count;
          if (result.data.questions.length == 0) {
            if (!this.questionBuffer.includes(NO_QUESTION_LEFT)) {
              this.questionBuffer.push(NO_QUESTION_LEFT);
            }
            return;
          }
          result.data.questions.forEach((q) => {
            if (!this.seenInsightIds.has(q.insight_id)) {
              this.questionBuffer.push(q);
              this.seenInsightIds.add(q.insight_id);
            }
          });
          if (result.data.questions.length < count) {
            if (!this.questionBuffer.includes(NO_QUESTION_LEFT)) {
              this.questionBuffer.push(NO_QUESTION_LEFT);
            }
          }
          if (this.currentQuestion === null) {
            this.updateCurrentQuestion();
          }
        });
    },
  },
  computed: {
    availableInsightTypes: function () {
      return Object.keys(insightTypesNames);
    },
    currentQuestionImageUrl: function () {
      if (this.currentQuestion.source_image_url) {
        return this.currentQuestion.source_image_url;
      }
      return "https://static.openfoodfacts.org/images/image-placeholder.png";
    },
    imageRotationClassName: function () {
      if (this.imageRotation === 90) return "rotate-90";
      if (this.imageRotation === 180) return "rotate-180";
      if (this.imageRotation === 270) return "rotate-270";
      return "rotation-0";
    },
    loading: function () {
      return !this.noRemainingQuestion && this.currentQuestion == null;
    },
    noRemainingQuestion: function () {
      return (
        this.questionBuffer.length == 1 &&
        this.questionBuffer[0] === NO_QUESTION_LEFT
      );
    },
    currentQuestionBarcode: function () {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT
      ) {
        return this.currentQuestion.barcode;
      } else {
        return null;
      }
    },
    valueTagQuestionsURL: function () {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT &&
        this.selectedInsightType === "brand"
      ) {
        const urlParams = new URLSearchParams();
        urlParams.append("type", this.selectedInsightType);
        urlParams.append(
          "value_tag",
          reformatValueTag(this.currentQuestion.value)
        );
        return `/questions?${urlParams.toString()}`;
      }
      return "";
    },
  },
  mounted() {
    this.updateInsightTypeUrlParam();
    this.loadQuestions();
    const vm = this;
    window.addEventListener("keyup", function (event) {
      if (event.target.nodeName == "BODY") {
        if (event.key === "k") vm.annotate(-1);
        if (event.key === "n") vm.annotate(0);
        if (event.key === "o") vm.annotate(1);
        if (event.key === "p") vm.rotateImage();
      }
    });
  },
};
</script>

<style scoped>
#value-tag-input {
  width: 300px;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
}

.tag {
  background-color: #e8e8e8;
  display: inline-block;
  position: relative;
  padding: 1em 1.5em;
  margin: 0.3em 0.15em;
  line-height: 1;
  border-radius: 10px;
  cursor: pointer;
}

.tag.selected {
  background-color: #35689d;
  color: #ffffff;
}

button.annotate {
  padding: 2rem 2.5rem;
}

.flex-center {
  display: flex;
  justify-content: center;
}

.insight-column {
  text-align: center;
}

.annotation-column {
  background-color: #686868;
}

.rotate-0 {
  transform: none;
}

.rotate-90 {
  transform: rotate(90deg);
}

.rotate-180 {
  transform: rotate(180deg);
}

.rotate-270 {
  transform: rotate(270deg);
}
</style>
