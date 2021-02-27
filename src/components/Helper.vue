<template>
  <div>
    <sui-modal :open="open" v-on:changed="close">
      <sui-modal-header>Help page</sui-modal-header>
      <sui-modal-content image>
        <sui-image
          wrapped
          :size="helpInformations[pageIndex].imageSize || 'medium'"
          :src="imgUrl"
        />
        <!-- <img wrapped size="large" :src="imgUrl" /> -->
        <sui-modal-description>
          <sui-header>{{ helpInformations[pageIndex].title }}</sui-header>
          <p
            v-for="(text, index) in helpInformations[pageIndex].texts"
            :key="index"
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
          v-if="helpInformations.length > pageIndex + 1"
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
  welcome: [
    {
      title: "Welcome",
      texts: [
        "Hunger Games is a collection of mini-games that help contribute to Open Food Facts in many ways. Categorize a product to get the Nutri-Score and Eco-Score, help validate labels for the Eco-Score, add brands and weights, help our logo recognition system learn about the logos it detected.",
        "Those are some of the exciting things you'll be able to do. Make sure to be connected to the Open Food Facts website to get credit for your contributions. If you make a mistake, please take the time to correct it by heading to the website.",
        "In case of doubt about the game, you have an helper at the top right of the page, and you can reach us on slack at the #hunger-games channel",
      ],
    },
    {
      title: "Questions",
      texts: [
        "Our AI has a lot of questions for you. Here you will have to confirm or deny the information she detected on images.",
        "Do not hestiate to skip a question if you're not sure, there are plenty of others",
      ],
      image: "questionsScreenshot.png",
      imageSize: "huge",
    },
    {
      title: "Logos",
      texts: [
        "The worlds of products is full of logos. Explain to our AI which one are the same.",
      ],
      image: "logoGeneral.png",
      imageSize: "huge",
    },
  ],
  logos: [
    {
      title: "Selection",
      texts: [
        "Select the crops of a same logo by clicking on them",
        "Selected logos go to the top of the page, you can unselect them by clicking again on them",
      ],
      image: "logoGeneral.png",
    },
    {
      title: "Warning",
      texts: [
        "If the crop contains multiple logo do not select it.",
        "If the crop contains only a partial part of a logo you can select it",
      ],
      image: "memLogo.png",
    },
    {
      title: "Validate",
      texts: [
        "Indicate the type of logo (label, brand, QRcode, ...)",
        "If it is a label or a brand logo, indicate which one it is",
        "Now you can submit your selection",
        "Thank you :)",
      ],
      image: "logoNameLabel.png",
      imageSize: "large",
    },
  ],
};
const getHelpInformations = (currentPath, explanations) => {
  const currentPathKey = currentPath.slice(1);
  if (currentPathKey in explanations) {
    return explanations[currentPathKey];
  }
  return explanations["welcome"];
};

export default {
  name: "IntroductionView",
  props: { open: Boolean },
  data: function() {
    return {
      pageIndex: 0,
      helpInformations: getHelpInformations(
        this.$router.history.current.path,
        explanations
      ),
    };
  },
  watch: {
    $route() {
      this.helpInformations = getHelpInformations(
        this.$router.history.current.path,
        explanations
      );
      this.pageIndex = 0;
    },
  },
  computed: {
    pageRatio: function() {
      if (this.helpInformations.length === 1) {
        return 100;
      }
      return Math.floor(
        100 * (this.pageIndex / (this.helpInformations.length - 1))
      );
    },
    imgUrl: function() {
      var images = require.context("../assets/", false, /\.png$/);
      return images(
        "./" + (this.helpInformations[this.pageIndex].image || "logo.png")
      );
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
        this.helpInformations.length - 1,
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
