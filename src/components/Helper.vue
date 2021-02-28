<template>
  <div>
    <sui-modal :open="open" v-on:changed="close">
      <sui-modal-header>Help page</sui-modal-header>
      <sui-modal-content image>
        <sui-image
          wrapped
          :size="helpInformations[pageKey].imageSize || 'medium'"
          :src="helpInformations[pageKey].imgUrl"
        />
        <sui-modal-description>
          <sui-header>{{ helpInformations[pageKey].title }}</sui-header>
          <p
            v-for="(text, key) in helpInformations[pageKey].texts"
            :key="key"
            class="explanationText"
          >
            {{ text }}
          </p>
        </sui-modal-description>
      </sui-modal-content>
      <sui-segment aligned="right">
        <sui-progress attached top :percent="pageRatio" color="green" />
        <sui-button @click.native="prev">prev</sui-button>
        <sui-button
          v-if="Object.keys(helpInformations).length > pageIndex + 1"
          primary
          @click.native="next"
          >next</sui-button
        >
        <sui-button v-else positive @click.native="close">
          OK
        </sui-button>
      </sui-segment>
    </sui-modal>
  </div>
</template>

<script>
// potential image size (default is medium) : "mini" | "tiny" | "small" | "medium" | "large" | "big" | "huge" | "massive"
const explanations = {
  welcome: {
    page1: {},
    page2: {
      image: "questionsScreenshot.png",
      imageSize: "huge",
    },
    page3: {
      image: "logoGeneral.png",
      imageSize: "huge",
    },
  },
  logos: {
    page1: {
      image: "logoGeneral.png",
    },
    page2: {
      image: "memLogo.png",
    },
    page3: {
      image: "logoNameLabel.png",
      imageSize: "large",
    },
  },
};

const images = require.context("../assets/", false, /\.png$/);
const getImageUrl = (imageName) => images("./" + (imageName || "logo.png"));

// set imageUrl in explanations
Object.keys(explanations).forEach((urlKey) => {
  Object.keys(explanations[urlKey]).forEach((pageKey) => {
    explanations[urlKey][pageKey].imgUrl = getImageUrl(
      explanations[urlKey][pageKey].image || null
    );
  });
});

const getHelpInformations = (currentPath, translatedExplanations) => {
  let currentPathKey = currentPath.slice(1);
  if (!(currentPathKey in translatedExplanations)) {
    currentPathKey = "welcome";
  }
  const translations = translatedExplanations[currentPathKey];
  const rep = {};

  Object.keys(translations).forEach((pageKey) => {
    const { title, ...texts } = translations[pageKey];
    rep[pageKey] = {
      title,
      texts: { ...texts },
      ...(explanations[currentPathKey] && explanations[currentPathKey][pageKey]
        ? explanations[currentPathKey][pageKey]
        : {}),
    };
  });

  return rep;
};

// const translateHelpInformation = (explanations, rootKey, t) => {

// }

export default {
  name: "IntroductionView",
  props: { open: Boolean },
  data: function() {
    console.log(this.$t("helper"));
    return {
      pageIndex: 0,
      helpInformations: getHelpInformations(
        this.$router.history.current.path,
        this.$t("helper")
      ),
    };
  },
  watch: {
    $route() {
      this.helpInformations = getHelpInformations(
        this.$router.history.current.path,
        this.$t("helper")
      );
      this.pageIndex = 0;
    },
  },
  computed: {
    pageRatio: function() {
      if (Object.keys(this.helpInformations).length === 1) {
        return 100;
      }
      return Math.floor(
        100 * (this.pageIndex / (Object.keys(this.helpInformations).length - 1))
      );
    },
    pageKey: function() {
      return `page${this.pageIndex + 1}`;
    },
  },
  methods: {
    close: function() {
      this.$emit("close-helper");
    },
    prev: function() {
      this.pageIndex = Math.max(0, this.pageIndex - 1);
    },
    next: function() {
      this.pageIndex = Math.min(
        Object.keys(this.helpInformations).length - 1,
        this.pageIndex + 1
      );
    },
  },
};
</script>
<style scoped>
.explanationText {
  font-size: 1.3rem;
}
</style>
