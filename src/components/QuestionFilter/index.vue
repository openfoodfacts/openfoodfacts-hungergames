<template>
  <div class="root">
    <div>
      <div class="ui label blue large">
        {{ $t("questions." + usedValues.selectedInsightType) }}
      </div>
      <div v-if="usedValues.valueTag" class="ui label large">
        value: {{ usedValues.valueTag
        }}<i class="icon close" @click="reset('valueTag')"></i>
      </div>
      <div v-if="usedValues.countryFilter" class="ui label large">
        country: {{ usedValues.countryFilter
        }}<i class="icon close" @click="reset('countryFilter')"></i>
      </div>
      <div v-if="usedValues.brandFilter" class="ui label large">
        brand: {{ usedValues.brandFilter
        }}<i class="icon close" @click="reset('brandFilter')"></i>
      </div>
      <div v-if="usedValues.sortByPopularity" class="ui label large">
        popularity<i class="icon close" @click="reset('sortByPopularity')"></i>
      </div>
    </div>
    <div v-if="formIsClose" class="openForm">
      <button class="ui button" @click="openForm">
        <i class="icon edit" />Edit Filters
      </button>
    </div>
    <div v-else>
      <div class="ui divider" />
      <div class="ui form styled">
        <div class="field">
          <label>Question Type</label>
          <button
            class="ui button"
            :class="{
              primary: insightType === formValues.selectedInsightType,
            }"
            v-for="insightType of availableInsightTypes"
            :key="insightType"
            @click="selectInsightType(insightType)"
          >
            {{ $t("questions." + insightType) }}
          </button>
        </div>

        <div class="ui field">
          <label>Proposed Value</label>
          <div class="ui icon input ">
            <input
              :placeholder="$t('questions.value_search')"
              v-model="formValues.valueTag"
            />
            <i
              @click="clearFormField('valueTag')"
              v-if="formValues.valueTag"
              class="times link icon"
            ></i>
          </div>
        </div>

        <div class="ui field">
          <label>Country</label>
          <select class="ui fluid dropdown" v-model="formValues.countryFilter">
            <option value="">World</option>
            <option
              :value="country"
              v-for="country in countryNames"
              :key="country"
              >{{ country.slice(3) }}</option
            >
          </select>
        </div>

        <div class="field">
          <label>Brand</label>
          <div class="ui icon input ">
            <input
              :placeholder="$t('questions.brand_search')"
              v-model="formValues.brandFilter"
            />
            <i
              @click="clearFormField('brandFilter')"
              v-if="formValues.brandFilter"
              class="times link icon"
            ></i>
          </div>
        </div>
      </div>

      <div class="ui segment">
        <div class="field">
          <div class="ui toggle checkbox">
            <input
              v-model="formValues.sortByPopularity"
              type="checkbox"
              name="sortBy"
            />
            <label>{{ $t("questions.popularity_sort") }}</label>
          </div>
        </div>
      </div>
      <div class="ui actions">
        <button class="ui button" @click="resetForm">Cancel</button>
        <button class="ui primary button" @click="validateForm">
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import robotoffService from "../../robotoff";
import { NO_QUESTION_LEFT } from "../../const";
import { setURLParams, getURLParam } from "../../utils";
import { getInitialInsightType } from "./filterHelpers";
import { countryNames, insightTypesNames, key2urlParam } from "./const";

export default {
  props: ["value"],
  data() {
    const initialInsightType = getInitialInsightType();

    return {
      availableInsightTypes: insightTypesNames,
      seenInsightIds: new Set(),
      countryNames,
      cancelTimeout: null,
      formIsClose: true,
      formValues: {
        valueTag: getURLParam("value_tag"),
        brandFilter: getURLParam("brand"),
        countryFilter: getURLParam("country"),
        selectedInsightType: initialInsightType,
        sortByPopularity: !!getURLParam("sorted"),
      },
      usedValues: {
        valueTag: getURLParam("value_tag"),
        brandFilter: getURLParam("brand"),
        countryFilter: getURLParam("country"),
        selectedInsightType: initialInsightType,
        sortByPopularity: !!getURLParam("sorted"),
      },
    };
  },

  mounted() {
    this.loadQuestions();
  },
  computed: {
    needToFetchNewInsights: function() {
      return (
        this.$props.value.length < 5 &&
        !this.$props.value.includes(NO_QUESTION_LEFT)
      );
    },
  },
  watch: {
    usedValues(newValues) {
      const urlParams = {};
      Object.keys(newValues).forEach((key) => {
        const value =
          key === "sortByPopularity"
            ? newValues.sortByPopularity || ""
            : newValues[key];
        urlParams[key2urlParam[key]] = value;
      });

      setURLParams(urlParams);
    },
    needToFetchNewInsights() {
      if (this.needToFetchNewInsights) {
        this.loadQuestions();
      }
    },
  },
  methods: {
    openForm: function() {
      this.formIsClose = false;
    },
    closeForm: function() {
      this.formIsClose = true;
    },
    selectInsightType: function(insightType) {
      this.formValues.selectedInsightType = insightType;
    },
    clearFormField: function(key) {
      this.formValues[key] = "";
    },
    loadQuestions: function(clean = false) {
      const sortBy = this.usedValues.sortByPopularity ? "popular" : "random";
      const count = 10;
      robotoffService
        .questions(
          sortBy,
          this.usedValues.selectedInsightType,
          this.usedValues.valueTag,
          this.usedValues.brandFilter,
          this.usedValues.countryFilter !== "en:world"
            ? this.usedValues.countryFilter
            : null,
          count
        )
        .then((result) => {
          console.log({ result, props: this.$props.value });
          const remainingQuestionCount = result.data.count;
          this.$emit("updateRemainingQuestionCount", remainingQuestionCount);

          if (result.data.questions.length == 0) {
            if (!this.$props.value.includes(NO_QUESTION_LEFT)) {
              if (clean) {
                this.$emit("input", [NO_QUESTION_LEFT]);
              } else {
                this.$emit("input", [...this.$props.value, NO_QUESTION_LEFT]);
              }
            }
            return;
          }
          const dataToAdd = [];
          result.data.questions.forEach((q) => {
            if (!this.seenInsightIds.has(q.insight_id)) {
              dataToAdd.push(q);
              this.seenInsightIds.add(q.insight_id);
            }
          });
          if (
            result.data.questions.length < count &&
            (clean || !this.$props.value.includes(NO_QUESTION_LEFT))
          ) {
            dataToAdd.push(NO_QUESTION_LEFT);
          }
          if (clean) {
            this.$emit("input", [...dataToAdd]);
          } else {
            this.$emit("input", [...this.$props.value, ...dataToAdd]);
          }
        });
    },
    validateForm: function() {
      this.usedValues = { ...this.formValues }; // replace filter data by form data
      this.$emit("input", []);
      this.loadQuestions(true);
      this.closeForm();
    },
    resetForm: function() {
      this.formValues = { ...this.usedValues };

      this.closeForm();
    },
    reset: function(key) {
      clearTimeout(this.cancelTimeout);

      this.usedValues = {
        ...this.usedValues,
        [key]: key === "sortByPopularity" ? false : "",
      };
      this.formValues = {
        ...this.formValues,
        [key]: key === "sortByPopularity" ? false : "",
      };

      this.$emit("input", []);
      this.cancelTimeout = setTimeout(() => {
        this.loadQuestions(true);
      }, 1000);
    },
  },
};
</script>

<style scoped>
.root {
  text-align: start;
}
.openForm {
  width: 100%;
  text-align: center;
}
</style>
