<template>
  <div class="main-column">
    <h3>Annotations</h3>
    <p>
      Remaining:
      <strong>{{ remaining }}</strong>
    </p>
    <p>
      Annotated:
      <strong>{{ annotated }}</strong>
    </p>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL } from "../const";

export default {
  name: "AnnotationCounter",
  props: ["remaining"],
  data: function() {
    return {
      username: "raphael0202",
      annotated: 0
    };
  },
  mounted() {
    axios
      .get(`${ROBOTOFF_API_URL}/users/statistics/${this.username}`)
      .then(result => {
        this.annotated = result.data.count.annotations;
      })
      .catch(error => window.console.log(error));
  }
};
</script>

<style scoped>
.main-column {
  padding: 1.5rem 1.5rem;
}
</style>