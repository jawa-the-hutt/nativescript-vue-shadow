<template>
  <Page>
    <ActionBar class="action-bar">
      <Label class="action-bar-title" :text="navbarTitle"></Label>
    </ActionBar>
    <!-- <Home></Home> -->
    <GridLayout rows="auto" class="page">
      <Button :text="`Home`" @tap="goTo()"></Button>
    </GridLayout>
  </Page>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Home from './views/Home.vue';

@Component({
  components: {
    Home
  }
})
export default class App extends Vue {
  private navbarTitle: string = `Nativescript-Vue-Shadow Demo`;

  private goTo() {
    // @ts-ignore
    this.$navigateTo(Home);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss"></style>
