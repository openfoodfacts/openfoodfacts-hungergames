<template>
  <div class="root">
    <div>
      <sui-dropdown
        class="ui label blue large"
        :text="$t('questions.' + value.selectedInsightType)"
      >
        <sui-dropdown-menu>
          <sui-dropdown-item
            v-for="insightType of availableInsightTypes"
            :key="insightType"
            @click="selectDirectlyInsightType(insightType)"
            >{{ $t("questions." + insightType) }}</sui-dropdown-item
          >
        </sui-dropdown-menu>
      </sui-dropdown>

      <div v-if="value.valueTag" class="ui label large">
        {{ $t("questions.filters.short_label.value") }}: {{ value.valueTag
        }}<i class="icon close" @click="removeFilter('valueTag')"></i>
      </div>
      <div v-if="value.countryFilter" class="ui label large">
        {{ $t("questions.filters.short_label.country") }}:
        {{ value.countryFilter
        }}<i class="icon close" @click="removeFilter('countryFilter')"></i>
      </div>
      <div v-if="value.brandFilter" class="ui label large">
        {{ $t("questions.filters.short_label.brand") }}: {{ value.brandFilter
        }}<i class="icon close" @click="removeFilter('brandFilter')"></i>
      </div>
      <div v-if="value.sortByPopularity" class="ui label large">
        {{ $t("questions.filters.short_label.popularity")
        }}<i class="icon close" @click="removeFilter('sortByPopularity')"></i>
      </div>
    </div>
    <div v-if="formIsClose" class="openForm">
      <button class="ui button" @click="openForm">
        <i class="icon edit" />{{ $t("questions.filters.actions.edit") }}
      </button>
    </div>
    <div v-else>
      <div class="ui divider" />
      <div class="ui form styled">
        <div class="field">
          <label>{{ $t("questions.filters.long_label.type") }}</label>
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
          <label>{{ $t("questions.filters.long_label.value") }}</label>
          <div class="ui icon input ">
            <input
              :placeholder="$t('questions.filters.placeholders.value')"
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
          <label>{{ $t("questions.filters.long_label.country") }}</label>
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
          <label>{{ $t("questions.filters.long_label.brand") }}</label>
          <sui-dropdown
            :options="populateBrandFilter ? brands : []"
            v-model="formValues.brandFilter"
            :text="$t('questions.filters.placeholders.brand')"
            search
            fluid
            selection
            v-on:filtered="setPopulateBrandFilter"
          />
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
          <button class="ui button" @click="resetForm">
            {{ $t("questions.actions.filters.cancel") }}
          </button>
          <button class="ui primary button" @click="validateForm">
            {{ $t("questions.actions.filters.apply") }}
          </button>
        </div>
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
      brands: undefined,
      populateBrandFilter: false,
    };
  },
  mounted() {
    this.formValues = { ...this.$props.value };
    this.updateURLParams(this.formValues);
  },
  methods: {
    openForm: function() {
      this.formIsClose = false;
      this.loadBrands();
    },
    closeForm: function() {
      this.formIsClose = true;
      this.populateBrandFilter = false;
    },
    selectInsightType: function(insightType) {
      this.formValues.selectedInsightType = insightType;
    },
    selectDirectlyInsightType: function(insightType) {
      if (this.$props.value.selectedInsightType !== insightType) {
        this.formValues.selectedInsightType = insightType;
        this.formValues.valueTag = "";
        this.validateForm();
      }
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
    loadBrands: async function() {
      // Load list of brand when fields is acivated
      if (this.brands === undefined) {
        this.brands = []; // set empty list to avoid multiple trigge of the json loading
        const images = require.context("../../assets/", false, /\.json$/);
        this.brands = images("./brands.json").map((x) => ({
          text: x,
          value: x,
          key: x,
        }));
      }
    },
    setPopulateBrandFilter: function() {
      this.populateBrandFilter = true;
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
