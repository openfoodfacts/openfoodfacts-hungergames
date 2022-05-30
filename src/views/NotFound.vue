<template>
  <center>
    <img src="~/../assets/logo-404.png" class="logo" />
    <h1 class="text-404">
      Whoops! The page you're looking for can't be found.
    </h1>
    <p class="redirect-404">
      Want to play some games? <a href="/">Click here</a>
    </p>
  </center>
</template>

<script>
export default {
  name: "NotFound",
};
</script>

<style scoped>
.logo {
  width:60%;
  height:auto;
}
.text-404 {
  font-size: 2em;
  margin-top:-2rem;
}
.redirect-404 {
  padding-top: 1em;
  font-size: 1.2em;
}
.redirect-404 a {
  text-decoration: none;
}
@media only screen and (max-width: 767px) {
  .logo {
    width:100%;
  }
}
</style>
