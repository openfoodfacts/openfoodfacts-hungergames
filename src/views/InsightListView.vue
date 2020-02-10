<template>
  <div class="ui container">
    <div>
      <h2>Insights</h2>
      <div class="ui form">
        <div class="fields">
          <div class="field">
            <label>Barcode</label>
            <input placeholder="Barcode" v-model="barcodeFilter" />
          </div>
          <div class="field">
            <label>Value tag</label>
            <input type="text" placeholder="ex: en:mueslis, bjorg,..." v-model="valueTagFilter" />
          </div>
          <div class="field">
            <label>Type</label>
            <select class="ui search dropdown" v-model="insightTypeFilter">
              <option value>All</option>
              <option value="label">Label</option>
              <option value="product_weight">Product weight</option>
              <option value="category">Category</option>
              <option value="expiration_date">Expiration date</option>
              <option value="packager_code">Packager code</option>
            </select>
          </div>
          <div class="field">
            <label>Annotated</label>
            <select class="ui search dropdown" v-model="annotationFilter">
              <option value>All</option>
              <option value="-1">Skipped (-1)</option>
              <option value="0">Rejected (0)</option>
              <option value="1">Accepted (1)</option>
              <option value="not_annotated">Not annotated</option>
            </select>
          </div>
        </div>
        <input class="ui submit button primary" type="submit" value="Search" @click="loadInsights" />
      </div>
      <div class="ui divider" />
      <p>
        <strong>Count:</strong>
        {{ resultCount }}
      </p>
    </div>
    <table class="ui celled table">
      <thead>
        <tr>
          <th>Barcode</th>
          <th>Id</th>
          <th>Type</th>
          <th>Value</th>
          <th>Created at</th>
          <th>Completed at</th>
          <th>Annotation</th>
          <th>Automatic</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="insight in insights" :key="insight.id">
          <td data-label="Barcode">{{ insight.barcode }}</td>
          <td data-label="Id">{{ insight.id }}</td>
          <td data-label="Type">{{ insight.type }}</td>
          <td data-label="Value">{{ insight.value || insight.value_tag }}</td>
          <td data-label="Created at">{{ formatDatetime(insight.timestamp) }}</td>
          <td data-label="Completed at">{{ formatDatetime(insight.completed_at) }}</td>
          <td data-label="Annotation">
            <i v-if="insight.annotation == 1" class="large green checkmark icon"></i>
            <i v-else-if="insight.annotation == 0" class="large red times icon"></i>
            <i v-else-if="insight.annotation == -1" class="large grey question icon"></i>
          </td>
          <td data-label="Automatic">
            <input type="checkbox" :checked="insight.automatic_processing" disabled />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="resultCount">
      <pagination v-model="currentPage" :page-count="pageCount" v-on:change="updatedPage"></pagination>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL } from "../const";
import Pagination from "../components/Pagination";

export default {
  name: "InsightListView",
  components: { Pagination },
  data: function() {
    return {
      currentPage: 1,
      insights: [],
      pageSize: 25,
      resultCount: 0,
      barcodeFilter: "",
      insightTypeFilter: "",
      annotationFilter: "",
      valueTagFilter: ""
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
    }
  },
  methods: {
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
      const params = {
        page: this.currentPage,
        count: this.pageSize
      };

      if (this.barcodeFilter.length) {
        params.barcode = this.barcodeFilter;
      }
      if (this.insightTypeFilter.length) {
        params.insight_types = this.insightTypeFilter;
      }
      if (this.valueTagFilter.length) {
        params.value_tag = this.valueTagFilter;
      }

      if (this.annotationFilter.length) {
        if (this.annotationFilter == "not_annotated") {
          params.annotated = "0";
        } else {
          params.annotation = this.annotationFilter;
        }
      }
      axios.get(`${ROBOTOFF_API_URL}/insights`, { params }).then(result => {
        this.insights = result.data.insights;
        this.resultCount = result.data.count;
      });
    }
  },
  mounted() {
    this.loadInsights();
  }
};
</script>
