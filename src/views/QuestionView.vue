<template>
  <div class="ui grid stackable">
    <div class="five wide column centered">
      <div class="insight-column">
        <QuestionFilter
          v-model="questionBuffer"
          v-on:updateRemainingQuestionCount="updateRemainingQuestionCount"
        />
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
          <cropper
            style="height: 300px; margin:auto"
            :src="currentQuestionImageUrl"
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
import { NO_QUESTION_LEFT } from "../const";
import Product from "../components/Product";
import LoadingSpinner from "../components/LoadingSpinner";
import QuestionFilter from "../components/QuestionFilter/index";

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
      currentQuestion: null,
      questionBuffer: [],
      remainingQuestionCount: 0,
      lastAnnotations: [],
      sessionAnnotatedCount: 0,
      seenInsightIds: new Set(),
    };
  },
  watch: {
    questionBuffer: function(newBuffer) {
      if (newBuffer.length > 0 && newBuffer[0] !== NO_QUESTION_LEFT) {
        this.currentQuestion = newBuffer[0];
      } else {
        this.currentQuestion = null;
      }
    },
  },
  methods: {
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
    const vm = this;
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
