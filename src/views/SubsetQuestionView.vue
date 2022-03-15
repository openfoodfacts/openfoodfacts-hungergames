<template>
  <div class="ui grid stackable">
    <div class="five wide column centered">
      <div class="insight-column">
        <QuestionFilter v-model="filters" />
        <div class="ui divider" />
        <div class="ui hidden divider"></div>
        <div v-if="currentQuestion">
          <h3>{{ currentQuestion.question }}</h3>
          <div>
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
        :remainingCount="productIds.length"
        :lastAnnotations="lastAnnotations"
        :sessionAnnotatedCount="sessionAnnotatedCount"
      />
    </div>
  </div>
</template>

<script>
import { Cropper } from "vue-advanced-cropper";
import robotoffService from "../robotoff";
import { NO_QUESTION_LEFT, IS_DEVELOPMENT_MODE } from "../const";
import Product from "../components/Product";
import LoadingSpinner from "../components/LoadingSpinner";
import AnnotationCounter from "../components/AnnotationCounter";
import productIds from "./questions.js";

export default {
  name: "QuestionView",
  components: {
    Product,
    AnnotationCounter,
    LoadingSpinner,
    Cropper,
  },
  data: function() {
    return {
      valueTagTimeout: null,
      questionBuffer: [],
      currentQuestion: null,
      remainingQuestionCount: productIds.length,
      lastAnnotations: [],
      sessionAnnotatedCount: 0,
      seenInsightIds: new Set(),
      productIds,
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
    loadQuestions: async function(clean = false) {
      if (clean) {
        this.questionBuffer = [];
      }
      console.log("loadQuestions");
      while (this.productIds.length > 0 && this.questionBuffer < 5) {
        const productIndex = Math.floor(this.productIds.length * Math.random());
        const [code] = this.productIds.splice(productIndex, 1);

        const result = await robotoffService.questionsByProductCode(code);
        console.log(result);
        this.remainingQuestionCount = result.data.count;

        const dataToAdd = [];
        result.data.questions.forEach((q) => {
          if (!this.seenInsightIds.has(q.insight_id)) {
            dataToAdd.push(q);
            this.seenInsightIds.add(q.insight_id);
          }
        });
        this.questionBuffer = [...this.questionBuffer, ...dataToAdd];
      }

      if (this.questionBuffer.length === 0 && this.productIds.length === 0) {
        this.questionBuffer = [NO_QUESTION_LEFT];
      }
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
        if(IS_DEVELOPMENT_MODE){
          console.log(this.currentQuestion.insight_id, annotation)
        } else {
          robotoffService.annotate(this.currentQuestion.insight_id, annotation);
        }
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
