<template>
  <div>
    <p>{{ this.m }}</p>
    <div class="imageContainer" @click="click('')">
      <img :src="urlImg" />
      <svg width="479" height="657" v-on:mousemove="moveAt">
        <path
          v-for="(box, path) in boxes"
          fill="transparent"
          stroke="black"
          :d="path"
          :key="path"
          @click.stop="click(path, $event)"
          v-on:mouseover="mouseover(path)"
          v-bind:class="{ inVisible: !box.visible, toDelete: box.toDelete }"
          class="box"
        />

        <!-- Links in creation -->
        <path v-if="currentLinks" :d="currentLinks" class="currentLink" />
        <circle
          v-for="path in annotations.currentPath"
          :key="'creationCenter-' + path"
          :cx="getCenter(path).x"
          :cy="getCenter(path).y"
          r="5"
          class="currentBoxesCenter"
        />

        <!-- saved links -->
        <g
          v-for="(neighbours, node) in annotations.memorizedGraph"
          :key="'node-group-' + node"
        >
          <circle
            :cx="getCenter(node).x"
            :cy="getCenter(node).y"
            r="5"
            class="savedBoxesCenter"
          />
          <line
            v-for="neighbour in neighbours"
            :x1="getCenter(node).x"
            :y1="getCenter(node).y"
            :x2="getCenter(neighbour).x"
            :y2="getCenter(neighbour).y"
            :key="
              'savedLink-' +
                getCenter(node).x +
                '-' +
                getCenter(node).y +
                '-' +
                getCenter(neighbour).x +
                '-' +
                getCenter(neighbour).y
            "
            class="savedLink"
          />
        </g>

        <line
          v-if="annotations.keyIsDown"
          :x1="`${cursor.x}`"
          :y1="`${cursor.y}`"
          :x2="`${annotations.lastElement.x}`"
          :y2="`${annotations.lastElement.y}`"
          class="currentLink"
        />
        <!-- groups -->
        <path
          v-for="(box, path) in convexHalls"
          :d="path"
          :key="path"
          class="convexhall"
        />
      </svg>
    </div>
    <button v-on:click="nextStep">next</button>
  </div>
</template>

<script>
// import axios from "axios";
import {
  getBoxes,
  getCenter,
  getPath,
  getHullPaths,
} from "../utils/tableAnotation.js";

export default {
  name: "TableAnnotationView",
  components: {},
  data: function() {
    return {
      m: "",
      loading: false,
      currentState: 0,
      boxes: [],
      urlImg:
        "https://openfoodfacts.org/images/products/084/316/706/7253/2.jpg",
      textAnnotations: [
        {
          locale: "fr",
          description:
            "For 1 sheet (2.8 g) / Pour 1 feuille (2.8 g)\nServing Per Container 10\nPortions par contenant 10\nAmount\nTeneur\n% Daily Value\n% valeur quotidienne\nCalories / Calories 5\nFat / Lipides 0 g\n0 %\nSaturated / saturés 0 g\n+ Trans / trans 0 g\n0 %\nCholesterol /Cholestérol 0 mg\n0 %\nSodium / Sodium 20 mg\n1 %\nCarbohydrate / Glucides 1 g\nFibre / Fibres 1 g\n0 %\n4 %\nSugars / Sucres 0g\nProtein / Protéines 1 g\nVitamin A / Vitamine A\n6 %\nVitamin C/ Vitamine C\n4 %\nCalcium / Calcium\n2 %\n",
          boundingPoly: {
            vertices: [
              {
                x: 7,
                y: 2,
              },
              {
                x: 462,
                y: 2,
              },
              {
                x: 462,
                y: 650,
              },
              {
                x: 7,
                y: 650,
              },
            ],
          },
        },
        {
          description: "For",
          boundingPoly: {
            vertices: [
              {
                x: 23,
                y: 3,
              },
              {
                x: 49,
                y: 3,
              },
              {
                x: 49,
                y: 17,
              },
              {
                x: 23,
                y: 17,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 58,
                y: 4,
              },
              {
                x: 62,
                y: 4,
              },
              {
                x: 62,
                y: 16,
              },
              {
                x: 58,
                y: 16,
              },
            ],
          },
        },
        {
          description: "sheet",
          boundingPoly: {
            vertices: [
              {
                x: 73,
                y: 3,
              },
              {
                x: 117,
                y: 3,
              },
              {
                x: 117,
                y: 18,
              },
              {
                x: 73,
                y: 18,
              },
            ],
          },
        },
        {
          description: "(2.8",
          boundingPoly: {
            vertices: [
              {
                x: 125,
                y: 4,
              },
              {
                x: 155,
                y: 4,
              },
              {
                x: 155,
                y: 20,
              },
              {
                x: 125,
                y: 20,
              },
            ],
          },
        },
        {
          description: "g)",
          boundingPoly: {
            vertices: [
              {
                x: 162,
                y: 4,
              },
              {
                x: 177,
                y: 4,
              },
              {
                x: 177,
                y: 21,
              },
              {
                x: 162,
                y: 21,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 185,
                y: 4,
              },
              {
                x: 189,
                y: 4,
              },
              {
                x: 189,
                y: 18,
              },
              {
                x: 185,
                y: 18,
              },
            ],
          },
        },
        {
          description: "Pour",
          boundingPoly: {
            vertices: [
              {
                x: 196,
                y: 4,
              },
              {
                x: 234,
                y: 4,
              },
              {
                x: 234,
                y: 19,
              },
              {
                x: 196,
                y: 19,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 243,
                y: 5,
              },
              {
                x: 247,
                y: 5,
              },
              {
                x: 247,
                y: 18,
              },
              {
                x: 243,
                y: 18,
              },
            ],
          },
        },
        {
          description: "feuille",
          boundingPoly: {
            vertices: [
              {
                x: 257,
                y: 4,
              },
              {
                x: 305,
                y: 4,
              },
              {
                x: 305,
                y: 19,
              },
              {
                x: 257,
                y: 19,
              },
            ],
          },
        },
        {
          description: "(2.8",
          boundingPoly: {
            vertices: [
              {
                x: 312,
                y: 3,
              },
              {
                x: 343,
                y: 3,
              },
              {
                x: 343,
                y: 21,
              },
              {
                x: 312,
                y: 21,
              },
            ],
          },
        },
        {
          description: "g)",
          boundingPoly: {
            vertices: [
              {
                x: 350,
                y: 2,
              },
              {
                x: 365,
                y: 2,
              },
              {
                x: 365,
                y: 21,
              },
              {
                x: 350,
                y: 21,
              },
            ],
          },
        },
        {
          description: "Serving",
          boundingPoly: {
            vertices: [
              {
                x: 22,
                y: 26,
              },
              {
                x: 85,
                y: 26,
              },
              {
                x: 85,
                y: 46,
              },
              {
                x: 22,
                y: 46,
              },
            ],
          },
        },
        {
          description: "Per",
          boundingPoly: {
            vertices: [
              {
                x: 94,
                y: 28,
              },
              {
                x: 122,
                y: 28,
              },
              {
                x: 122,
                y: 43,
              },
              {
                x: 94,
                y: 43,
              },
            ],
          },
        },
        {
          description: "Container",
          boundingPoly: {
            vertices: [
              {
                x: 128,
                y: 28,
              },
              {
                x: 210,
                y: 28,
              },
              {
                x: 210,
                y: 43,
              },
              {
                x: 128,
                y: 43,
              },
            ],
          },
        },
        {
          description: "10",
          boundingPoly: {
            vertices: [
              {
                x: 218,
                y: 29,
              },
              {
                x: 236,
                y: 29,
              },
              {
                x: 236,
                y: 43,
              },
              {
                x: 218,
                y: 43,
              },
            ],
          },
        },
        {
          description: "Portions",
          boundingPoly: {
            vertices: [
              {
                x: 23,
                y: 51,
              },
              {
                x: 91,
                y: 51,
              },
              {
                x: 91,
                y: 66,
              },
              {
                x: 23,
                y: 66,
              },
            ],
          },
        },
        {
          description: "par",
          boundingPoly: {
            vertices: [
              {
                x: 98,
                y: 56,
              },
              {
                x: 125,
                y: 56,
              },
              {
                x: 125,
                y: 69,
              },
              {
                x: 98,
                y: 69,
              },
            ],
          },
        },
        {
          description: "contenant",
          boundingPoly: {
            vertices: [
              {
                x: 131,
                y: 52,
              },
              {
                x: 214,
                y: 53,
              },
              {
                x: 214,
                y: 68,
              },
              {
                x: 131,
                y: 67,
              },
            ],
          },
        },
        {
          description: "10",
          boundingPoly: {
            vertices: [
              {
                x: 222,
                y: 53,
              },
              {
                x: 241,
                y: 53,
              },
              {
                x: 241,
                y: 68,
              },
              {
                x: 222,
                y: 68,
              },
            ],
          },
        },
        {
          description: "Amount",
          boundingPoly: {
            vertices: [
              {
                x: 26,
                y: 90,
              },
              {
                x: 87,
                y: 91,
              },
              {
                x: 87,
                y: 110,
              },
              {
                x: 26,
                y: 109,
              },
            ],
          },
        },
        {
          description: "Teneur",
          boundingPoly: {
            vertices: [
              {
                x: 16,
                y: 115,
              },
              {
                x: 76,
                y: 116,
              },
              {
                x: 76,
                y: 131,
              },
              {
                x: 16,
                y: 130,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 335,
                y: 94,
              },
              {
                x: 350,
                y: 94,
              },
              {
                x: 350,
                y: 107,
              },
              {
                x: 335,
                y: 107,
              },
            ],
          },
        },
        {
          description: "Daily",
          boundingPoly: {
            vertices: [
              {
                x: 358,
                y: 92,
              },
              {
                x: 400,
                y: 91,
              },
              {
                x: 400,
                y: 109,
              },
              {
                x: 358,
                y: 110,
              },
            ],
          },
        },
        {
          description: "Value",
          boundingPoly: {
            vertices: [
              {
                x: 406,
                y: 89,
              },
              {
                x: 455,
                y: 88,
              },
              {
                x: 455,
                y: 105,
              },
              {
                x: 406,
                y: 106,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 266,
                y: 118,
              },
              {
                x: 281,
                y: 118,
              },
              {
                x: 281,
                y: 131,
              },
              {
                x: 266,
                y: 131,
              },
            ],
          },
        },
        {
          description: "valeur",
          boundingPoly: {
            vertices: [
              {
                x: 288,
                y: 117,
              },
              {
                x: 341,
                y: 116,
              },
              {
                x: 341,
                y: 131,
              },
              {
                x: 288,
                y: 132,
              },
            ],
          },
        },
        {
          description: "quotidienne",
          boundingPoly: {
            vertices: [
              {
                x: 348,
                y: 115,
              },
              {
                x: 453,
                y: 113,
              },
              {
                x: 453,
                y: 132,
              },
              {
                x: 348,
                y: 134,
              },
            ],
          },
        },
        {
          description: "Calories",
          boundingPoly: {
            vertices: [
              {
                x: 16,
                y: 149,
              },
              {
                x: 113,
                y: 150,
              },
              {
                x: 113,
                y: 171,
              },
              {
                x: 16,
                y: 170,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 120,
                y: 150,
              },
              {
                x: 129,
                y: 150,
              },
              {
                x: 129,
                y: 169,
              },
              {
                x: 120,
                y: 169,
              },
            ],
          },
        },
        {
          description: "Calories",
          boundingPoly: {
            vertices: [
              {
                x: 136,
                y: 150,
              },
              {
                x: 232,
                y: 151,
              },
              {
                x: 232,
                y: 171,
              },
              {
                x: 136,
                y: 170,
              },
            ],
          },
        },
        {
          description: "5",
          boundingPoly: {
            vertices: [
              {
                x: 242,
                y: 152,
              },
              {
                x: 253,
                y: 152,
              },
              {
                x: 253,
                y: 170,
              },
              {
                x: 242,
                y: 170,
              },
            ],
          },
        },
        {
          description: "Fat",
          boundingPoly: {
            vertices: [
              {
                x: 17,
                y: 188,
              },
              {
                x: 67,
                y: 190,
              },
              {
                x: 66,
                y: 210,
              },
              {
                x: 16,
                y: 208,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 69,
                y: 186,
              },
              {
                x: 75,
                y: 186,
              },
              {
                x: 74,
                y: 215,
              },
              {
                x: 68,
                y: 215,
              },
            ],
          },
        },
        {
          description: "Lipides",
          boundingPoly: {
            vertices: [
              {
                x: 75,
                y: 188,
              },
              {
                x: 160,
                y: 191,
              },
              {
                x: 159,
                y: 217,
              },
              {
                x: 74,
                y: 214,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 169,
                y: 191,
              },
              {
                x: 181,
                y: 191,
              },
              {
                x: 180,
                y: 209,
              },
              {
                x: 168,
                y: 209,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 190,
                y: 195,
              },
              {
                x: 208,
                y: 196,
              },
              {
                x: 207,
                y: 220,
              },
              {
                x: 189,
                y: 219,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 399,
                y: 185,
              },
              {
                x: 444,
                y: 186,
              },
              {
                x: 444,
                y: 210,
              },
              {
                x: 399,
                y: 209,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 446,
                y: 186,
              },
              {
                x: 457,
                y: 186,
              },
              {
                x: 457,
                y: 210,
              },
              {
                x: 446,
                y: 210,
              },
            ],
          },
        },
        {
          description: "Saturated",
          boundingPoly: {
            vertices: [
              {
                x: 35,
                y: 227,
              },
              {
                x: 141,
                y: 229,
              },
              {
                x: 141,
                y: 250,
              },
              {
                x: 35,
                y: 248,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 150,
                y: 230,
              },
              {
                x: 156,
                y: 230,
              },
              {
                x: 156,
                y: 247,
              },
              {
                x: 150,
                y: 247,
              },
            ],
          },
        },
        {
          description: "saturés",
          boundingPoly: {
            vertices: [
              {
                x: 165,
                y: 228,
              },
              {
                x: 244,
                y: 229,
              },
              {
                x: 244,
                y: 250,
              },
              {
                x: 165,
                y: 249,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 253,
                y: 231,
              },
              {
                x: 265,
                y: 231,
              },
              {
                x: 265,
                y: 249,
              },
              {
                x: 253,
                y: 249,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 274,
                y: 234,
              },
              {
                x: 285,
                y: 234,
              },
              {
                x: 285,
                y: 253,
              },
              {
                x: 274,
                y: 253,
              },
            ],
          },
        },
        {
          description: "+",
          boundingPoly: {
            vertices: [
              {
                x: 34,
                y: 263,
              },
              {
                x: 47,
                y: 263,
              },
              {
                x: 47,
                y: 276,
              },
              {
                x: 34,
                y: 276,
              },
            ],
          },
        },
        {
          description: "Trans",
          boundingPoly: {
            vertices: [
              {
                x: 54,
                y: 257,
              },
              {
                x: 114,
                y: 258,
              },
              {
                x: 114,
                y: 278,
              },
              {
                x: 54,
                y: 277,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 122,
                y: 259,
              },
              {
                x: 129,
                y: 259,
              },
              {
                x: 129,
                y: 277,
              },
              {
                x: 122,
                y: 277,
              },
            ],
          },
        },
        {
          description: "trans",
          boundingPoly: {
            vertices: [
              {
                x: 136,
                y: 260,
              },
              {
                x: 191,
                y: 261,
              },
              {
                x: 191,
                y: 279,
              },
              {
                x: 136,
                y: 278,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 199,
                y: 259,
              },
              {
                x: 229,
                y: 260,
              },
              {
                x: 229,
                y: 283,
              },
              {
                x: 199,
                y: 282,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 234,
                y: 260,
              },
              {
                x: 237,
                y: 260,
              },
              {
                x: 237,
                y: 283,
              },
              {
                x: 234,
                y: 283,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 401,
                y: 239,
              },
              {
                x: 445,
                y: 239,
              },
              {
                x: 445,
                y: 262,
              },
              {
                x: 401,
                y: 262,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 447,
                y: 239,
              },
              {
                x: 457,
                y: 239,
              },
              {
                x: 457,
                y: 262,
              },
              {
                x: 447,
                y: 262,
              },
            ],
          },
        },
        {
          description: "Cholesterol",
          boundingPoly: {
            vertices: [
              {
                x: 15,
                y: 296,
              },
              {
                x: 150,
                y: 297,
              },
              {
                x: 150,
                y: 317,
              },
              {
                x: 15,
                y: 316,
              },
            ],
          },
        },
        {
          description: "/Cholestérol",
          boundingPoly: {
            vertices: [
              {
                x: 159,
                y: 296,
              },
              {
                x: 309,
                y: 297,
              },
              {
                x: 309,
                y: 319,
              },
              {
                x: 159,
                y: 318,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 318,
                y: 297,
              },
              {
                x: 330,
                y: 297,
              },
              {
                x: 330,
                y: 316,
              },
              {
                x: 318,
                y: 316,
              },
            ],
          },
        },
        {
          description: "mg",
          boundingPoly: {
            vertices: [
              {
                x: 340,
                y: 301,
              },
              {
                x: 372,
                y: 301,
              },
              {
                x: 372,
                y: 321,
              },
              {
                x: 340,
                y: 321,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 398,
                y: 293,
              },
              {
                x: 443,
                y: 295,
              },
              {
                x: 442,
                y: 319,
              },
              {
                x: 397,
                y: 317,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 436,
                y: 297,
              },
              {
                x: 456,
                y: 298,
              },
              {
                x: 455,
                y: 315,
              },
              {
                x: 435,
                y: 314,
              },
            ],
          },
        },
        {
          description: "Sodium",
          boundingPoly: {
            vertices: [
              {
                x: 14,
                y: 336,
              },
              {
                x: 104,
                y: 337,
              },
              {
                x: 104,
                y: 357,
              },
              {
                x: 14,
                y: 356,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 113,
                y: 337,
              },
              {
                x: 121,
                y: 337,
              },
              {
                x: 121,
                y: 356,
              },
              {
                x: 113,
                y: 356,
              },
            ],
          },
        },
        {
          description: "Sodium",
          boundingPoly: {
            vertices: [
              {
                x: 129,
                y: 336,
              },
              {
                x: 218,
                y: 337,
              },
              {
                x: 218,
                y: 357,
              },
              {
                x: 129,
                y: 356,
              },
            ],
          },
        },
        {
          description: "20",
          boundingPoly: {
            vertices: [
              {
                x: 228,
                y: 338,
              },
              {
                x: 253,
                y: 338,
              },
              {
                x: 253,
                y: 356,
              },
              {
                x: 228,
                y: 356,
              },
            ],
          },
        },
        {
          description: "mg",
          boundingPoly: {
            vertices: [
              {
                x: 263,
                y: 342,
              },
              {
                x: 295,
                y: 342,
              },
              {
                x: 295,
                y: 362,
              },
              {
                x: 263,
                y: 362,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 414,
                y: 335,
              },
              {
                x: 422,
                y: 335,
              },
              {
                x: 422,
                y: 354,
              },
              {
                x: 414,
                y: 354,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 436,
                y: 336,
              },
              {
                x: 455,
                y: 336,
              },
              {
                x: 455,
                y: 354,
              },
              {
                x: 436,
                y: 354,
              },
            ],
          },
        },
        {
          description: "Carbohydrate",
          boundingPoly: {
            vertices: [
              {
                x: 13,
                y: 375,
              },
              {
                x: 176,
                y: 374,
              },
              {
                x: 176,
                y: 401,
              },
              {
                x: 13,
                y: 402,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 183,
                y: 377,
              },
              {
                x: 192,
                y: 377,
              },
              {
                x: 192,
                y: 396,
              },
              {
                x: 183,
                y: 396,
              },
            ],
          },
        },
        {
          description: "Glucides",
          boundingPoly: {
            vertices: [
              {
                x: 199,
                y: 376,
              },
              {
                x: 303,
                y: 375,
              },
              {
                x: 303,
                y: 396,
              },
              {
                x: 199,
                y: 397,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 314,
                y: 377,
              },
              {
                x: 320,
                y: 377,
              },
              {
                x: 320,
                y: 395,
              },
              {
                x: 314,
                y: 395,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 333,
                y: 381,
              },
              {
                x: 345,
                y: 381,
              },
              {
                x: 345,
                y: 401,
              },
              {
                x: 333,
                y: 401,
              },
            ],
          },
        },
        {
          description: "Fibre",
          boundingPoly: {
            vertices: [
              {
                x: 33,
                y: 416,
              },
              {
                x: 88,
                y: 417,
              },
              {
                x: 88,
                y: 437,
              },
              {
                x: 33,
                y: 436,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 97,
                y: 416,
              },
              {
                x: 103,
                y: 416,
              },
              {
                x: 103,
                y: 435,
              },
              {
                x: 97,
                y: 435,
              },
            ],
          },
        },
        {
          description: "Fibres",
          boundingPoly: {
            vertices: [
              {
                x: 112,
                y: 417,
              },
              {
                x: 180,
                y: 418,
              },
              {
                x: 180,
                y: 437,
              },
              {
                x: 112,
                y: 436,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 196,
                y: 416,
              },
              {
                x: 206,
                y: 416,
              },
              {
                x: 206,
                y: 440,
              },
              {
                x: 196,
                y: 440,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 210,
                y: 422,
              },
              {
                x: 221,
                y: 422,
              },
              {
                x: 221,
                y: 441,
              },
              {
                x: 210,
                y: 441,
              },
            ],
          },
        },
        {
          description: "0",
          boundingPoly: {
            vertices: [
              {
                x: 403,
                y: 373,
              },
              {
                x: 447,
                y: 374,
              },
              {
                x: 446,
                y: 397,
              },
              {
                x: 402,
                y: 396,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 449,
                y: 374,
              },
              {
                x: 459,
                y: 374,
              },
              {
                x: 458,
                y: 397,
              },
              {
                x: 448,
                y: 397,
              },
            ],
          },
        },
        {
          description: "4",
          boundingPoly: {
            vertices: [
              {
                x: 415,
                y: 416,
              },
              {
                x: 428,
                y: 416,
              },
              {
                x: 428,
                y: 434,
              },
              {
                x: 415,
                y: 434,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 437,
                y: 417,
              },
              {
                x: 457,
                y: 417,
              },
              {
                x: 457,
                y: 434,
              },
              {
                x: 437,
                y: 434,
              },
            ],
          },
        },
        {
          description: "Sugars",
          boundingPoly: {
            vertices: [
              {
                x: 31,
                y: 456,
              },
              {
                x: 110,
                y: 455,
              },
              {
                x: 110,
                y: 481,
              },
              {
                x: 31,
                y: 482,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 118,
                y: 457,
              },
              {
                x: 126,
                y: 457,
              },
              {
                x: 126,
                y: 476,
              },
              {
                x: 118,
                y: 476,
              },
            ],
          },
        },
        {
          description: "Sucres",
          boundingPoly: {
            vertices: [
              {
                x: 134,
                y: 456,
              },
              {
                x: 210,
                y: 455,
              },
              {
                x: 210,
                y: 476,
              },
              {
                x: 134,
                y: 477,
              },
            ],
          },
        },
        {
          description: "0g",
          boundingPoly: {
            vertices: [
              {
                x: 219,
                y: 458,
              },
              {
                x: 252,
                y: 458,
              },
              {
                x: 252,
                y: 481,
              },
              {
                x: 219,
                y: 481,
              },
            ],
          },
        },
        {
          description: "Protein",
          boundingPoly: {
            vertices: [
              {
                x: 11,
                y: 496,
              },
              {
                x: 96,
                y: 497,
              },
              {
                x: 96,
                y: 517,
              },
              {
                x: 11,
                y: 516,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 104,
                y: 497,
              },
              {
                x: 113,
                y: 497,
              },
              {
                x: 113,
                y: 516,
              },
              {
                x: 104,
                y: 516,
              },
            ],
          },
        },
        {
          description: "Protéines",
          boundingPoly: {
            vertices: [
              {
                x: 121,
                y: 496,
              },
              {
                x: 234,
                y: 497,
              },
              {
                x: 234,
                y: 518,
              },
              {
                x: 121,
                y: 517,
              },
            ],
          },
        },
        {
          description: "1",
          boundingPoly: {
            vertices: [
              {
                x: 246,
                y: 495,
              },
              {
                x: 256,
                y: 495,
              },
              {
                x: 256,
                y: 520,
              },
              {
                x: 246,
                y: 520,
              },
            ],
          },
        },
        {
          description: "g",
          boundingPoly: {
            vertices: [
              {
                x: 264,
                y: 503,
              },
              {
                x: 276,
                y: 503,
              },
              {
                x: 276,
                y: 521,
              },
              {
                x: 264,
                y: 521,
              },
            ],
          },
        },
        {
          description: "Vitamin",
          boundingPoly: {
            vertices: [
              {
                x: 10,
                y: 545,
              },
              {
                x: 93,
                y: 545,
              },
              {
                x: 93,
                y: 565,
              },
              {
                x: 10,
                y: 565,
              },
            ],
          },
        },
        {
          description: "A",
          boundingPoly: {
            vertices: [
              {
                x: 103,
                y: 545,
              },
              {
                x: 118,
                y: 545,
              },
              {
                x: 118,
                y: 564,
              },
              {
                x: 103,
                y: 564,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 127,
                y: 545,
              },
              {
                x: 134,
                y: 545,
              },
              {
                x: 134,
                y: 564,
              },
              {
                x: 127,
                y: 564,
              },
            ],
          },
        },
        {
          description: "Vitamine",
          boundingPoly: {
            vertices: [
              {
                x: 141,
                y: 545,
              },
              {
                x: 238,
                y: 545,
              },
              {
                x: 238,
                y: 565,
              },
              {
                x: 141,
                y: 565,
              },
            ],
          },
        },
        {
          description: "A",
          boundingPoly: {
            vertices: [
              {
                x: 247,
                y: 545,
              },
              {
                x: 263,
                y: 545,
              },
              {
                x: 263,
                y: 565,
              },
              {
                x: 247,
                y: 565,
              },
            ],
          },
        },
        {
          description: "6",
          boundingPoly: {
            vertices: [
              {
                x: 418,
                y: 546,
              },
              {
                x: 430,
                y: 546,
              },
              {
                x: 430,
                y: 566,
              },
              {
                x: 418,
                y: 566,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 440,
                y: 547,
              },
              {
                x: 461,
                y: 547,
              },
              {
                x: 461,
                y: 566,
              },
              {
                x: 440,
                y: 566,
              },
            ],
          },
        },
        {
          description: "Vitamin",
          boundingPoly: {
            vertices: [
              {
                x: 9,
                y: 586,
              },
              {
                x: 92,
                y: 586,
              },
              {
                x: 92,
                y: 606,
              },
              {
                x: 9,
                y: 606,
              },
            ],
          },
        },
        {
          description: "C/",
          boundingPoly: {
            vertices: [
              {
                x: 100,
                y: 583,
              },
              {
                x: 141,
                y: 583,
              },
              {
                x: 141,
                y: 610,
              },
              {
                x: 100,
                y: 610,
              },
            ],
          },
        },
        {
          description: "Vitamine",
          boundingPoly: {
            vertices: [
              {
                x: 143,
                y: 583,
              },
              {
                x: 238,
                y: 583,
              },
              {
                x: 238,
                y: 610,
              },
              {
                x: 143,
                y: 610,
              },
            ],
          },
        },
        {
          description: "C",
          boundingPoly: {
            vertices: [
              {
                x: 249,
                y: 586,
              },
              {
                x: 264,
                y: 586,
              },
              {
                x: 264,
                y: 607,
              },
              {
                x: 249,
                y: 607,
              },
            ],
          },
        },
        {
          description: "4",
          boundingPoly: {
            vertices: [
              {
                x: 418,
                y: 588,
              },
              {
                x: 431,
                y: 588,
              },
              {
                x: 431,
                y: 607,
              },
              {
                x: 418,
                y: 607,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 440,
                y: 589,
              },
              {
                x: 461,
                y: 589,
              },
              {
                x: 461,
                y: 608,
              },
              {
                x: 440,
                y: 608,
              },
            ],
          },
        },
        {
          description: "Calcium",
          boundingPoly: {
            vertices: [
              {
                x: 7,
                y: 627,
              },
              {
                x: 98,
                y: 627,
              },
              {
                x: 98,
                y: 648,
              },
              {
                x: 7,
                y: 648,
              },
            ],
          },
        },
        {
          description: "/",
          boundingPoly: {
            vertices: [
              {
                x: 108,
                y: 628,
              },
              {
                x: 115,
                y: 628,
              },
              {
                x: 115,
                y: 647,
              },
              {
                x: 108,
                y: 647,
              },
            ],
          },
        },
        {
          description: "Calcium",
          boundingPoly: {
            vertices: [
              {
                x: 123,
                y: 627,
              },
              {
                x: 214,
                y: 627,
              },
              {
                x: 214,
                y: 648,
              },
              {
                x: 123,
                y: 648,
              },
            ],
          },
        },
        {
          description: "2",
          boundingPoly: {
            vertices: [
              {
                x: 419,
                y: 630,
              },
              {
                x: 431,
                y: 630,
              },
              {
                x: 431,
                y: 650,
              },
              {
                x: 419,
                y: 650,
              },
            ],
          },
        },
        {
          description: "%",
          boundingPoly: {
            vertices: [
              {
                x: 441,
                y: 631,
              },
              {
                x: 462,
                y: 631,
              },
              {
                x: 462,
                y: 650,
              },
              {
                x: 441,
                y: 650,
              },
            ],
          },
        },
      ],
      annotations: {
        keyIsDown: false,
        currentPath: [],
        memorizedGraph: {},
        lastElement: { x: 0, y: 0 },
      },
      convexHalls: {},
      cursor: { x: 0, y: 0 },
    };
  },
  computed: {
    currentLinks: function() {
      if (this.annotations.currentPath.length < 1) {
        return "";
      }
      return getPath(
        this.annotations.currentPath.map((path) => getCenter(path))
      );
    },
  },
  methods: {
    getCenter: function(path) {
      return getCenter(path);
    },
    // loadOCR: async function() {
    //   this.loading = true;
    //   const {
    //     responses: [{ textAnnotations: anotations }],
    //   } = await axios(
    //     "https://world.openfoodfacts.org/images/products/084/316/706/7253/2.json"
    //   );
    //   this.anotations = anotations;
    //   this.loading = false;
    // },
    click: function(path, event) {
      // this.boxes[path].visible = !this.boxes[path].visible;
      if (!this.annotations.keyIsDown && path) {
        //We are now making links
        this.annotations.keyIsDown = true;
        this.annotations.currentPath = [path];
        this.annotations.lastElement = getCenter(path);
        this.cursor.x = event.offsetX;
        this.cursor.y = event.offsetY;
      } else {
        //we should stop making links
        this.annotations.keyIsDown = false;

        //save graph
        this.annotations.currentPath.forEach((path) => {
          if (this.annotations.memorizedGraph[path] === undefined) {
            this.annotations.memorizedGraph[path] = [];
          }
        });
        this.annotations.currentPath.forEach((path, index) => {
          if (index > 0) {
            const otherPath = this.annotations.currentPath[index - 1];
            const start = otherPath > path ? otherPath : path;
            const end = otherPath <= path ? otherPath : path;

            if (
              !this.annotations.memorizedGraph[start].find((x) => x === end)
            ) {
              this.annotations.memorizedGraph[start].push(end);
            }
          }
        });

        this.annotations.currentPath = [];
      }
    },
    moveAt: function(event) {
      if (!this.annotations.keyIsDown) {
        return null;
      }
      this.cursor.x = event.offsetX;
      this.cursor.y = event.offsetY;
    },
    mouseover: function(path) {
      if (!this.annotations.keyIsDown) {
        return null;
      }
      if (
        this.annotations.currentPath[
          this.annotations.currentPath.length - 1
        ] === path
      ) {
        // The current box is the last one added -> so we remove it
        if (this.annotations.currentPath.length > 1) {
          this.annotations.currentPath.pop();
          this.annotations.lastElement = getCenter(
            this.annotations.currentPath[
              this.annotations.currentPath.length - 1
            ]
          );
        }
      } else if (!this.annotations.currentPath.find((x) => x === path)) {
        this.annotations.currentPath.push(path);
        this.annotations.lastElement = getCenter(path);
      }
    },
    nextStep: function() {
      this.click();
      if (this.currentState === 0) {
        //Create Cells
        // this.boxes = {
        //   ...this.boxes,
        //   ...getHullPaths(this.annotations.memorizedGraph),
        // };
        this.convexHalls = getHullPaths(this.annotations.memorizedGraph);
        if (Object.keys(this.convexHalls).length !== 0) {
          // this.currentState += 1;
          Object.keys(this.boxes).forEach((key) => {
            this.boxes[key].toDelete = !Object.keys(
              this.annotations.memorizedGraph
            ).includes(key);
          });
          this.annotations.keyIsDown = false;
          this.annotations.currentPath = [];
          this.annotations.lastElement = { x: 0, y: 0 };
        }
      }
    },
  },
  watch: {
    textAnnotations: function(newTextAnnotations) {
      this.boxes = getBoxes(newTextAnnotations);
    },
  },
  mounted: function() {
    // this.loadOCR();
    this.boxes = getBoxes(this.textAnnotations);
  },
};
</script>

<style scoped>
.imageContainer {
  position: relative;
  display: inline-block;
}

.imageContainer svg {
  position: absolute;
  top: 0;
  left: 0;
}
.box:hover {
  stroke: red;
  fill: red;
  fill-opacity: 0.1;
  cursor: pointer;
}

.toDelete {
  fill: red;
  fill-opacity: 0.3;
}

.inVisible {
  stroke: red;
  fill: red;
  fill-opacity: 0.2;
  cursor: pointer;
}
.currentLink,
.currentBoxesCenter {
  pointer-events: none;
  stroke: blue;
  stroke-width: 5;
  fill: none;
}

.savedLink,
.savedBoxesCenter {
  pointer-events: none;
  stroke: black;
  stroke-width: 5;
  fill: none;
}

.convexhall {
  pointer-events: none;
  stroke: blue;
  stroke-width: 5;
  fill: none;
}
</style>
