<template>
  <div class="ui">
    <div v-if="loading"><LoadingSpinner show /></div>
    <div v-else-if="noRemainingQuestion">No more questions</div>
    <div v-else>
      <h3>
        {{ questions[0].question }}
        <!-- <img :src="questions[0].image_url" /> -->
        <span class="ui big label">{{ questions[0].value }}</span>
      </h3>
      <div class="ui grid stackable">
        <div
          class="ui"
          v-for="question in questions"
          :key="question.insight_id"
          @click="toggle(question.insight_id)"
          :class="{ selected: question.selected }"
        >
          <img :src="question.source_image_url" />
          <div v-if="question.selected" class="filter"></div>
        </div>
      </div>
      <button class="ui big positive button validateButton" @click="validate()">
        <i class="check icon"></i>
        {{ nbSelected }}
      </button>
    </div>
  </div>
</template>

<script>
import robotoffService from "../robotoff";
import LoadingSpinner from "../components/LoadingSpinner";

const NO_QUESTION_LEFT = "NO_QUESTION_LEFT";
const LOADING = "LOADING";

export default {
  name: "QuestionView",
  components: { LoadingSpinner },
  data: function() {
    return {
      status: LOADING,
      questions: [],
    };
  },
  methods: {
    validate() {
      this.questions.forEach(({ insight_id, selected }) => {
        if (selected === true) {
          robotoffService.annotate(insight_id, 1);
        }
      });
      this.questions = [];
      this.fetchNewQuestions();
    },
    toggle(insight_id) {
      this.questions = this.questions.map((x) =>
        x.insight_id === insight_id ? { ...x, selected: !x.selected } : x
      );
    },
    fetchNewQuestions() {
      this.status = LOADING;
      const count = 100;
      robotoffService
        .questions("random", "label", "en:eu-organic", null, null, count)
        .then((result) => {
          if (result.data.questions.length == 0) {
            this.status = NO_QUESTION_LEFT;
            return;
          }
          const refQuestion =
            this.questions.length > 0
              ? this.questions[0].question
              : result.data.questions[0].question;
          const refValue =
            this.questions.length > 0
              ? this.questions[0].value
              : result.data.questions[0].value;
          const indsighIdAlreadyInQuestions = this.questions.map(
            ({ insight_id }) => insight_id
          );

          this.questions = [
            ...this.questions,
            ...result.data.questions.filter(
              ({ insight_id, question, value }) =>
                !indsighIdAlreadyInQuestions.includes(insight_id) &&
                refValue === value &&
                refQuestion === question
            ),
          ];
          this.status = "done";
        });
    },
  },
  computed: {
    loading: function() {
      return this.status === LOADING && this.questions.length === 0;
    },
    noRemainingQuestion: function() {
      return this.status === NO_QUESTION_LEFT;
    },
    nbSelected: function() {
      return this.questions.filter((x) => x.selected === true).length;
    },
  },
  mounted() {
    this.fetchNewQuestions();
  },
};
</script>

<style scoped>
.filter {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 255, 0, 0.3);
}
h3 {
  margin-bottom: 4rem;
  text-align: center;
}
.selected {
  position: relative;
}
.selected img {
  filter: url("#teal-lightgreen");
  border: solid green 5px;
}
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
}
.header {
  color: black;
  font-size: 1.5rem;
  padding: 0 0 1rem 0.5rem;
}
.card {
  width: 300px;
  height: 350px;
}
.image {
  text-align: center;
  height: 300px;
  width: 300px;
  position: relative;
}
img {
  max-height: 100%;
  max-width: 100%;
  height: 300px;
  width: 300px;
}
.validateButton {
  position: fixed;
  right: 50px;
  bottom: 50px;
}
</style>
