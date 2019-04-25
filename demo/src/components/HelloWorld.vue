<template>
  <div>
    <div class="message">{{msg}}</div>
    <img src="~/components/icon.png" alt="logo">
  </div>
</template>
<script lang="ts">
  import { Component, Vue, Prop } from 'vue-property-decorator';

  @Component({
    name: 'HelloWorld',
  })
  export default class HelloWorld extends Vue {
    @Prop(String) private msg!: string;
  }
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .message {
    color: #42b983;
    display: block;
    margin: auto;
    margin-top: 4em;
    text-align: center;
  }
  img {
    height: 75px;
    display: block;
    margin: auto;
    margin-top: 4em;
  }
</style>
