<template>
  <Page>
    <ActionBar class="action-bar">
      <Label class="action-bar-title" :text="navbarTitle"></Label>
    </ActionBar>
    <GridLayout rows="*, auto" columns="*" class="page">
      <StackLayout v-if="showAndroid" row="0" col="0">
        <Button class="h3 m-15 p-10 ex1" :text="`elevation: ${elevation}`" v-shadow="elevation" @tap="toggleClass()"></Button>
        <Label
          :class="'h3 m-15 p-15 ' + bclass"
          :text="` elevation: ${elevation}, pressedElevation: ${elevation + 5}, forcePressAnimation: true`"
          v-shadow="{ elevation, pressedElevation: elevation + 5, forcePressAnimation: true }"
          @tap="dummy()"
        ></Label>
        <Label
          :class="'h3 m-15 p-10 ' + bclass2"
          :text="`elevation: ${elevation}, bgcolor: #006968, shape: shape.RECTANGLE, corderRadius: 15`"
          v-shadow="{ elevation, shape: shape.RECTANGLE, bgcolor: '#006968', cornerRadius: 15 }"
        ></Label>
        <Label :class="'h1 m-15 p-15 ' + bclass3" :text="'☺'" v-shadow="androidData" @tap="dummy()"></Label>
        <Label :class="'h3 m-15 lbl5'" :text="`elevation: ${elevation}, bgcolor: #ff1744, shape: shape.OVAL`"></Label>
      </StackLayout>
      <StackLayout v-else row="0" col="0">
        <Label class="h3 m-15 p-10 ex1" :text="`elevation: ${elevation}`" v-shadow="elevation"></Label>
        <Label :class="'h3 m-15 p-10 ' + bclass" :text="` elevation: ${elevation}`" v-shadow="{ elevation }"></Label>
        <Label :class="'h3 m-15 p-10 ' + bclass2" :text="`elevation: ${elevation}, shadowOffset: 4`" v-shadow="{ elevation: elevation, shadowOffset: 4 }"></Label>
        <Label :class="'h1 m-15 p-15 ' + bclass3" :text="'☺'" v-shadow="iosData"></Label>
        <Label :class="'h3 m-15 lbl5'" :text="`elevation: ${elevation}, offset: 10, opacity: 0.5, radius: 10`"></Label>
      </StackLayout>
      <ListPicker row="1" col="0" :items="stdElevations" selectedIndex="2" @selectedIndexChange="setElevation($event)" class="p-15"></ListPicker>
    </GridLayout>
  </Page>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { AndroidData, IOSData, Elevation, Shape, ShapeEnum } from '../../../';
import { ListPicker } from '@nativescript/core/ui/list-picker';
import { isAndroid, isIOS } from '@nativescript/core/platform';

@Component({
  name: 'Home'
})
export default class Home extends Vue {
  private navbarTitle: string = `Nativescript-Vue-Shadow Demo`;

  private elevation: Elevation = 2;
  private shape = ShapeEnum;
  private stdElevations: string[] = [];
  private androidData!: AndroidData;
  private iosData!: IOSData;
  private bclass: string = 'ex2';
  private bclass2: string = 'ex3';
  private bclass3: string = 'ex4';
  private showAndroid: boolean = false;

  public created() {
    if (isAndroid) {
      this.showAndroid = true;
    }
    for (const x in Elevation) {
      if (isNaN(parseInt(x, 10))) {
        this.stdElevations.push(x);
      }
    }
    this.androidData = this.getAndroidData();
    this.iosData = this.getIOSData();
  }

  private getAndroidData(): AndroidData {
    return {
      elevation: this.elevation,
      bgcolor: '#ff1744',
      shape: ShapeEnum.OVAL,
      pressedElevation: this.elevation + 15,
      forcePressAnimation: true
    };
  }

  private getIOSData(): IOSData {
    return {
      elevation: this.elevation,
      shadowColor: '#000000',
      shadowOffset: 10,
      shadowOpacity: 0.5,
      shadowRadius: 10
    };
  }

  private toggleClass() {
    this.bclass = this.bclass === 'ex2' ? 'ex3' : 'ex2';
    this.bclass2 = this.bclass2 === 'ex3' ? 'ex4' : 'ex3';
    this.bclass3 = this.bclass3 === 'ex4' ? 'ex3' : 'ex4';
  }

  private setElevation(newValue) {
    const picker = newValue.object as ListPicker;
    this.elevation = Elevation[this.stdElevations[picker.selectedIndex]];
    this.androidData = this.getAndroidData();
    this.iosData = this.getIOSData();
  }

  //dummy tap function to make a view clickable
  private dummy() {
    // console.log('pressed dummy()');
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
@import '~@nativescript/theme/core';

.btn {
  font-size: 18;
}

label {
  text-align: center;
}

.ex1,
.ex2 {
  background-color: white;
}

.ex3,
.ex4 {
  color: white;
}

.ex3 {
  background-color: #006968;
  border-radius: 15;
}

.ex4 {
  background-color: #ff1744;
  border-radius: 50%;
  width: 80;
  height: 80;
}
</style>
