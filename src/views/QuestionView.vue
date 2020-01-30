<template>
  <div class="ui grid stackable" style="margin-top: 20px;">
    <div class="eight wide column centered">
      <div class="insight-column">
        <div
          class="tag"
          :class="{selected: insightType === selectedInsightType}"
          v-for="insightType of availableInsightTypes"
          :key="insightType"
          @click="selectInsightType(insightType)"
        >{{ insightType }}</div>
        <div class="ui form">
          <input class="ui input" style="width: 300px" placeholder="value" v-model="valueTagInput" />
        </div>
        <div class="ui hidden divider"></div>
        <div v-if="currentQuestion">
          <h3>{{ currentQuestion.question }}</h3>
          <div class="ui big label">{{ currentQuestion.value }}</div>
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
    <div class="eight wide column centered">
      <Product :barcode="currentQuestionBarcode" />
    </div>
  </div>
</template>

<script>
import axios from "axios";
import subDomain from "../subdomain";
import { ROBOTOFF_API_URL } from "../const";
import { annotate as robotoffAnnotate } from "../robotoff";
import Product from "../components/Product";

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

export default {
  name: "QuestionView",
  components: { Product },
  data: function() {
    return {
      valueTag: "",
      valueTagInput: "",
      valueTagTimeout: null,
      currentQuestionBarcode: null,
      currentQuestion: null,
      questionBuffer: [],
      availableInsightTypes: availableInsightTypes,
      selectedInsightType: getRandomInsightType(),
      seenInsightIds: new Set(),
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
        return;
      }

      const valueTagInput = this.valueTagInput;

      this.valueTagTimeout = setTimeout(() => {
        this.valueTag = valueTagInput;
      }, 1000);
    },
    valueTag: function() {
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    currentQuestion: function() {
      if (
        this.currentQuestion !== null &&
        this.currentQuestion !== NO_QUESTION_LEFT
      ) {
        this.currentQuestionBarcode = this.currentQuestion.barcode;
      } else {
        this.currentQuestionBarcode = null;
      }
    }
  },
  methods: {
    selectInsightType: function(insightType) {
      this.selectedInsightType = insightType;
      this.currentQuestion = null;
      this.questionBuffer = [];
      this.loadQuestions();
    },
    annotate: function(annotation) {
      robotoffAnnotate(this.currentQuestion.insight_id, annotation);
      this.updateCurrentQuestion();

      if (this.questionBuffer.length <= 2) {
        this.loadQuestions();
      }
    },
    updateCurrentQuestion: function() {
      if (this.questionBuffer.length > 0) {
        this.currentQuestion = this.questionBuffer.shift();
      } else {
        if (this.noRemainingQuestion) {
          this.currentQuestion = null;
        } else {
          window.console.error(
            "question buffer is empty, cannot update current question!"
          );
        }
      }
    },
    loadQuestions: function() {
      const count = 3;
      const params = {
        lang: subDomain.languageCode,
        count,
        insight_types: this.selectedInsightType
      };

      if (this.valueTag) {
        params.value_tag = this.valueTag;
      }

      axios
        .get(`${ROBOTOFF_API_URL}/questions/random`, {
          params
        })
        .then(result => {
          if (result.data.questions.length == 0) {
            this.questionBuffer.push(NO_QUESTION_LEFT);
            return;
          }
          let added = false;
          result.data.questions.forEach(q => {
            if (!this.seenInsightIds.has(q.insight_id)) {
              this.questionBuffer.push(q);
              this.seenInsightIds.add(q.insight_id);
              added = true;
            }
          });
          if (!added && result.data.questions.length < count) {
            this.questionBuffer.push(NO_QUESTION_LEFT);
            return;
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
        this.questionBuffer[0] == NO_QUESTION_LEFT
      );
    }
  },
  mounted() {
    this.loadQuestions();
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
</style>