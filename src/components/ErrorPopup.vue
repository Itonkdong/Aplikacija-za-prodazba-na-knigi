<script>
export default {
  name: "ErrorPopup",
  props: ['popup', 'popupName', 'closePopup'],
  created()
  {
    console.log(this.popup, this.popupName)
  }
}
</script>

<template>
  <div class="menu-info-popup shadow2"
       v-if="popup.show"
       :class="{'menu-info-popup-appear': popup.slide}">
    <h4>{{popup.title}}</h4>
    <p>{{popup.text}}</p>
    <button class="btn-default shadow2"
            @click.prevent="this.$emit('closePopup', popupName)">
    OK
    </button>
    </div>
</template>

<style scoped>

</style>