import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DiagramModule } from '@syncfusion/ej2-angular-diagrams';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    DiagramModule
  ],
  exports: [
    DiagramModule
  ]
})
export class AppModule { }
