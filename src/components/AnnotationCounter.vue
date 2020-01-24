<template>
  <div v-if="counter !== null">Annotations: {{ counter }}</div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL } from "../settings";

export default {
  name: "AnnotationCounter",
  data: function() {
    return {
      username: "raphael0202",
      counter: null
    };
  },
  mounted() {
    axios
      .get(`${ROBOTOFF_API_URL}/users/statistics/${this.username}`)
      .then(response => {
        window.console.log(response);
      })
      .catch(error => window.console.log(error));
  }
};
</script>

<style>
</style>