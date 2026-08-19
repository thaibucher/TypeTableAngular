import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TypeTableComponent } from '../type-table-component/type-table-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TypeTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TypeTableAngular');
}
