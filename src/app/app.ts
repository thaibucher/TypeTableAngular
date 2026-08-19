import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PokemonSelector, PokemonSlotSelection } from '../pokemon-selector/pokemon-selector';
import { TypeTableComponent } from '../type-table-component/type-table-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PokemonSelector, TypeTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TypeTableAngular');

  protected setPokemon(
    selection: PokemonSlotSelection,
    typeTable: TypeTableComponent,
  ): void {
    typeTable.applyExternalHighlight({
      direction: selection.mode === 'attack' ? 'horizontal' : 'vertical',
      slotIndex: selection.slotIndex,
      types: selection.types,
    });
  }
}
