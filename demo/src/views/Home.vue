<template web>
  <div class="w-page">
    <div class="w-container">
      <img src="~/assets/logo.png" alt="logo">
      <HelloWorld :msg="msg"/>
    </div>
  </div>
</template>
<template native>
  <Page>
    <ActionBar :title="navbarTitle"/>
    <GridLayout rows="auto, auto">
      <!-- copy-webpack-plugin copies asset from src/assets to project output/build directory /assets -->
      <Image src="~/assets/logo.png" row="0" class="m-20"/>
      <HelloWorld :msg="msg" row="1"/>
    </GridLayout>
  </Page>
</template>
<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import HelloWorld from 'components/HelloWorld.vue';
  // import { ShadowDirective } from '../../../src/vue-shadow';

  const { VUE_APP_MODE, VUE_APP_PLATFORM } = process.env;

  @Component({
    name: 'home',
    components: {
      HelloWorld,
    },
    // directives: {
    //   'shadow': ShadowDirective,
    // }
  })
  export default class Home extends Vue {
    private navbarTitle: string = `Home.vue `;
    private msg: string = `Mode=${VUE_APP_MODE} and Platform=${VUE_APP_PLATFORM}`;
  }

</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  @import '~styles/style-one';
  @import '~styles/style-two';

  img, Image {
    height: 20%;
    width: 20%;
    display: block;
    margin: auto;
    margin-top: 4em;
  }
</style>
