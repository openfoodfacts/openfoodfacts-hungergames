<script>
import { points2Path } from "../utils/tableAnotation";

function rotateSize(size, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    width:
      Math.abs(size.width * Math.cos(radians)) +
      Math.abs(size.height * Math.sin(radians)),
    height:
      Math.abs(size.width * Math.sin(radians)) +
      Math.abs(size.height * Math.cos(radians)),
  };
}
function getStyleTransforms({ rotate, flip, scaleX, scaleY }) {
  let transform = "";
  transform += ` rotate(${rotate}deg) `;
  transform += ` scaleX(${scaleX * (flip.horizontal ? -1 : 1)}) `;
  transform += ` scaleY(${scaleY * (flip.vertical ? -1 : 1)}) `;
  return transform;
}
export default {
  props: {
    coordinates: {
      type: Object,
    },
    transitions: {
      type: Object,
    },
    image: {
      type: Object,
      default() {
        return {};
      },
    },
    imageClass: {
      type: String,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    onlyPredictions: { type: Boolean },
    clickableBoxes: { type: Array },
    anotationToValidate: { type: Object },
    bestMatch: { type: Function },
    boxesHighlight: { type: Array },
    attributedBoxesIds: { type: Array }, // list of box_id that as been used (fo nutriment or quantity selection)
  },
  data() {
    return {
      calculatedImageSize: {
        width: 0,
        height: 0,
      },
      calculatedSize: {
        width: 0,
        height: 0,
      },
      displayedBox: {},
    };
  },
  computed: {
    style() {
      if (!this.fill) {
        const result = {};
        if (this.width) {
          result.width = `${this.size.width}px`;
        }
        if (this.height) {
          result.height = `${this.size.height}px`;
        }
        if (this.transitions && this.transitions.enabled) {
          result.transition = `${this.transitions.time}ms ${this.transitions.timingFunction}`;
        }
        return result;
      } else {
        return {};
      }
    },
    imageWidth() {
      return this.image.width;
    },
    imageHeight() {
      return this.image.height;
    },
    wrapperStyle() {
      const result = {
        width: `${this.size.width}px`,
        height: `${this.size.height}px`,
        left: `calc(50% - ${this.size.width / 2}px)`,
        top: `calc(50% - ${this.size.height / 2}px)`,
      };
      if (this.transitions && this.transitions.enabled) {
        result.transition = `${this.transitions.time}ms ${this.transitions.timingFunction}`;
      }
      return result;
    },
    imageStyle() {
      if (this.coordinates && this.image) {
        const coefficient = this.coordinates.width / this.size.width;
        const transforms = {
          rotate: 0,
          flip: {
            horizontal: false,
            vertical: false,
          },
          ...this.image.transforms,
          scaleX: 1 / coefficient,
          scaleY: 1 / coefficient,
        };
        const width = this.imageSize.width;
        const height = this.imageSize.height;
        const virtualSize = rotateSize(
          {
            width,
            height,
          },
          transforms.rotate
        );
        const result = {
          width: `${width}px`,
          height: `${height}px`,
          left: "0px",
          top: "0px",
        };
        const compensations = {
          rotate: {
            left: ((width - virtualSize.width) * transforms.scaleX) / 2,
            top: ((height - virtualSize.height) * transforms.scaleY) / 2,
          },
          scale: {
            left: ((1 - transforms.scaleX) * width) / 2,
            top: ((1 - transforms.scaleY) * height) / 2,
          },
        };
        result.transform =
          `translate(
				${-this.coordinates.left / coefficient -
          compensations.rotate.left -
          compensations.scale.left}px,${-this.coordinates.top / coefficient -
            compensations.rotate.top -
            compensations.scale.top}px) ` + getStyleTransforms(transforms);
        if (this.transitions && this.transitions.enabled) {
          result.transition = `${this.transitions.time}ms ${this.transitions.timingFunction}`;
        }
        return result;
      } else {
        return {};
      }
    },
    size() {
      return {
        width: this.width || this.calculatedSize.width,
        height: this.height || this.calculatedSize.height,
      };
    },
    imageSize() {
      return {
        width: this.image.width || this.calculatedImageSize.width,
        height: this.image.height || this.calculatedImageSize.height,
      };
    },
    potentialNutriments() {
      console.log("potentialNutriments");
      console.log(this.displayedBox);
      if (!this.displayedBox || !this.displayedBox.values) {
        return [];
      }
      const rep = this.$props.bestMatch({ search: this.displayedBox.values });
      console.log(rep);
      return rep;
    },
  },
  watch: {
    clickableBoxes() {
      this.displayedBox = {};
    },
    image(value) {
      if (value.width || value.height) {
        this.onChangeImage();
      }
    },
  },
  mounted() {
    this.onChangeImage();
    this.$refs.image.addEventListener("load", () => {
      this.refreshImage();
    });
    window.addEventListener("resize", this.refresh);
    window.addEventListener("orientationchange", this.refresh);
  },
  destroyed() {
    window.removeEventListener("resize", this.refresh);
    window.removeEventListener("orientationchange", this.refresh);
  },
  methods: {
    log(event) {
      console.log(event.target);
      console.log(event);
      console.log({
        x: event.offsetX, // - event.target.left,
        y: event.offsetY, // - event.target.top,
      });

      this.displayedBox = {
        index: null,
        boxes: [{ maxX: event.offsetX, minY: event.offsetY }],
        values: "",
      };
    },
    boxBoundingPath(box) {
      return points2Path(box.boundingPoly.vertices, true);
    },
    displayBox(boxIndex) {
      if (this.displayedBox && this.displayedBox.index === boxIndex) {
        this.displayedBox = {};
      } else {
        console.log({
          index: boxIndex,
          ...this.$props.clickableBoxes[boxIndex],
        });
        this.displayedBox = {
          index: boxIndex,
          ...this.$props.clickableBoxes[boxIndex],
        };
      }
    },
    removeDisplayedBox() {
      this.displayedBox = {};
    },
    validateProposition(nutriKey) {
      this.$emit("validatedBox", { ...this.displayedBox, key: nutriKey });
      this.displayedBox = {};
    },
    validateValue() {
      this.$emit("validatedBox", { ...this.displayedBox });
      this.displayedBox = {};
    },
    validateNutrimentPrediction() {
      this.$emit("nutriPredictionAccept");
    },
    cancelNutrimentPrediction() {
      this.$emit("nutriPredictionCancel");
    },
    interactiveElementStyle({ maxX: x, minY: y }) {
      if (this.coordinates && this.image) {
        const result = {
          left: `${((x - this.coordinates.left) * this.size.width) /
            this.coordinates.width}px`,
          top: `${((y - this.coordinates.top) * this.size.height) /
            this.coordinates.height}px`,
        };
        return result;
      } else {
        return {};
      }
    },
    refreshImage() {
      const image = this.$refs.image;
      this.calculatedImageSize.height = image.naturalHeight;
      this.calculatedImageSize.width = image.naturalWidth;
    },
    refresh() {
      const root = this.$refs.root;
      if (!this.width) {
        this.calculatedSize.width = root.clientWidth;
      }
      if (!this.height) {
        this.calculatedSize.height = root.clientHeight;
      }
    },
    onChangeImage() {
      const image = this.$refs.image;
      if (image && image.complete) {
        this.refreshImage();
      }
      this.refresh();
    },
  },
};
</script>

<template>
  <div class="rootContainer">
    <div ref="root" class="vue-preview" :style="style">
      <div ref="wrapper" class="wrapper" :style="wrapperStyle">
        <img
          v-show="image && image.src"
          ref="image"
          :src="image && image.src"
          class="image"
          :style="imageStyle"
        />
        <svg
          class="image"
          :style="imageStyle"
          :width="imageWidth"
          :height="imageHeight"
        >
          <rect
            x0="0"
            y0="0"
            :width="imageWidth"
            :height="imageHeight"
            class="nutriHighlight"
            @click="log($event)"
          />
          <g v-for="(data, j) in clickableBoxes" :key="j">
            <path
              v-for="(box, i) in data.boxes"
              :key="`${j}-${i}`"
              :d="boxBoundingPath(box)"
              :class="{
                highlight: displayedBox.index === i,
                alreadyUsed: attributedBoxesIds.includes(box.id),
              }"
              @click="displayBox(j)"
            />
          </g>
          <g v-if="anotationToValidate && anotationToValidate.boxes">
            <path
              v-for="box in anotationToValidate.boxes"
              :key="box.minX"
              :d="boxBoundingPath(box)"
              class="nutriHighlight"
            />
          </g>
          <g v-if="boxesHighlight">
            <path
              v-for="box in boxesHighlight"
              :key="box.minX"
              :d="boxBoundingPath(box)"
              class="boxHighlighted"
            />
          </g>
        </svg>
      </div>
    </div>

    <!-- the clicked box Nutritive Information -->
    <div
      v-if="displayedBox && displayedBox.values !== undefined"
      class="anotation"
      :style="
        interactiveElementStyle(
          displayedBox.boxes[displayedBox.boxes.length - 1]
        )
      "
      v-focus
    >
      <input v-model="displayedBox.values" />
      <template v-if="onlyPredictions">
        <button @click="removeDisplayedBox">X</button>
        <ol class="propositions">
          <li v-for="proposition in potentialNutriments" :key="proposition.key">
            <button @click="validateProposition(proposition.key)">
              {{ proposition.key }}({{ proposition.text }})
            </button>
          </li>
        </ol>
      </template>
      <template v-else>
        <br />
        <button @click="removeDisplayedBox">X</button>
        <button @click="validateValue">V</button>
      </template>
    </div>

    <!-- The nutrition to verify -->
    <div
      class="anotation"
      v-if="anotationToValidate && anotationToValidate.boxes"
      :style="
        interactiveElementStyle(
          anotationToValidate.boxes[anotationToValidate.boxes.length - 1]
        )
      "
    >
      {{ anotationToValidate.text }}
      <button @click="cancelNutrimentPrediction">X</button>
      <button @click="validateNutrimentPrediction">V</button>
    </div>
  </div>
</template>

<style scoped>
.rootContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
.vue-preview {
  overflow: hidden;
  box-sizing: border-box;

  width: 100%;
  height: 100%;
}
.fill {
  width: 100%;
  height: 100%;
  position: absolute;
}
.wrapper {
  position: absolute;
  height: 100%;
  width: 100%;
}
.image {
  pointer-events: none;
  position: absolute;
  user-select: none;
  transform-origin: center;
  max-width: none !important;
}
path {
  stroke: red;
  stroke-width: 2;
  fill: red;
  fill-opacity: 0.3;
  pointer-events: all;
  cursor: pointer;
}
rect {
  fill-opacity: 0.1;
  fill: white;
  pointer-events: all;
}
g:hover path {
  stroke: red;
  stroke-width: 5;

  cursor: pointer;
}
.highlight {
  stroke: red;
  stroke-width: 5;
}

.boxHighlighted {
  stroke: blue;
  stroke-width: 5;
  fill: blue;
}

.alreadyUsed {
  fill: green;
}

.anotation {
  background-color: white;
  position: absolute;
  z-index: 1000;
  text-align: left;
}
.anotation button {
  margin: 0.5rem 0.5rem 0 0;
}

.propositions li {
  padding-bottom: 2px;
  font-size: 1.2rem;
}
.propositions {
  list-style: none;
  position: relative;
  background: white;
  padding: 0 1rem;
}
</style>
