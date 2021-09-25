<template>
  <div class="container">
    <div class="ui card" v-for="card in labels.fr" :key="card.value_tag">
      <router-link :to="card.url" target="_blank">
        <div class="image">
          <img :src="card.logo" />
        </div>
        <div class="content">
          <span class="header">{{ card.value_tag }}</span>
          <div
            class="floating ui label"
            :class="card.remainingQuestions === '0' ? 'green' : 'red'"
          >
            {{ card.remainingQuestions || "..." }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import robotoffService from "../robotoff";

const fr_labels = [
  {
    url: "questions?type=label&value_tag=en:organic",
    value_tag: "en:organic",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/fr/labels/bio.96x90.png",
  },
  {
    url: "questions?type=label&value_tag=en:eu-organic",
    value_tag: "en:eu-organic",
    logo:
      "https://world.openfoodfacts.org/images/lang/en/labels/eu-organic.135x90.svg",
  },
  {
    url: "questions?type=label&value_tag=en:ab-agriculture-biologique",
    value_tag: "en:ab-agriculture-biologique",
    logo:
      "https://world.openfoodfacts.org/images/lang/en/labels/ab-agriculture-biologique.74x90.svg",
  },
  {
    url: "questions?type=label&value_tag=en:eg-oko-verordnung",
    value_tag: "en:eg-oko-verordnung",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/eg-oko-verordnung.110x90.svg",
  },
  {
    url: "questions?type=label&value_tag=fr:haute-valeur-environnementale",
    value_tag: "fr:haute-valeur-environnementale",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/fr/labels/haute-valeur-environnementale.90x90.svg",
  },
  {
    url: "questions?type=label&value_tag=fr:label-rouge",
    value_tag: "fr:label-rouge",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/fr/labels/label-rouge.90x90.svg",
  },
  {
    url: "questions?type=label&value_tag=fr:bleu-blanc-coeur",
    value_tag: "fr:bleu-blanc-coeur",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/fr/labels/bleu-blanc-coeur.98x90.svg",
  },
  {
    url: "questions?type=label&value_tag=en:roundtable-on-sustainable-palm-oil",
    value_tag: "en:roundtable-on-sustainable-palm-oil",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/roundtable-on-sustainable-palm-oil.90x90.svg",
  },
  {
    url:
      "questions?type=label&country=en:france&value_tag=en:rainforest-alliance",
    value_tag: "en:rainforest-alliance",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/rainforest-alliance.90x90.svg",
  },
  {
    url: "questions?type=label&value_tag=fr:fairtrade",
    value_tag: "fr:fairtrade",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/fairtrade-international.77x90.svg",
  },
  {
    url: "questions?type=label&value_tag=fr:max-havelaar",
    value_tag: "fr:Max-Havelaar",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/fairtrade-international.77x90.svg",
  },
  {
    url: "questions?type=label&value_tag=en:sustainable-seafood-msc",
    value_tag: "en:sustainable-seafood-msc",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/sustainable-seafood-msc.126x90.svg",
  },
  {
    url: "questions?type=label&value_tag=en:responsible-aquaculture-asc",
    value_tag: "en:responsible-aquaculture-asc",
    logo:
      "https://world-fr.openfoodfacts.org/images/lang/en/labels/responsible-aquaculture-asc.188x90.svg",
  },
];

export default {
  name: "EcoScoreMenuView",
  data: function() {
    return {
      zzzzzzzz: "lklqjsdskljsljf",
      labels: {
        fr: fr_labels,
      },
    };
  },
  computed: {},
  methods: {
    setRemainingQuestions: function({ value_tag }) {
      const count = 10;
      robotoffService
        .questions("random", "label", value_tag, null, null, count)
        .then((result) => {
          this.labels = {
            ...this.labels,
            fr: this.labels.fr.map((dataLabel) => {
              if (value_tag !== dataLabel.value_tag) {
                return dataLabel;
              }
              return {
                ...dataLabel,
                remainingQuestions:
                  result.data.count === 0 ? "0" : result.data.count,
              };
            }),
          };
        });
    },
  },
  mounted() {
    const vm = this;
    this.labels.fr.forEach((labelData) => {
      vm.setRemainingQuestions(labelData);
    });
  },
};
</script>

<style scoped>
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
}
.header {
  color: black;
  font-size: 1.5rem;
  padding: 0 0 1rem 0.5rem;
}
.card {
  width: 300px;
  height: 350px;
}
.image {
  text-align: center;
  height: 300px;
  width: 300px;
  position: relative;
}
.image img {
  max-height: 100%;
  max-width: 100%;
  height: 300px;
  width: 300px;
}
</style>
