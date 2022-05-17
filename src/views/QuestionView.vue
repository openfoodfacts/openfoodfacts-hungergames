<template>
  <div class="ui grid stackable">
    <div class="five wide column centered">
      <div class="insight-column">
        <QuestionFilter v-model="filters" />
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
            <a :href="valueTagOFFURL" target="_blank">
              <div>
                {{ $t("questions.see_examples") }}
                {{ this.filters.selectedInsightType }}
              </div>
            </a>
          </div>
          <div v-else>
            <div class="ui big label">{{ currentQuestion.value }}</div>
          </div>
          <div class="ui divider hidden"></div>
          <cropper
            style="height: 300px; margin:auto"
            :src="currentQuestionImageUrl"
            :transitions="false"
            :canvas="false"
            :checkOrientation="false"
            :crossOrigine="false"
            :default-position="{
              left: 0,
              top: 0,
            }"
            :stencilSize="
              ({ boundaries }) => {
                return {
                  width: boundaries.width,
                  height: boundaries.height,
                };
              }
            "
            default-boundaries="fit"
            :stencil-props="{
              handlers: {},
              movable: false,
              resizable: false,
            }"
          />
          <div class="ui divider hidden"></div>
          <div>
            <button
              data-inverted
              data-tooltip="Shortcut: N"
              class="ui big negative button annotate"
              @click="annotate(0)"
            >
              <i class="trash icon"></i>
              {{ $t("questions.no") }}
            </button>
            <button
              data-inverted
              data-tooltip="Shortcut: K"
              class="ui big button annotate"
              @click="annotate(-1)"
            >
              <i class="question icon"></i>
              {{ $t("questions.skip") }}
            </button>
            <button
              data-inverted
              data-tooltip="Shortcut: O"
              class="ui big positive button annotate"
              @click="annotate(1)"
            >
              <i class="check icon"></i>
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
import { Cropper } from "vue-advanced-cropper";
import robotoffService from "../robotoff";
import { NO_QUESTION_LEFT, OFF_URL } from "../const";
import Product from "../components/Product";
import LoadingSpinner from "../components/LoadingSpinner";
import QuestionFilter from "../components/QuestionFilter/index";
import { getInitialFilterValues } from "../components/QuestionFilter/filterHelpers";

import AnnotationCounter from "../components/AnnotationCounter";

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
  components: {
    Product,
    AnnotationCounter,
    LoadingSpinner,
    Cropper,
    QuestionFilter,
  },
  data: function() {
    return {
      valueTagTimeout: null,
      questionBuffer: [],
      currentQuestion: null,
      remainingQuestionCount: 0,
      page: 1,
      lastAnnotations: [],
      sessionAnnotatedCount: 0,
      seenInsightIds: new Set(),
      filters: { ...getInitialFilterValues() },
    };
  },
  watch: {
    filters: {
      handler: function(newFilters, oldFilters) {
        if (
          oldFilters === null ||
          JSON.stringify(newFilters) !== JSON.stringify(oldFilters)
        ) {
          // when filters change reload questions
          this.loadQuestions(true);
        }
      },
      deep: true,
    },
    questionBuffer: function(newBuffer) {
      // update the current question
      if (
        this.questionBuffer.length > 0 &&
        this.questionBuffer[0] !== NO_QUESTION_LEFT
      ) {
        this.currentQuestion = this.questionBuffer[0];
      } else {
        this.currentQuestion = null;
      }

      // Fetch new questions to keep more than 9 questions in the buffer.
      // Also send request for buffer sizes 0, 1, 2, 3 In cas a network problem occured
      if (
        (newBuffer.length == 9 || newBuffer.length < 4) &&
        !newBuffer.includes(NO_QUESTION_LEFT)
      ) {
        this.loadQuestions(false);
      }
    },
  },
  methods: {
    loadQuestions: function(clean = false) {
      if (clean) {
        this.questionBuffer = [];
      }
      const sortBy = this.filters.sortByPopularity ? "popular" : "random";
      const count = 10;
      if (this.page < 1) {
        this.page = 1;
      }
      robotoffService
        .questions(
          sortBy,
          this.filters.selectedInsightType,
          this.filters.valueTag,
          reformatValueTag(this.filters.brandFilter),
          this.filters.countryFilter !== "en:world"
            ? this.filters.countryFilter
            : null,
          count,
          this.page
        )
        .then((result) => {
          this.remainingQuestionCount = result.data.count;
          if (this.remainingQuestionCount / count + 1 < this.page) {
            this.page = 1;
          }
          const dataToAdd = [];
          result.data.questions.forEach((q) => {
            if (!this.seenInsightIds.has(q.insight_id)) {
              dataToAdd.push(q);
              this.seenInsightIds.add(q.insight_id);
            }
          });
          if (
            result.data.count < count &&
            (clean || !this.questionBuffer.includes(NO_QUESTION_LEFT))
          ) {
            dataToAdd.push(NO_QUESTION_LEFT);
          }
          if (this.page == Math.ceil(this.remainingQuestionCount / count)) {
            if (!this.questionBuffer.includes(NO_QUESTION_LEFT)) {
              if (clean) {
                this.questionBuffer = [NO_QUESTION_LEFT];
              } else {
                this.questionBuffer = [...this.questionBuffer, ...dataToAdd];
                this.questionBuffer = [
                  ...this.questionBuffer,
                  NO_QUESTION_LEFT,
                ];
              }
            }
            return;
          }
          if (clean) {
            this.questionBuffer = [...dataToAdd];
          } else {
            this.questionBuffer = [...this.questionBuffer, ...dataToAdd];
          }
        });
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
    annotate: function(annotation) {
      if (annotation !== -1) {
        robotoffService.annotate(this.currentQuestion.insight_id, annotation);
        this.updateLastAnnotations(this.currentQuestion, annotation);
        this.remainingQuestionCount -= 1;
        this.sessionAnnotatedCount += 1;
      }
      this.currentQuestion = null;
      this.questionBuffer = [...this.questionBuffer.slice(1)];
    },
    updateRemainingQuestionCount: function(newCount) {
      this.remainingQuestionCount = newCount;
    },
  },
  computed: {
    currentQuestionImageUrl: function() {
      if (this.currentQuestion.source_image_url) {
        return this.currentQuestion.source_image_url;
      }
      return "https://static.openfoodfacts.org/images/image-placeholder.png";
    },
    loading: function() {
      return !this.noRemainingQuestion && this.currentQuestion == null;
    },
    noRemainingQuestion: function() {
      return (
        this.questionBuffer.length === 1 &&
        this.questionBuffer[0] === NO_QUESTION_LEFT
      );
    },
    currentQuestionBarcode: function() {
      if (this.currentQuestion && this.currentQuestion !== NO_QUESTION_LEFT) {
        return this.currentQuestion.barcode;
      } else {
        return null;
      }
    },
    valueTagQuestionsURL: function() {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT &&
        this.currentQuestion.value_tag
      ) {
        const urlParams = new URLSearchParams();
        urlParams.append("type", this.filters.selectedInsightType);
        urlParams.append(
          "value_tag",
          reformatValueTag(this.currentQuestion.value_tag)
        );
        return `/questions?${urlParams.toString()}`;
      }
      return "";
    },
    valueTagOFFURL: function() {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT &&
        this.currentQuestion.value_tag
      ) {
        return `${OFF_URL}/${
          this.filters.selectedInsightType
        }/${reformatValueTag(this.currentQuestion.value_tag)}`;
      }
      return "";
    },
  },
  mounted() {
    const vm = this;
    this.loadQuestions();
    window.addEventListener("keyup", function(event) {
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
</style>
