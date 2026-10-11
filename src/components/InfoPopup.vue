<script>
export default {
  name: "InfoPopup",
  // props: ['popup', 'popupName', 'closePopup','remove'],
  props:{
    popup:{
      default:null
    },
    popupName : {
      default: '',
    },
    closePopup:{
      default: ()=>{}
    },
    removeOKButton:{
      default:false,
    }

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
            v-if="!removeOKButton"
            @click.prevent="this.$emit('closePopup', popupName)">
      OK
    </button>
  </div>
</template>

<style scoped>

</style>