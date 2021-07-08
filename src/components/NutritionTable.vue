<script>
export default {
  props: {
    value: Object,
    nutrimentToFillIndex: Number,
    selectLine: Boolean,
  },
  model: {
    prop: "value",
    event: "input",
  },
  computed: {
    sortedKeys: function() {
      return Object.keys(this.$props.value).sort(
        (a, b) => this.$props.value[a].y - this.$props.value[b].y
      );
    },
  },
  methods: {
    isInvalid(value) {
      return !value.match("^((<|>|<=|>=|~|.)*[0-9]+| *)$");
    },
    getNutrimentUnits(nutrimentId) {
      // TODO : allows more units such as micrograms, %, ...
      switch (nutrimentId) {
        case "nutriment_energy-kcal":
          return ["kcal"];
        case "nutriment_energy-kj":
          return ["kJ"];
        default:
          return ["g", "mg"];
        // { text: "g", value: "g" },
        // { text: "mg", value: "mg" },
      }
    },
    remove(nutritiveKey) {
      const { ...kept } = this.$props.value;
      delete kept[nutritiveKey];
      this.$emit("input", kept);
    },
    updateUnit(nutritiveKey) {
      return (event) => {
        this.$emit("input", {
          ...this.$props.value,
          [nutritiveKey]: {
            ...this.$props.value[nutritiveKey],
            ["unit"]: event.target.value,
          },
        });
      };
    },
    updateValue(nutritiveKey) {
      return (event) => {
        this.$emit("input", {
          ...this.$props.value,
          [nutritiveKey]: {
            ...this.$props.value[nutritiveKey],
            ["data"]: event.target.value,
          },
        });
      };
    },
    updateNutriIndexToFill(index) {
      if (this.$props.selectLine) {
        this.$emit("setNurtiIndex", index);
      }
    },
  },
};
</script>

<template>
  <sui-table celled definition>
    <sui-table-header>
      <sui-table-header-cell />
      <sui-table-header-cell>{{ $t("nutrition.value") }}</sui-table-header-cell>
    </sui-table-header>
    <sui-table-row
      v-for="(nutritiveKey, index) in sortedKeys"
      :key="nutritiveKey"
    >
      <sui-table-cell
        @click="updateNutriIndexToFill(index)"
        :selectable="selectLine && index !== nutrimentToFillIndex"
        :warning="selectLine && index === nutrimentToFillIndex"
        >{{ $t(`nutrition.nutriments.${nutritiveKey}`) }}</sui-table-cell
      >
      <sui-table-cell
        style="display: flex"
        :negative="isInvalid(value[nutritiveKey]['data'])"
      >
        <input
          style="flex-grow:1"
          :value="value[nutritiveKey]['data']"
          @input="updateValue(nutritiveKey)($event)"
        />
        <select
          style="min-width: 3rem"
          selection
          :placeholder="$t('nutrition.table.unit')"
          v-if="getNutrimentUnits(nutritiveKey).length > 1"
          :value="value[nutritiveKey]['unit']"
          @change="updateUnit(nutritiveKey)($event)"
          :options="getNutrimentUnits(nutritiveKey)"
          class="unit"
        >
          <option v-for="unit in getNutrimentUnits(nutritiveKey)" :key="unit">{{
            unit
          }}</option>
        </select>
        <span class="unit" v-else>{{
          getNutrimentUnits(nutritiveKey)[0]
        }}</span>
      </sui-table-cell>
      <sui-table-cell>
        <button @click="remove(nutritiveKey)">
          X
        </button>
      </sui-table-cell>
    </sui-table-row>
  </sui-table>
</template>

<style scoped>
.error {
  border-color: red;
}
</style>
