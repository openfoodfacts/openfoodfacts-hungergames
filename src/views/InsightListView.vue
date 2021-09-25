<template>
  <div class="ui container">
    <div>
      <h2>{{ $t("insights.insights") }}</h2>
      <form class="ui stackable form">
        <div class="two fields">
          <div class="field">
            <label>{{ $t("insights.barcode") }}</label>
            <input
              :placeholder="$t('insights.barcode_placeholder')"
              v-model="barcodeFilter"
            />
          </div>
          <div class="field">
            <label>{{ $t("insights.value_tag") }}</label>
            <input
              type="text"
              :placeholder="$t('insights.value_placeholder')"
              v-model="valueTagFilter"
            />
          </div>
        </div>
        <div class="two fields">
          <div class="field">
            <label>{{ $t("insights.type") }}</label>
            <select class="ui search dropdown" v-model="insightTypeFilter">
              <option value>{{ $t("insights.all") }}</option>
              <option value="label">{{ $t("insights.label") }}</option>
              <option value="product_weight">{{
                $t("insights.product_weight")
              }}</option>
              <option value="category">{{ $t("insights.category") }}</option>
              <option value="expiration_date">{{
                $t("insights.expiration_date")
              }}</option>
              <option value="packager_code">{{
                $t("insights.packager_code")
              }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t("insights.annotated") }}</label>
            <select class="ui search dropdown" v-model="annotationFilter">
              <option value>{{ $t("insights.all") }}</option>
              <option value="-1">{{ $t("insights.skipped") }}</option>
              <option value="0">{{ $t("insights.rejected") }}</option>
              <option value="1">{{ $t("insights.accepted") }}</option>
              <option value="not_annotated">{{
                $t("insights.not_annotated")
              }}</option>
            </select>
          </div>
        </div>
        <input
          class="ui submit button primary"
          type="submit"
          :value="$t('insights.search')"
          @click.prevent="loadInsights"
        />
      </form>
      <div class="ui divider" />
      <p v-if="!loading">
        <strong>{{ $t("insights.count") }}</strong>
        {{ resultCount }}
      </p>
    </div>
    <LoadingSpinner :show="loading" />
    <table class="ui celled table" v-if="!loading">
      <thead class="mobile hidden">
        <tr>
          <th>{{ $t("insights.barcode") }}</th>
          <th>{{ $t("insights.id") }}</th>
          <th>{{ $t("insights.type") }}</th>
          <th>{{ $t("insights.value") }}</th>
          <th>{{ $t("insights.created_at") }}</th>
          <th>{{ $t("insights.completed_at") }}</th>
          <th>{{ $t("insights.annotation") }}</th>
          <th>{{ $t("insights.automatic") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="insight in insights" :key="insight.id">
          <td data-label="Barcode">
            <span class="mobile only list__label"
              >{{ $t("insights.barcode") }} </span
            ><a href="#" @click="filterBarcode(insight.barcode)">{{
              insight.barcode
            }}</a
            ><a target="_blank" :href="getProductUrl(insight.barcode)"
              ><i class="large icon eye link_icon"/></a
            ><a target="_blank" :href="getProductEditUrl(insight.barcode)"
              ><i class="large icon edit link_icon"
            /></a>
          </td>
          <td data-label="Id">
            <span class="mobile only list__label">{{ $t("insights.id") }} </span
            >{{ insight.id }}
          </td>
          <td data-label="Type">
            <span class="mobile only list__label"
              >{{ $t("insights.type") }} </span
            >{{ insight.type }}
          </td>
          <td data-label="Value">
            <span class="mobile only list__label"
              >{{ $t("insights.value") }} </span
            >{{ insight.value || insight.value_tag }}
            <a
              target="_blank"
              :href="getQuestionUrl(insight.type, insight.value_tag)"
              v-if="getQuestionUrl(insight.type, insight.value_tag)"
              ><i class="large icon external alternate link_icon"
            /></a>
          </td>
          <td data-label="Created at">
            <span class="mobile only list__label"
              >{{ $t("insights.created_at") }} </span
            >{{ formatDatetime(insight.timestamp) }}
          </td>
          <td data-label="Completed at">
            <span class="mobile only list__label"
              >{{ $t("insights.completed_at") }} </span
            >{{ formatDatetime(insight.completed_at) }}
          </td>
          <td data-label="Annotation">
            <span class="mobile only list__label"
              >{{ $t("insights.annotation") }}
            </span>
            <i
              v-if="insight.annotation == 1"
              class="large green checkmark icon"
            ></i>
            <i
              v-else-if="insight.annotation == 0"
              class="large red times icon"
            ></i>
            <i
              v-else-if="insight.annotation == -1"
              class="large grey question icon"
            ></i>
          </td>
          <td data-label="Automatic">
            <span class="mobile only list__label"
              >{{ $t("insights.automatic") }}
            </span>
            <i
              v-if="insight.automatic_processing"
              class="large green checkmark icon"
            ></i>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="resultCount">
      <pagination
        v-model="currentPage"
        :page-count="pageCount"
        v-on:change="updatedPage"
      ></pagination>
    </div>
  </div>
</template>

<script>
import robotoffService from "../robotoff";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { getURLParam } from "../utils";
import offService from "../off";

export default {
  name: "InsightListView",
  components: { Pagination, LoadingSpinner },
  data: function() {
    return {
      currentPage: 1,
      insights: [],
      pageSize: 25,
      resultCount: 0,
      barcodeFilter: getURLParam("code"),
      insightTypeFilter: "",
      annotationFilter: "",
      valueTagFilter: "",
      loading: false,
    };
  },
  computed: {
    pageCount: function() {
      if (this.resultCount == 0) {
        return 0;
      }

      let count = Math.floor(this.resultCount / this.pageSize);
      if (this.resultCount % this.pageSize !== 0) {
        count += 1;
      }
      return count;
    },
  },
  methods: {
    getProductUrl: function(code) {
      if (!code) {
        return "";
      }
      return offService.getProductUrl(code);
    },
    getProductEditUrl: function(code) {
      if (!code) {
        return "";
      }
      return offService.getProductEditUrl(code);
    },
    getQuestionUrl: function(type, value_tag) {
      if (
        !value_tag ||
        !["category", "brand", "product_weight", "label"].includes(type)
      ) {
        return "";
      }
      return `https://hunger.openfoodfacts.org/questions?type=${type}&value_tag=${value_tag}`;
    },
    filterBarcode: function(code) {
      this.barcodeFilter = code;
      this.loadInsights();
    },
    formatDatetime: function(datetime) {
      if (!datetime) {
        return null;
      }
      return datetime.split(".")[0];
    },
    updatedPage: function() {
      this.loadInsights();
    },
    loadInsights: function() {
      this.loading = true;
      robotoffService
        .getInsights(
          this.barcodeFilter,
          this.insightTypeFilter,
          this.valueTagFilter,
          this.annotationFilter,
          this.currentPage,
          this.pageSize
        )
        .then((result) => {
          this.insights = result.data.insights;
          this.resultCount = result.data.count;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
  },
  mounted() {
    this.loadInsights();
  },
};
</script>
<style>
.list__label {
  font-weight: bold;
}
a > .link_icon {
  margin: 5px;
}
</style>
