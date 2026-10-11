<script>
export default {
  name: "ConfirmationPopup",
  props:['popup','popupName','confirmAction', 'cancelAction', 'actions']
}
</script>

<template>
  <div class="menu-info-popup shadow2"
       v-if="popup.show"
       :class="{'menu-info-popup-appear': popup.slide,
         }"

  >
    <h4>{{ popup.title }}</h4>
    <p class="template-string-formatting"> {{popup.text}}</p>
    <div class="menu-info-popup-buttons">
      <button class="btn-default shadow2 alert"
              @click.prevent="confirmAction(popup.action)"

      >{{actions[0]}}
      </button>
      <button class="btn-default shadow2"
              @click.prevent="cancelAction(popup.action)"

      >{{actions[1]}}
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>