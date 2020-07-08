<template>
  <div class="main-column">
    <h3>{{$t('label.annotations')}}</h3>
    <p>
      {{$t('label.remaining_annotations')}}:
      <strong>{{ remainingCount }}</strong>
    </p>
    <p>
      {{$t('label.annotated_annotations')}}:
      <strong>{{ annotatedCount }}</strong>
    </p>
    <div class="ui divider" />
    <h3>{{$t('label.last_annotations')}}</h3>
    <div v-for="annotation in sortedLastAnnotations" :key="annotation.question.insight_id">
      <a
        target="_blank"
        :href="getProductUrl(annotation.question.barcode)"
      >{{ annotation.question.insight_type }}: {{ annotation.question.value }}</a>
      <i v-if="annotation.annotation == 1" class="check green icon"></i>
      <i v-else-if="annotation.annotation == -1" class="question icon"></i>
      <i v-else-if="annotation.annotation == 0" class="times red icon"></i>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ROBOTOFF_API_URL } from "../const";
import { getUsername } from "../off";
import { getProductUrl } from "../off";

export default {
  name: "AnnotationCounter",
  props: {
    remainingCount: {
      type: Number,
      required: true
    },
    lastAnnotations: {
      type: Array,
      required: true
    },
    sessionAnnotatedCount: {
      type: Number,
      required: true
    }
  },
  data: function() {
    return {
      username: getUsername(),
      historyAnnotatedCount: 0
    };
  },
  methods: {
    getProductUrl: function(barcode) {
      return getProductUrl(barcode);
    }
  },
  computed: {
    sortedLastAnnotations: function() {
      const lastAnnotations = this.lastAnnotations.slice();
      return lastAnnotations.reverse();
    },
    annotatedCount: function() {
      return this.historyAnnotatedCount + this.sessionAnnotatedCount;
    }
  },
  mounted() {
    if (this.username.length) {
      axios
        .get(`${ROBOTOFF_API_URL}/users/statistics/${this.username}`)
        .then(result => {
          this.historyAnnotatedCount = result.data.count.annotations;
        })
        .catch(error => window.console.log(error));
    }
  }
};
</script>

<style scoped>
.main-column {
  padding: 1.5rem 1.5rem;
  background-color: #686868;
  color: #ffffff;
}

a {
  color: #ffffff;
}
</style>
