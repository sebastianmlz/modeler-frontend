import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DiagramModule } from '@syncfusion/ej2-angular-diagrams';

@NgModule({
  imports: [
    BrowserModule,
    DiagramModule
  ],
  exports: [
    DiagramModule
  ]
})
export class AppModule { }
