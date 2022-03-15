<template>
  <div class="mt-3 text-center" v-if="currentProduct">
    <h3>
      <a :href="currentProductURL">{{ currentProduct.product_name }}</a>
    </h3>
    <img v-bind:src="currentProduct.image_ingredients_url" alt="ingredients" />
    <div v-if="currentProductCorrections.length">
      <h3>Corrections</h3>
      <p
        v-for="correction in currentProductCorrections"
        v-bind:key="correction"
      >{{ correction.original }} -> {{correction.correction }}</p>
    </div>
    <div class="mt-3 d-flex-center">
      <textarea v-model.trim="ingredientsInput" style="width: '80%'" rows="4" />
    </div>
    <div class="mt-3 d-flex-center">
      <button class="button secondary mr-3" @click="updateIngredients(true)">Skip</button>
      <input style="width: '200px'" placeholder="Type 'ok' to enable edit" v-model="validateInput" />
      <button
        class="button success ml-3"
        @click="updateIngredients(false)"
        :disabled="validateInput !== 'ok'"
      >Edit</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { OFF_URL, ROBOTOFF_API_URL, IS_DEVELOPMENT_MODE } from "../const";

const getIngredients = async code => {
  const {
    data: { ingredients_text_from_image }
  } = await axios(
    `${OFF_URL}/cgi/ingredients.pl?code=${code}&id=ingredients_${"fr"}&process_image=1&ocr_engine=google_cloud_vision`
  );
  if (!ingredients_text_from_image) {
    return null;
  }
  if(IS_DEVELOPMENT_MODE){
    const {
    data: { corrected, corrections }
    }
    console.log(`Getting ingredients, `${ROBOTOFF_API_URL}/api/v1/predict/ingredients/spellcheck`,
    new URLSearchParams(`text=${ingredients_text_from_image}`)`)
  } else {
    const {
    data: { corrected, corrections }
  } = await axios.post(
    `${ROBOTOFF_API_URL}/api/v1/predict/ingredients/spellcheck`,
    new URLSearchParams(`text=${ingredients_text_from_image}`)
  );
  }
  return {
    ingredientOriginal: ingredients_text_from_image,
    ingredientCorrections: corrections,
    ingredientCorrected: corrected
  };
};

const getFullProduct = async product => {
  const ingredients = await getIngredients(product.code);

  if (!ingredients) {
    return null;
  }

  return {
    ingredientText:
      ingredients.ingredientCorrected || ingredients.ingredientOriginal,
    ...ingredients,
    ...product
  };
};

const getProducts = async () => {
  const {
    data: { count, page_size }
  } = await axios(
    `${OFF_URL}/state/photos-validated/state/ingredients-to-be-completed.json?fields=null`
  ); // TODO: should be done only one times
  const randomPage = Math.floor((Math.random() * count) / page_size);
  let {
    data: { products }
  } = await axios(
    `${OFF_URL}/state/photos-validated/state/ingredients-to-be-completed/${randomPage}.json?fields=code,image_ingredients_url,product_name`
  );

  products = (
    await Promise.all(
      // 20 parallels request will be to much
      products.slice(0, 5).map(p => getFullProduct(p))
    )
  ).filter(p => p !== null);

  return products;
};

export default {
  name: "IngredientsView",
  props: [],
  data: function() {
    return {
      productBuffer: [],
      currentProduct: null,
      ingredientsInput: "",
      validateInput: "",
      loading: false
    };
  },
  computed: {
    currentProductURL: function() {
      if (!this.currentProduct) {
        return null;
      }
      return `https://world-fr.openfoodfacts.org/product/${this.currentProduct.code}`;
    },
    currentProductCorrections: function() {
      if (!this.currentProduct) {
        return [];
      }
      return this.currentProduct.ingredientCorrections
        .map(c => c.term_corrections)
        .reduce((a, b) => a.concat(b), []);
    }
  },
  watch: {
    productBuffer: async function(productBuffer) {
      if (productBuffer.length <= 5 && !this.loading) {
        const products = await getProducts();
        this.productBuffer = this.productBuffer.concat(products);
        this.loading = false;
      }
    }
  },
  methods: {
    updateIngredients(skip) {
      if (!skip) {
        if (IS_DEVELOPMENT_MODE){
          console.log(`Ingredients updated, ${OFF_URL}/cgi/product_jqm2.pl?`,
          new URLSearchParams(
            `ingredients_text_${"fr"}=${this.ingredientsInput}&code=${
              this.currentProduct.code
            }`
          ))
        } else {
          axios.post(
          `${OFF_URL}/cgi/product_jqm2.pl?`,
          new URLSearchParams(
            `ingredients_text_${"fr"}=${this.ingredientsInput}&code=${
              this.currentProduct.code
            }`
          )
        );
        }
      }
      this.validateInput = "";
      this.updateCurrentProduct();
    },
    updateCurrentProduct() {
      this.currentProduct = this.productBuffer[0];
      this.productBuffer = this.productBuffer.slice(1);
      this.ingredientsInput = this.currentProduct.ingredientText;
    }
  },
  mounted: async function() {
    this.productBuffer = await getProducts();
    this.updateCurrentProduct();
  }
};
</script>
