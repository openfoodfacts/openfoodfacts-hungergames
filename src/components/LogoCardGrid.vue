<template>
  <div>
    <div class="ui grid">
      <div
        class="five wide mobile four wide tablet three wide computer column"
        v-for="logo in logos"
        :key="logo.id"
      >
        <div
          class="ui fluid card ann-logo"
          @click="toggleSelectLogo(logo)"
          :class="{selected: logo.selected, annotated: logo.annotation_type }"
        >
          <div class="content">
            <div class="left floated meta">
              <router-link :to="editLogoURL(logo)" target="_blank">
                <i class="edit icon"></i>
              </router-link>
            </div>
            <div class="right floated meta">
              <router-link :to="externalLogoURL(logo)" target="_blank">
                <i class="external alternate icon small blue"></i>
              </router-link>
            </div>
          </div>
          <div class="image">
            <img width="100px" loading="lazy" :src="logo.image.url" />
          </div>
          <div class="content">
            <p v-if="logo.distance">{{$t("logos.distance")}} {{ logo.distance.toFixed(1) }}</p>
            <p
              v-if="logo.annotation_value"
            >{{$t("logos.annotation")}}{{ logo.annotation_value }} ({{ logo.annotation_type }})</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LogoCardGrid",
  props: {
    logos: {
      type: Array,
      required: true
    },
    selectable: {
      type: Boolean,
      default: true
    }
  },
  data: function() {
    return {};
  },
  methods: {
    externalLogoURL: function(logo) {
      return `/logos?logo_id=${logo.id}`;
    },
    editLogoURL: function(logo) {
      return `/logos/${logo.id}`;
    },
    toggleSelectLogo: function(logo) {
      if (!this.selectable || logo.annotation_value) return;
      this.$emit("toggle-select-logo", logo);
    }
  },
  computed: {},
  mounted() {}
};
</script>

<style scoped>
.ann-logo.selected {
  background-color: #4a5971;
  color: #ffffff;
}

.ann-logo.annotated {
  background-color: #797979;
  color: #ffffff;
}
</style>
