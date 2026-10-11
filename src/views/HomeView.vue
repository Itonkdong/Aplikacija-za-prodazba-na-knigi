<script>
export default {
  name: "HomeView",
  props:['goToLink']
}
</script>

<template>
  <section class="hero">
    <div class="hero-text">
      <h3 class="hero-text-title">
        Books that everyone loves
      </h3>
      <p class="hero-text-para">
        Looking to buy some new books?
        Wait no more! <br>Come and take a look at our shop!
      </p>
      <div class="hero-buttons">
        <button class="btn-default accent-clr accent shadow2"
                @click.prevent="goToLink('/shop')"

        >Shop now</button>
        <button class="btn-default accent primary-clr shadow2"
                @click.prevent="goToLink('/shop/new')"
        >Explore New Books</button>
      </div>
    </div>
    <div class="hero-img">
      <img src="@/Assets/Images/book-images/book-1.png" alt="Book Image 1">
    </div>
  </section>



</template>

<style scoped>

</style>