<template>
  <div class="root">
    <div>
      <div class="ui label blue large">
        {{ $t("questions." + value.selectedInsightType) }}
      </div>
      <div v-if="value.valueTag" class="ui label large">
        value: {{ value.valueTag
        }}<i class="icon close" @click="removeFilter('valueTag')"></i>
      </div>
      <div v-if="value.countryFilter" class="ui label large">
        country: {{ value.countryFilter
        }}<i class="icon close" @click="removeFilter('countryFilter')"></i>
      </div>
      <div v-if="value.brandFilter" class="ui label large">
        brand: {{ value.brandFilter
        }}<i class="icon close" @click="removeFilter('brandFilter')"></i>
      </div>
      <div v-if="value.sortByPopularity" class="ui label large">
        popularity<i
          class="icon close"
          @click="removeFilter('sortByPopularity')"
        ></i>
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
import { setURLParams } from "../../utils";
import { countryNames, insightTypesNames, key2urlParam } from "./const";

export default {
  props: ["value"],
  data() {
    return {
      availableInsightTypes: insightTypesNames,
      countryNames,
      formIsClose: true,
      formValues: {},
    };
  },
  mounted() {
    this.formValues = { ...this.$props.value };
    this.updateURLParams(this.formValues);
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

    updateURLParams: function(params) {
      const urlParams = {};
      Object.keys(params).forEach((key) => {
        const value =
          key === "sortByPopularity"
            ? params.sortByPopularity || ""
            : params[key];
        urlParams[key2urlParam[key]] = value;
      });

      setURLParams(urlParams);
    },
    validateForm: function() {
      this.$emit("input", { ...this.formValues });
      this.updateURLParams(this.formValues);

      this.closeForm();
    },
    resetForm: function() {
      this.formValues = { ...this.$props.value };

      this.closeForm();
    },
    removeFilter: function(filterKey) {
      this.formValues = {
        ...this.formValues,
        [filterKey]: filterKey === "sortByPopularity" ? false : "",
      };
      this.$emit("input", {
        ...this.$props.value,
        [filterKey]: filterKey === "sortByPopularity" ? false : "",
      });
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
