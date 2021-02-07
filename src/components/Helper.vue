<template>
  <div>
    <sui-modal :open="open" v-on:changed="close">
      <sui-modal-header>Help page</sui-modal-header>
      <sui-modal-content image>
        <img wrapped size="large" src="~/../assets/logo.png" />
        <sui-modal-description>
          <sui-header>Le logo</sui-header>
          <p>
            Ceci est un très joli logo
          </p>
          <p>Vous ne trouvez pas qu'il ressemble fort à une loupe ?</p>
          <p>
            Il faudrait ici metre un text et une image pour le jeu :
            {{ $router.history.current.path }}
          </p>
        </sui-modal-description>
      </sui-modal-content>
      <sui-modal-actions>
        <sui-button positive @click.native="close">
          OK
        </sui-button>
      </sui-modal-actions>
    </sui-modal>
  </div>
</template>

<script>
export default {
  name: "IntroductionView",
  props: { open: Boolean },
  data: function() {
    return {
      currentPath: this.$router.history.current.path,
    };
  },
  methods: {
    close: function() {
      this.$emit("close-helper");
    },
  },
};
</script>
