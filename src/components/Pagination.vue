<template>
  <ul class="pagination">
    <li class="pagination-item mobile hidden" v-if="paginationLabels.first">
      <button
        @click="first"
        :disabled="hasFirst"
        class="compact ui button"
        v-html="paginationLabels.first"
      ></button>
    </li>

    <li class="pagination-item mobile hidden" v-if="paginationLabels.prev">
      <button
        @click="prev"
        :disabled="hasFirst"
        class="compact ui button"
        v-html="paginationLabels.prev"
      ></button>
    </li>

    <li v-for="page in items" :key="page.label" class="pagination-item">
      <span v-if="page.disable">...</span>
      <button
        v-else
        @click="goto(page.label)"
        class="compact ui button"
        :class="`${page.active ? 'primary' : ''}`"
      >{{ page.label }}</button>
    </li>

    <li v-if="paginationLabels.next" class="pagination-item mobile hidden">
      <button
        @click="next"
        :disabled="hasLast"
        class="compact ui button"
        v-html="paginationLabels.next"
      ></button>
    </li>

    <li v-if="paginationLabels.last" class="pagination-item mobile hidden">
      <button
        @click="last"
        :disabled="hasLast"
        class="compact ui button"
        v-html="paginationLabels.last"
      ></button>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    value: {
      // current page
      type: Number,
      required: true
    },
    pageCount: {
      // page numbers
      type: Number,
      required: true
    },
    labels: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },

  data() {
    return {
      paginationLabels: {
        first: "&laquo;",
        prev: "&lsaquo;",
        next: "&rsaquo;",
        last: "&raquo;"
      }
    };
  },

  mounted() {
    if (this.value > this.pageCount) {
      this.$emit("input", this.pageCount);
    }
  },

  computed: {
    items() {
      let valPrev = this.value > 1 ? this.value - 1 : 1; // for easier navigation - gives one previous page
      let valNext =
        this.value < this.pageCount ? this.value + 1 : this.pageCount; // one next page
      let extraPrev = valPrev === 3 ? 2 : null;
      let extraNext =
        valNext === this.pageCount - 2 ? this.pageCount - 1 : null;
      let dotsBefore = valPrev > 3 ? 2 : null;
      let dotsAfter = valNext < this.pageCount - 2 ? this.pageCount - 1 : null;

      let output = [];

      for (let i = 1; i <= this.pageCount; i += 1) {
        if (
          [
            1,
            this.pageCount,
            this.value,
            valPrev,
            valNext,
            extraPrev,
            extraNext,
            dotsBefore,
            dotsAfter
          ].includes(i)
        ) {
          output.push({
            label: i,
            active: this.value === i,
            disable: [dotsBefore, dotsAfter].includes(i)
          });
        }
      }

      return output;
    },

    hasFirst() {
      return this.value === 1;
    },

    hasLast() {
      return this.value === this.pageCount;
    }
  },

  watch: {
    value: function() {
      this.$emit("change");
    }
  },

  methods: {
    first() {
      if (!this.hasFirst) {
        this.$emit("input", 1);
      }
    },

    prev() {
      if (!this.hasFirst) {
        this.$emit("input", this.value - 1);
      }
    },

    goto(page) {
      this.$emit("input", page);
    },

    next() {
      if (!this.hasLast) {
        this.$emit("input", this.value + 1);
      }
    },

    last() {
      if (!this.hasLast) {
        this.$emit("input", this.pageCount);
      }
    }
  }
};
</script>

<style scoped>
.pagination {
  padding-inline-start: 0;
  text-align: center;
}
.pagination-item {
  display: inline-block;
  list-style: none;
}
</style>
