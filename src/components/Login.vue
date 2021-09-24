<template>
  <sui-modal :open="modalIsOpen">
    <sui-modal-content>
      <sui-modal-description>
        <sui-header>Login</sui-header>
        <p>
          Your not logged in OFF, your contribution will not be attributed
        </p>
      </sui-modal-description>
    </sui-modal-content>

    <sui-segment aligned="right">
      <sui-button @click.native="closeModal">
        {{ $t("helper.close") }}
      </sui-button>
    </sui-segment>
  </sui-modal>
</template>

<script>
import off from "../off";

export default {
  data: function() {
    return {
      isAuthenticated: null,
      modalIsOpen: false,
    };
  },

  methods: {
    closeModal: function() {
      this.modalIsOpen = false;
    },
    openModal: function() {
      this.modalIsOpen = true;
    },
  },
  watch: {
    isAuthenticated: function(newIsAuthenticated, oldIsAuthenticated) {
      console.log({
        newIsAuthenticated,
        oldIsAuthenticated,
      });
      if (oldIsAuthenticated === newIsAuthenticated) {
        return;
      }

      switch (newIsAuthenticated) {
        case true:
          this.closeModal();
          break;
        case false:
          this.openModal();
      }
    },
  },
  mounted() {
    off
      .getAuthStatus()
      .then((message) => {
        console.log(message);
        this.isAuthenticated = true;
      })
      .catch((err) => {
        console.log(err);
        this.isAuthenticated = false;
      });
  },
};
</script>

<style scoped>
.menu-container {
  margin-bottom: 1rem;
}
.helpButton:hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
