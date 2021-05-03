<template>
  <div class="container">
    <!--four wide column centered-->
    <div v-if="dataIsEmpty">
      <p v-if="loading">Loading ...</p>
      <p v-else>No remaining images</p>
    </div>
    <template v-else>
      <div class="categories">
        <sui-button
          v-for="category in availableCategories"
          :key="category"
          @click="toggleCategory(category)"
          :primary="selectedCategories.includes(category)"
          >{{ category }}</sui-button
        >
      </div>
      <table>
        <thead>
          <tr>
            <th>code</th>
            <th>link</th>
            <th>category</th>
            <th>
              <sui-button @click="removeProblems()" primary
                >Supprimer
              </sui-button>
            </th>
          </tr>
        </thead>
        <tr v-for="line in displayed" :key="line.code">
          <td>{{ line.code }}</td>
          <td>
            <a
              target="_blank"
              :href="productEditUrl(line.code)"
              class="ui button primary"
              >{{ $t("questions.view") }}</a
            >
          </td>
          <td>{{ line.info }}</td>
          <td>
            <sui-checkbox v-model="toRemove[line.code]" />
          </td>
        </tr>
      </table>
    </template>
  </div>
</template>

<script>
import axios from "axios";
import offService from "../off";

export default {
  name: "NutritionProblems",

  data: function() {
    return {
      loading: false,
      selectedCategories: [],
      availableCategories: [],
      data: [],
      toRemove: {},
      test: true,
    };
  },
  computed: {
    dataIsEmpty: function() {
      return this.data.length === 0;
    },
    displayed: function() {
      return this.data.filter(
        (product) =>
          this.selectedCategories.length === 0 ||
          this.selectedCategories.includes(product.info)
      );
    },
  },
  methods: {
    productEditUrl: function(code) {
      if (code === null) {
        return "";
      }
      return offService.getProductEditUrl(code);
    },
    toggleCategory: function(categoryId) {
      let index = this.selectedCategories.indexOf(categoryId);
      if (index < 0) {
        this.selectedCategories.push(categoryId);
      } else {
        while (index >= 0) {
          this.selectedCategories.splice(index, 1);
          index = this.selectedCategories.indexOf(categoryId);
        }
      }
    },
    removeProblems() {
      const toRemoveDisplayed = this.displayed
        .filter((problem) => this.toRemove[problem.code])
        .map((problem) => problem.code);
      console.log(this.toRemove);
      toRemoveDisplayed.forEach((code) => {
        axios.delete(`https://amathjourney.com/api/off/problem/${code}`);
      });

      this.data = [
        ...this.data.filter(({ code }) => !toRemoveDisplayed.includes(code)),
      ];
    },
    fetchData: async function() {
      this.loading = true;
      const { data: products } = await axios.get(
        "https://amathjourney.com/api/off/problem/"
      );
      this.data = [...products];
      const toAdd = {};
      products.forEach(({ code }) => {
        toAdd[code] = false;
      });

      this.toRemove = Object.assign({}, this.toRemove, {
        3760272470211: false,
      });

      this.data.forEach(({ info }) => {
        if (!this.availableCategories.includes(info)) {
          this.availableCategories.push(info);
        }
      });

      this.loading = false;
    },
  },
  mounted: function() {
    this.fetchData();
  },
};
</script>

<style scoped>
th,
td {
  border-bottom: 1px solid #ddd;
  padding: 0.5rem 1rem 0.5rem 0;
}
</style>
