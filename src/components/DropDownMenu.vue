<script>
function customDropDown()
{
  const selectTriggers = document.querySelectorAll(".select-trigger");
  const optionsContainers = document.querySelectorAll(".options");
  const options = document.querySelectorAll(".option");
  const arrows = document.querySelectorAll('.arrow');

  console.log(optionsContainers);
  console.log(selectTriggers);

  selectTriggers.forEach((selectTrigger, index)=>{
    selectTrigger.addEventListener("click", function () {
      console.log('clicked');

      if(optionsContainers[index].classList.contains('show-options'))
      {
        console.log('should remove');
        optionsContainers[index].classList.remove("show-options");
        arrows[index].classList.remove('arrow-animate');

      }
      else
      {
        console.log('should add');
        arrows[index].classList.add('arrow-animate');
        optionsContainers[index].classList.add("show-options");

      }
    });
  })



  options.forEach((option) => {
    option.addEventListener("click", function () {
      const selectedValue = option.textContent;

      optionsContainers.forEach((optionsContainer, index)=>{
        if(optionsContainer.classList.contains('show-options'))
        {
          selectTriggers[index].textContent = selectedValue;
          optionsContainer.classList.remove("show-options");
          arrows[index].classList.remove('arrow-animate');
        }
      })



    });
  });

  document.addEventListener("click", function (event) {

    selectTriggers.forEach((selectTrigger,index)=>{
      if (!selectTrigger.contains(event.target)) {
        optionsContainers[index].classList.remove("show-options");
        arrows[index].classList.remove('arrow-animate');

      }
    })

  });
}
export default {
  name: "DropDownMenu",
  props: ['options', 'myClass'],
  mounted()
  {
    customDropDown();
  }
}
</script>

<template>
  <div class="custom-select">
    <div class="select-trigger"
         :class="myClass"

    >
      <span class="custom-placeholder">Select an option</span>
      <span class="arrow">&#9660;</span>
    </div>
    <div class="options"
         :class="myClass"

    >
      <div class="option"
           v-for="(option,index) in options"
      >{{option}}</div>
    </div>
  </div>
</template>

<style scoped>

</style>