<template>
  <div class="ui grid stackable">
    <div class="five wide column centered">
      <div class="insight-column">
        <div
          class="tag"
          :class="{selected: insightType === selectedInsightType}"
          v-for="insightType of availableInsightTypes"
          :key="insightType"
          @click="selectInsightType(insightType)"
        >{{ insightType }}</div>
        <div class="ui form">
          <input
            class="ui input"
            style="width: 300px; margin-top: 0.5rem;"
            placeholder="value (fanta, en:organic,...)"
            v-model="valueTagInput"
          />
          <div class="ui toggle checkbox" style="margin-top: 0.5rem;">
            <input v-model="sortByPopularity" type="checkbox" name="sortBy" />
            <label>Sort by popularity</label>
          </div>
        </div>
        <div class="ui divider" />
        <div class="ui hidden divider"></div>
        <div v-if="currentQuestion">
          <h3>{{ currentQuestion.question }}</h3>
          <a href target="_blank">
            <div class="ui big label">
              {{ currentQuestion.value }}
              <i
                style="margin-left: 0.5rem;"
                class="external alternate icon small blue"
              ></i>
            </div>
          </a>
          <div class="ui divider hidden"></div>
          <viewer :options="imageZoomOptions">
            <img
              :src="currentQuestion.source_image_url"
              style="max-height: 300px; max-width: 300px;"
            />
          </viewer>
          <div>
            <button class="ui button red annotate" @click="annotate(0)">No</button>
            <button class="ui button annotate" @click="annotate(-1)">Skip</button>
            <button class="ui button green annotate" @click="annotate(1)">Yes</button>
          </div>
        </div>
        <div class="flex-center" v-else style="margin-top: 100px;">
          <div class="loading-spinner" v-if="loading">
            <div class="loading-spinner-content">
              <div></div>
            </div>
          </div>
          <div v-if="noRemainingQuestion">
            <h2>No questions remaining</h2>
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
import axios from "axios";
import { localSettings } from "../settings";
import { ROBOTOFF_API_URL } from "../const";
import { annotate as robotoffAnnotate } from "../robotoff";
import Product from "../components/Product";
import AnnotationCounter from "../components/AnnotationCounter";

const updateURLParam = (key, value) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(key, value);
  const newRelativePathQuery =
    window.location.pathname + "?" + urlParams.toString();
  history.pushState(null, "", newRelativePathQuery);
};

const deleteURLParam = key => {
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

const getURLParam = key => {
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
  product_weight: "product weight"
};

const availableInsightTypes = Object.keys(insightTypesNames);
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
  à: "a",
  â: "a",
  é: "e",
  è: "e",
  ê: "e",
  î: "i",
  ô: "o",
  û: "u",
  ù: "u"
};

const reformatValueTag = value => {
  let output = value.trim().toLowerCase();
  for (const [search, replace] of Object.entries(reformatTagMapping)) {
    output = output.replace(new RegExp(search, "g"), replace);
  }
  return output;
};

export default {
  name: "QuestionView",
  components: { Product, AnnotationCounter },
  data: function() {
    return {
      valueTag: getURLParam("value_tag"),
      valueTagInput: getURLParam("value_tag"),
      valueTagTimeout: null,
      currentQuestion: null,
      questionBuffer: [],
      remainingQuestionCount: 0,
      lastAnnotations: [],
      sessionAnnotatedCount: 0,
      availableInsightTypes: availableInsightTypes,
      selectedInsightType: getInitialInsightType(),
      seenInsightIds: new Set(),
      sortByPopularity: false,
      brandFilter: getURLParam("brand"),
      countryFilter: getURLParam("country"),
      imageZoomOptions: {
        toolbar: {
          rotateLeft: 1,
          rotateRight: 1
        }
      }
    };
  },
  watch: {
    valueTagInput: function() {
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
    valueTag: function() {
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    sortByPopularity: function() {
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    selectedInsightType: function() {
      this.updateInsightTypeUrlParam();
    }
  },
  methods: {
    updateInsightTypeUrlParam() {
      updateURLParam("type", this.selectedInsightType);
    },
    updateLastAnnotations(question, annotation) {
      this.lastAnnotations.push({
        question,
        annotation
      });

      if (this.lastAnnotations.length > 10) {
        this.lastAnnotations.shift();
      }
    },
    selectInsightType: function(insightType) {
      this.selectedInsightType = insightType;
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    annotate: function(annotation) {
      robotoffAnnotate(this.currentQuestion.insight_id, annotation);
      this.updateLastAnnotations(this.currentQuestion, annotation);
      this.updateCurrentQuestion();
      this.remainingQuestionCount -= 1;
      this.sessionAnnotatedCount += 1;

      if (!this.noRemainingQuestion && this.questionBuffer.length <= 2) {
        this.loadQuestions();
      }
    },
    updateCurrentQuestion: function() {
      if (this.noRemainingQuestion) {
        this.currentQuestion = null;
        return;
      }
      if (this.questionBuffer.length > 0) {
        this.currentQuestion = this.questionBuffer.shift();
      } else {
        window.console.error(
          "question buffer is empty, cannot update current question!"
        );
      }
    },
    loadQuestions: function() {
      const count = 10;
      const lang = localSettings.fetch().lang || "en";
      const sortBy = this.sortByPopularity ? "popular" : "random";

      const params = {
        lang,
        count,
        insight_types: this.selectedInsightType
      };

      if (this.valueTag) {
        params.value_tag = this.valueTag;
      }

      if (this.brandFilter.length) {
        params.brands = this.brandFilter;
      }

      if (this.countryFilter.length) {
        params.country = this.countryFilter;
      }

      axios
        .get(`${ROBOTOFF_API_URL}/questions/${sortBy}`, {
          params
        })
        .then(result => {
          this.remainingQuestionCount = result.data.count;
          if (result.data.questions.length == 0) {
            if (!this.questionBuffer.includes(NO_QUESTION_LEFT)) {
              this.questionBuffer.push(NO_QUESTION_LEFT);
            }
            return;
          }
          result.data.questions.forEach(q => {
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
    }
  },
  computed: {
    loading: function() {
      return !this.noRemainingQuestion && this.currentQuestion == null;
    },
    noRemainingQuestion: function() {
      return (
        this.questionBuffer.length == 1 &&
        this.questionBuffer[0] === NO_QUESTION_LEFT
      );
    },
    currentQuestionBarcode: function() {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT
      ) {
        return this.currentQuestion.barcode;
      } else {
        return null;
      }
    },
    valueTagQuestionsURL: function() {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT
      ) {
        const urlParams = new URLSearchParams();
        urlParams.append("type", this.insightType);
        urlParams.append("value_tag", this.currentQuestion.value_tag);
        return `/questions?${urlParams.toString}`;
      }
      return "";
    }
  },
  mounted() {
    this.updateInsightTypeUrlParam();
    this.loadQuestions();
    const vm = this;
    window.addEventListener("keyup", function(event) {
      if (event.target.nodeName == "BODY") {
        if (event.which === 75) vm.annotate(-1); // k
        if (event.which === 78) vm.annotate(0); // n
        if (event.which === 79) vm.annotate(1); // o
      }
    });
  }
};
</script>

<style scoped>
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

@keyframes loading-spinner-content {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-spinner-content div {
  position: absolute;
  animation: loading-spinner-content 1s linear infinite;
  width: 80px;
  height: 80px;
  top: 10px;
  left: 10px;
  border-radius: 50%;
  box-shadow: 0 4px 0 0 #1d3f72;
  transform-origin: 40px 41px;
}
.loading-spinner {
  width: 100px;
  height: 100px;
  display: inline-block;
  overflow: hidden;
  background: #fff;
}
.loading-spinner-content {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
}
.loading-spinner-content div {
  box-sizing: content-box;
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
</style>