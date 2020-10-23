<template>
  <div class="app">
    <!-- <div class="states">
      <div
        v-for="(xxx, index) in messages"
        :key="index"
        v-bind:index="index"
        v-bind:class="{
          doneState: index < currentState,
          currentState: index == currentState,
        }"
      >
        <span>
          {{ parseInt(index) + 1 }}
        </span>
      </div>
    </div> -->
    <p class="explanations">{{ this.messages[this.currentState] }}</p>
    <div class="imageContainer" @click="click('')">
      <img :src="urlImg" />
      <svg
        :width="imageWidth"
        :height="imageHeight"
        @mousemove="moveAt"
        @mouseleave.stop="stopDragging"
        @mouseup.stop="stopDragging"
        :class="{ desactivateListenersInside: isDraggingCropRectangle }"
      >
        <path
          v-for="box in visibleBoxes"
          :d="box.path"
          :key="'box-' + box.id"
          @click.stop="currentState >= 0 && click(box.id, $event)"
          v-on:mouseover="currentState >= 0 && mouseover(box.id)"
          v-bind:class="{
            toDelete: box.toDelete,
            selectable: currentState >= 0,
          }"
          class="box"
        />

        <!-- Links in creation -->
        <path v-if="currentLinks" :d="currentLinks" class="currentLink" />
        <circle
          v-for="key in annotations.currentPath"
          :key="'creationCenter-' + key"
          :cx="getCenter(boxes[key].points).x"
          :cy="getCenter(boxes[key].points).y"
          r="5"
          class="currentBoxesCenter"
        />

        <!-- saved links -->
        <g
          v-for="(neighbours, nodeKey) in annotations.memorizedGraph"
          :key="'node-group-' + nodeKey"
        >
          <g
            v-for="neighbourKey in neighbours"
            :key="'savedLink-' + nodeKey + ' - ' + neighbourKey"
          >
            <line
              :x1="getCenter(boxes[nodeKey].points).x"
              :y1="getCenter(boxes[nodeKey].points).y"
              :x2="getCenter(boxes[neighbourKey].points).x"
              :y2="getCenter(boxes[neighbourKey].points).y"
              @click.stop="clickLink(nodeKey, neighbourKey)"
              v-bind:class="{
                noPointerEvent: keyIsDown,
                youWantToDelete: !keyIsDown,
              }"
              class="helpLink"
            />
            <!-- the first link is biger in order to be easier to select (for deleting link interface) -->
            <line
              :x1="getCenter(boxes[nodeKey].points).x"
              :y1="getCenter(boxes[nodeKey].points).y"
              :x2="getCenter(boxes[neighbourKey].points).x"
              :y2="getCenter(boxes[neighbourKey].points).y"
              class="savedLink"
            />
          </g>
          <circle
            :cx="getCenter(boxes[nodeKey].points).x"
            :cy="getCenter(boxes[nodeKey].points).y"
            r="15"
            @click.stop="clickNode(nodeKey)"
            :class="{
              youWantToDeleteBoxCenter: !keyIsDown,
              noPointerEvent: keyIsDown,
            }"
          />
          <circle
            :cx="getCenter(boxes[nodeKey].points).x"
            :cy="getCenter(boxes[nodeKey].points).y"
            r="5"
            class="savedBoxesCenter"
          />
        </g>

        <!-- saved lines-->
        <g v-if="showSavedLines" v-bind:class="{ unfill: canValidate }">
          <g
            v-for="(line, lineId) in savedLines"
            :key="'saved-line-' + lineId"
            class="validatedGroup validatedLine"
          >
            <path :d="line.path" />
            <text
              v-if="canNotValidate"
              :x="line.center.x"
              :y="line.center.y"
              dominant-baseline="middle"
              text-anchor="middle"
            >
              {{ "line : " + lineId }}
            </text>
          </g>
        </g>
        <!-- saved columns-->
        <g v-if="showSavedColumns" v-bind:class="{ unfill: canValidate }">
          <g
            v-for="(column, columnId) in savedColumns"
            :key="'saved-column-' + columnId"
            class="validatedGroup validatedColumn"
          >
            <path :d="column.path" />
            <text
              v-if="canNotValidate"
              :x="column.center.x"
              :y="column.center.y"
              dominant-baseline="middle"
              text-anchor="middle"
            >
              {{ "column : " + columnId }}
            </text>
          </g>
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
          v-for="(group, groupId) in convexHalls"
          :d="group.path"
          :key="'convexHalls-' + groupId"
          class="convexhall"
        />

        <!-- cropping rectangle -->

        <g v-if="showCorppingRectangle" class="croppingRectangle">
          <path
            :d="
              `M ${cropRectangle.start.x} ${cropRectangle.start.y} L
          ${cropRectangle.start.x} ${cropRectangle.end.y} L
          ${cropRectangle.end.x} ${cropRectangle.end.y} L ${cropRectangle.end.x}
          ${cropRectangle.start.y} Z`
            "
          />
          <circle
            :cx="cropRectangle.start.x"
            :cy="cropRectangle.start.y"
            r="10"
            @mousedown.stop="startDraggingStart"
          />
          <circle
            :cx="cropRectangle.end.x"
            :cy="cropRectangle.end.y"
            r="10"
            @mousedown.stop="startDraggingEnd"
          />
        </g>
      </svg>
      <div class="subActions">
        <button v-on:click="previousStep">Prev (p)</button>
        <button v-on:click="nextStep">Next (n)</button>
      </div>

      <div class="checkboxContainer">
        <div class="ui checkbox">
          <input
            type="checkbox"
            name="perfect-data"
            id="perfect-data"
            value="perfect-data"
            v-model="dataQuality"
          />
          <label for="perfect-data">The text recognition is perfect</label>
        </div>
        <div class="ui checkbox">
          <input
            type="checkbox"
            name="bad-data"
            id="bad-data"
            value="bad-data"
            v-model="dataQuality"
          />
          <label for="bad-data">Some words are missing</label>
        </div>
      </div>

      <div class="actions">
        <button v-on:click="skip">skip (k)</button>
        <button
          v-on:click="validate"
          :class="{ canValidate: canValidate, disabled: !canValidate }"
        >
          validate (v)
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  points2Key,
  getBoxes,
  getCenter,
  points2Path,
  getHullPaths,
  sortKeys,
  getConvexPoints,
  isInRectangle,
} from "../utils/tableAnotation.js";

const messages = {
  "-1": "Déplacer le rectangle pour le faire contenir le tableau",
  0: "Merci de regrouper entre elles les boîtes faisant partie d'une même case du tableau",
  1: "Si des boites rouges font partie du tableau, merci de les ajouter (vous pouvez sélectionner une case seule)",
  2: "Reliez entre elles les cellules d'une même ligne",
  3: "Reliez entre elles les cellules d'une même colonne",
};

export default {
  name: "TableAnnotationView",
  components: {},
  data: function() {
    return {
      dataQuality: [],
      messages: messages,
      loading: false,
      currentState: -1,
      boxes: [],
      imageHeight: 0,
      imageWidth: 0,
      insightId: null,
      batchOfInsights: [],
      annotations: {
        annnotated: false,
        keyIsDown: false,
        currentPath: [],
        memorizedGraph: {},
        lastElement: { x: 0, y: 0 },
      },
      cropRectangle: {
        start: {
          x: 10,
          y: 10,
        },
        end: {
          //TODO replace by image size
          x: 100,
          y: 100,
        },
        currentlyDragged: null,
      },
      convexHalls: {},
      cursor: { x: 0, y: 0 },
      lineIterator: 0,
      savedLines: {},
      columnIterator: 0,
      savedColumns: {},
      savedCellsGraph: {},
    };
  },
  computed: {
    currentLinks: function() {
      if (this.annotations.currentPath.length < 1) {
        return "";
      }
      return points2Path(
        this.annotations.currentPath.map((boxKey) =>
          getCenter(this.boxes[boxKey].points)
        ),
        false
      );
    },
    keyIsDown: function() {
      return this.annotations.keyIsDown;
    },
    visibleBoxes: function() {
      return Object.keys(this.boxes)
        .filter((key) => this.boxes[key].visible)
        .map((key) => this.boxes[key]);
    },
    showSavedLines: function() {
      return this.currentState === 2 || this.currentState === 4;
    },
    showSavedColumns: function() {
      return this.currentState === 3 || this.currentState === 4;
    },
    canValidate: function() {
      return this.currentState === 4;
    },
    canNotValidate: function() {
      return this.currentState !== 4;
    },
    showCorppingRectangle: function() {
      return this.currentState === -1;
    },
    isDraggingCropRectangle: function() {
      return !!this.cropRectangle.currentlyDragged;
    },
  },
  methods: {
    isSaved: function(key, savingDict) {
      for (let dicKey of Object.keys(savingDict)) {
        if (savingDict[dicKey].keys.findIndex((x) => x === key) >= 0) {
          return true;
        }
      }
      return false;
    },
    reset: function() {
      this.dataQuality = [];
      this.currentState = -1;
      this.boxes = [];
      this.annotations = {
        annnotated: false,
        keyIsDown: false,
        currentPath: [],
        memorizedGraph: {},
        lastElement: { x: 0, y: 0 },
      };
      this.cropRectangle = {
        start: {
          x: 10,
          y: 10,
        },
        end: {
          x: this.imageWidth,
          y: this.imageHeight,
        },
        currentlyDragged: null,
      };
      this.convexHalls = {};
      this.cursor = { x: 0, y: 0 };
      this.lineIterator = 0;
      this.savedLines = {};
      this.columnIterator = 0;
      this.savedColumns = {};
      this.savedCellsGraph = {};
    },
    validate: function() {
      if (!this.canValidate) {
        return null;
      }
      if (this.dataQuality.length === 0) {
        alert("Please give us your opinion on the text recognition");
        return null;
      }
      if (this.dataQuality.length > 1) {
        alert(
          "Please select only one box for giving your opinion on text recognition"
        );
        return null;
      }
      //get ids of boxes concerned by lines and colmuns
      const lines = {};
      const columns = {};
      const boxId2cellId = {};

      Object.keys(this.savedLines).map((lineId) => {
        this.savedLines[lineId].keys.forEach((cellId) => {
          cellId.split("-").forEach((boxId) => {
            if (lines[boxId] === undefined) {
              lines[boxId] = [lineId];
            } else {
              lines[boxId] = [...lines[boxId], lineId];
            }
            if (boxId2cellId[boxId] === undefined) {
              boxId2cellId[boxId] = cellId;
            }
          });
        });
      });

      Object.keys(this.savedColumns).map((columnId) => {
        this.savedColumns[columnId].keys.forEach((cellId) => {
          cellId.split("-").forEach((boxId) => {
            if (columns[boxId] === undefined) {
              columns[boxId] = [columnId];
            } else {
              columns[boxId] = [...columns[boxId], columnId];
            }
            if (boxId2cellId[boxId] === undefined) {
              boxId2cellId[boxId] = cellId;
            }
          });
        });
      });

      const rep = {};

      this.textAnnotations.forEach((annotation) => {
        const key = points2Key(annotation.boundingPoly.vertices);
        let lineIds;
        let columnIds;
        if (lines[key] === undefined) {
          lineIds = [];
        } else {
          lineIds = lines[key];
        }
        if (columns[key] === undefined) {
          columnIds = [];
        } else {
          columnIds = columns[key];
        }

        rep[key] = {
          ...annotation,
          row_index: lineIds,
          column_index: columnIds,
          cell_id: boxId2cellId[key] || null,
        };
      });

      axios.post(
        `https://robotoff.openfoodfacts.org/api/v1/insights/annotate`,
        new URLSearchParams(
          `insight_id=${this.insightId}&annotation=1&data=${JSON.stringify({
            textAnnotations: rep,
            crop: this.cropRectangle,
            dataQuality: this.dataQuality[0],
          })}`
        )
      );

      this.skip();
    },
    getCenter: function(points) {
      return getCenter(points);
    },
    skip: async function() {
      this.batchOfInsights = this.batchOfInsights.slice(1);

      if (this.batchOfInsights.length > 0 && this.batchOfInsights.length < 5) {
        this.loadOCR();
      } else if (this.batchOfInsights.length === 0) {
        await this.loadOCR();
      }
      const vm = this;

      this.urlImg = this.batchOfInsights[0].urlImg;
      this.insightId = this.batchOfInsights[0].insightId;

      const { responses: responses } = await axios.get(
        this.batchOfInsights[0].textAnnotationsUrl
      );
      this.textAnnotations = responses[0].textAnnotations;

      var img = new Image();
      img.onload = function() {
        vm.imageHeight = img.height;
        vm.imageWidth = img.width;

        vm.cropRectangle = {
          start: {
            x: 10,
            y: 10,
          },
          end: {
            x: img.imageWidth,
            y: img.imageHeight,
          },
          currentlyDragged: null,
        };
      };
      img.src = this.urlImg;

      this.reset();

      return null;
    },
    loadOCR: async function() {
      this.loading = true;
      const {
        data: { insights: listOfInsights },
      } = await axios.get(
        "https://robotoff.openfoodfacts.org/api/v1/insights/random?type=nutrition_table_structure"
      );

      this.batchOfInsights = [
        ...this.batchOfInsights,
        ...listOfInsights.map(({ source_image, id }) => {
          return {
            urlImg: `https://static.openfoodfacts.org/images/products${source_image}`,
            textAnnotationsUrl: `https://static.openfoodfacts.org/images/products${source_image
              .split(".")
              .slice(0, -1)
              .join(".")}.json`,
            insightId: id,
          };
        }),
      ];

      this.loading = false;
    },
    clickLink: function(node1, node2) {
      if (!this.annotations.keyIsDown) {
        const [start, end] = sortKeys(node1, node2);

        this.annotations.memorizedGraph = {
          ...this.annotations.memorizedGraph,
          [start]: [
            ...this.annotations.memorizedGraph[start].filter((x) => x !== end),
          ],
        };
      }
    },
    clickNode: function(nodeId) {
      if (!this.annotations.keyIsDown) {
        delete this.annotations.memorizedGraph[nodeId];
        this.annotations.memorizedGraph = {
          ...this.annotations.memorizedGraph,
        };

        Object.keys(this.annotations.memorizedGraph).forEach((key) => {
          const index = this.annotations.memorizedGraph[key].findIndex(
            (x) => x === nodeId
          );
          if (index >= 0) {
            this.annotations.memorizedGraph = {
              ...this.annotations.memorizedGraph,
              [key]: [
                ...this.annotations.memorizedGraph[key].slice(0, index),
                ...this.annotations.memorizedGraph[key].slice(index + 1),
              ],
            };
          }
        });
      }
    },
    click: function(boxKey, event) {
      if (!this.annotations.keyIsDown && boxKey) {
        //We are now making links
        this.annotations.keyIsDown = true;
        this.annotations.currentPath = [boxKey];
        this.annotations.lastElement = getCenter(this.boxes[boxKey].points);
        this.cursor.x = event.offsetX;
        this.cursor.y = event.offsetY;
      } else if (this.annotations.keyIsDown) {
        this.annotations.annnotated = true;

        //we should stop making links
        this.annotations.keyIsDown = false;

        //save graph

        // be sure that each node is a key in dictionary
        this.annotations.currentPath.forEach((boxKey) => {
          if (this.annotations.memorizedGraph[boxKey] === undefined) {
            this.annotations.memorizedGraph[boxKey] = [];
          }
        });

        // fill dictionaly with lexicographic order
        this.annotations.currentPath.forEach((boxKey, index) => {
          if (index > 0) {
            const previousBoxKey = this.annotations.currentPath[index - 1];
            const [start, end] = sortKeys(boxKey, previousBoxKey);

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
      if (this.annotations.keyIsDown) {
        this.cursor.x = event.offsetX;
        this.cursor.y = event.offsetY;
      }
      if (
        this.currentState === -1 &&
        this.cropRectangle.currentlyDragged === "end"
      ) {
        this.cropRectangle.end.x = event.offsetX;
        this.cropRectangle.end.y = event.offsetY;
      }
      if (
        this.currentState === -1 &&
        this.cropRectangle.currentlyDragged === "start"
      ) {
        this.cropRectangle.start.x = event.offsetX;
        this.cropRectangle.start.y = event.offsetY;
      }
    },
    stopDragging: function() {
      this.cropRectangle.currentlyDragged = null;

      Object.keys(this.boxes).forEach((key) => {
        this.boxes[key].toDelete = !isInRectangle(
          this.cropRectangle.start.x,
          this.cropRectangle.start.y,
          this.cropRectangle.end.x,
          this.cropRectangle.end.y,
          this.boxes[key].points
        );
      });
    },
    startDraggingStart: function() {
      this.cropRectangle.currentlyDragged = "start";
    },
    startDraggingEnd: function() {
      this.cropRectangle.currentlyDragged = "end";
    },
    mouseover: function(boxKey) {
      if (!this.annotations.keyIsDown) {
        return null;
      }
      if (
        this.annotations.currentPath[
          this.annotations.currentPath.length - 1
        ] === boxKey
      ) {
        // The current box is the last one added -> so we remove it
        if (this.annotations.currentPath.length > 1) {
          this.annotations.currentPath.pop();
          const lastBoxKey = this.annotations.currentPath[
            this.annotations.currentPath.length - 1
          ];
          this.annotations.lastElement = getCenter(
            this.boxes[lastBoxKey].points
          );
        }
      } else if (!this.annotations.currentPath.find((x) => x === boxKey)) {
        this.annotations.currentPath.push(boxKey);
        this.annotations.lastElement = getCenter(this.boxes[boxKey].points);
      }
    },
    nextStep: function() {
      this.click();
      if (this.currentState === -1) {
        Object.keys(this.boxes).forEach((key) => {
          this.boxes[key].visible = !this.boxes[key].toDelete;
        });
        this.currentState = 0;
      }
      if (
        this.currentState === 0 ||
        (this.annotations.annnotated && this.currentState === 1)
      ) {
        //Show cells created by goupin boxes
        // can append if we click on next for the first time
        // or if we were in the verification step and made modifications

        this.convexHalls = getHullPaths(
          this.annotations.memorizedGraph,
          this.boxes
        );
        if (Object.keys(this.convexHalls).length !== 0) {
          Object.keys(this.boxes).forEach((key) => {
            this.boxes[key].toDelete = !Object.keys(
              this.annotations.memorizedGraph
            ).includes(key);
          });
          this.annotations.keyIsDown = false;
          this.annotations.currentPath = [];
          this.annotations.lastElement = { x: 0, y: 0 };
          this.annotations.annnotated = false;
          this.currentState = 1;
        }
      } else if (this.currentState === 1) {
        // the association boxes -> cells is done by the key in convex hull
        // since the key of a set is the concatenation of the boxes id contained in the cell
        this.savedCellsGraph = { ...this.annotations.memorizedGraph };

        this.boxes = { ...this.convexHalls };
        this.convexHalls = {};

        this.annotations.memorizedGraph = {};
        this.savedLines = {};
        this.lineIterator = 0;

        this.currentState = 2;
        //Now we are ready to select lines
      } else if (this.currentState === 2) {
        if (Object.keys(this.annotations.memorizedGraph).length === 0) {
          if (
            Object.keys(this.boxes).findIndex(
              (key) => !this.isSaved(key, this.savedLines)
            ) < 0
          ) {
            this.currentState = 3;

            this.columnIterator = 0;
            this.savedColumns = {};

            Object.keys(this.savedLines).forEach((lineKey) =>
              this.savedLines[lineKey].keys.forEach((nodeId) => {
                this.boxes[nodeId].visible = true;
              })
            );
          } else {
            alert(
              "Tu n'as rien sélectionné, je ne peux donc pas ajouter de nouvelle ligne"
            );
          }
        } else {
          const points = Object.keys(this.annotations.memorizedGraph).reduce(
            (accumulateur, nodeId) => [
              ...accumulateur,
              ...this.boxes[nodeId].points,
            ],
            []
          );

          const keys = Object.keys(this.annotations.memorizedGraph);
          this.savedLines[this.lineIterator] = {
            keys: [...keys],
            path: points2Path(getConvexPoints(points), true),
            center: getCenter(points),
          };

          this.lineIterator += 1;
          this.annotations.memorizedGraph = {};
        }
      } else if (this.currentState === 3) {
        if (Object.keys(this.annotations.memorizedGraph).length === 0) {
          if (
            Object.keys(this.boxes).findIndex(
              (key) => !this.isSaved(key, this.savedColumns)
            ) < 0
          ) {
            this.currentState = 4;
          } else {
            alert(
              "Tu n'as rien sélectionné, je ne peux donc pas ajouter de nouvelle colonne"
            );
          }
        } else {
          const points = Object.keys(this.annotations.memorizedGraph).reduce(
            (accumulateur, nodeId) => [
              ...accumulateur,
              ...this.boxes[nodeId].points,
            ],
            []
          );
          this.savedColumns[this.columnIterator] = {
            keys: [...Object.keys(this.annotations.memorizedGraph)],
            path: points2Path(getConvexPoints(points), true),
            center: getCenter(points),
          };

          this.columnIterator += 1;
          this.annotations.memorizedGraph = {};
        }
      }
    },
    previousStep: function() {
      this.click();
      if (this.currentState === 0) {
        Object.keys(this.boxes).forEach((key) => {
          this.boxes[key].visible = true;
        });
        this.stopDragging();
        this.annotations.memorizedGraph = {};
        this.annotations.keyIsDown = false;
        this.annotations.currentPath = [];
        this.annotations.lastElement = { x: 0, y: 0 };
        this.annotations.annnotated = false;
        this.currentState = -1;
      } else if (this.currentState === 1) {
        this.currentState = 0;
        //reset current anotations

        this.annotations.memorizedGraph = {};
        this.annotations.keyIsDown = false;
        this.annotations.currentPath = [];
        this.annotations.lastElement = { x: 0, y: 0 };
        this.annotations.annnotated = false;

        //remove saved annotations
        this.convexHalls = {};
        Object.keys(this.boxes).forEach((key) => {
          this.boxes[key].toDelete = false;
        });
      } else if (this.currentState === 2) {
        if (Object.keys(this.annotations.memorizedGraph).length > 0) {
          //remove currently made graph
          this.annotations.memorizedGraph = {};
        } else if (this.lineIterator > 0) {
          // remove last saved line
          this.lineIterator -= 1;

          delete this.savedLines[this.lineIterator];
        } else {
          // go back to cell selection

          this.savedLines = {};
          this.lineIterator = 0;
          this.currentState = 1;

          this.annotations.memorizedGraph = { ...this.savedCellsGraph };

          // refind the OCR boxes
          this.boxes = getBoxes(this.textAnnotations);
          //remove what is outside of the cropped version
          Object.keys(this.boxes).forEach((key) => {
            this.boxes[key].visible = isInRectangle(
              this.cropRectangle.start.x,
              this.cropRectangle.start.y,
              this.cropRectangle.end.x,
              this.cropRectangle.end.y,
              this.boxes[key].points
            );
          });

          // put linked boxes as to be deleted
          Object.keys(this.boxes).forEach((key) => {
            this.boxes[key].toDelete = !Object.keys(
              this.annotations.memorizedGraph
            ).includes(key);
          });

          //get cells
          this.convexHalls = getHullPaths(
            this.annotations.memorizedGraph,
            this.boxes
          );

          //reset annotations
          this.annotations.keyIsDown = false;
          this.annotations.currentPath = [];
          this.annotations.lastElement = { x: 0, y: 0 };
          this.annotations.annnotated = false;
        }
      } else if (this.currentState === 3) {
        if (Object.keys(this.annotations.memorizedGraph).length > 0) {
          //remove currently made graph
          this.annotations.memorizedGraph = {};
        } else if (this.columnIterator > 0) {
          // remove las saved line
          this.columnIterator -= 1;

          delete this.savedColumns[this.columnIterator];
        } else {
          // go back to cell selection

          this.savedColumns = {};
          this.columnIterator = 0;
          this.currentState = 2;

          this.annotations.memorizedGraph = {};

          //reset annotations
          this.annotations.keyIsDown = false;
          this.annotations.currentPath = [];
          this.annotations.lastElement = { x: 0, y: 0 };
          this.annotations.annnotated = false;
        }
      } else if (this.currentState === 4) {
        this.currentState = 3;
      }
    },
  },
  watch: {
    textAnnotations: function(newTextAnnotations) {
      this.boxes = getBoxes(newTextAnnotations);
    },
  },
  mounted: async function() {
    const vm = this;

    await this.loadOCR();

    this.urlImg = this.batchOfInsights[0].urlImg;
    this.insightId = this.batchOfInsights[0].insightId;

    const { responses: responses } = await axios.get(
      this.batchOfInsights[0].textAnnotationsUrl
    );
    this.textAnnotations = responses[0].textAnnotations;

    var img = new Image();
    img.onload = function() {
      vm.imageHeight = img.height;
      vm.imageWidth = img.width;
    };
    img.src = this.urlImg;

    this.boxes = getBoxes(this.textAnnotations);

    window.addEventListener("keyup", function(event) {
      if (event.target.nodeName == "BODY") {
        if (event.key === "k") vm.skip();
        if (event.key === "n") vm.nextStep();
        if (event.key === "v") vm.validate();
        if (event.key === "p") vm.previousStep();
      }
    });
  },
};
</script>

<style scoped>
.app {
  text-align: center;
}

.imageContainer {
  position: relative;
  display: inline-block;
}

.imageContainer svg {
  position: absolute;
  top: 0;
  left: 0;
}
.box {
  fill: blue;
  fill-opacity: 0.1;
  stroke: blue;
  stroke-width: 1;
}

.selectable:hover {
  stroke: blue;
  fill: blue;
  stroke-width: 4;
  fill-opacity: 0.5;
  cursor: pointer;
}

.toDelete {
  fill: red;
  fill-opacity: 0.3;
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

.youWantToDeleteBoxCenter:hover {
  stroke: red;
  stroke-width: 5;
  stroke-dasharray: 5, 5;
  fill: transparent;
}
.youWantToDeleteBoxCenter:hover {
  cursor: pointer;
}
.youWantToDeleteBoxCenter:hover + circle {
  stroke: transparent;
}
.youWantToDelete {
  stroke: transparent;
  stroke-width: 15;
}
.youWantToDelete:hover {
  cursor: pointer;
}
.youWantToDelete:hover + line {
  stroke: red;
  stroke-dasharray: 5, 5;
}

.noPointerEvent {
  pointer-events: none;
}

.convexhall {
  pointer-events: none;
  stroke: blue;
  stroke-width: 5;
  fill: none;
}

.validatedGroup {
  pointer-events: none;
  stroke-width: 5;
  fill-opacity: 0.2;
}

.validatedLine {
  stroke: #aa00ff;
  fill: #aa00ff;
}

.validatedColumn {
  stroke: #4527a0;
  fill: #4527a0;
}
.unfill .validatedGroup {
  fill: none;
}

.validatedGroup text {
  font-size: 1.5rem;
  font-weight: bolder;
  fill: white;
  fill-opacity: 1;
  stroke: none;
}
.states {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 0.5rem;
}
.states div {
  flex-grow: 1;
  height: 2rem;
  text-align: center;
  vertical-align: middle;
  line-height: 2rem;
  text-align: center;
  transition: color 0.2s, background-color 0.2s;
  background-color: lightgrey;
  color: black;
}

.states .currentState {
  background-color: #1769aa;
  color: white;
}
.states .doneState {
  background-color: #2196f3;
  color: white;
}

.explanations {
  font-size: 1.3rem;
}
.actions,
.subActions {
  display: flex;
  justify-content: stretch;
}

.actions button,
.subActions button,
.checkboxContainer .checkbox {
  padding: 1rem;
  font-size: 1.7rem;
  border: 0;
}
.checkboxContainer {
  text-align: left;
}

.checkboxContainer label {
  margin-bottom: 1.5rem;
}
.actions button {
  color: white;
  flex-grow: 1;
}

.subActions button:hover {
  background-color: lightgrey;
  cursor: pointer;
}

.subActions {
  margin-bottom: 1rem;
  justify-content: space-between;
}

.actions button:first-child {
  background-color: red;
}
.actions .canValidate {
  background-color: green;
  cursor: pointer;
}
.actions .disabled {
  background-color: #a5d6a7;
}

.croppingRectangle path {
  stroke: black;
  stroke-width: 5;
  fill: none;
}

.croppingRectangle circle {
  stroke: black;
  stroke-width: 5;
  cursor: pointer;
}

.desactivateListenersInside * {
  pointer-events: none;
}
</style>
