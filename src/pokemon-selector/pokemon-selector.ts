import {
  ChangeDetectionStrategy,
  Component,
  computed,
  InputSignal,
  OnInit,
  output,
  Signal,
  signal,
  WritableSignal,
  input,
} from '@angular/core';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { Pokemon, pokedex } from '../models/pokedex.model';
import { BASE_TYPES, BaseTypeEntry, TypeColor, TypeName } from '../models/type-table.model';
import { TypeSelector } from '../type-selector/type-selector';

const SLOT_COUNT: number = 6;
const POKEMON_GRID_COLUMNS: number = 3;

export type PokemonSelectorMode = 'attack' | 'defend';

export interface PokemonSlotSelection {
  slotIndex: number;
  pokemon: Pokemon | null;
  types: TypeName[];
  mode: PokemonSelectorMode;
}

export interface PokemonActionClick {
  slotIndex: number;
  actionIndex: number;
}

interface ActiveAction {
  slotIndex: number;
  actionIndex: number;
}

interface PokemonSelectorSessionState {
  pokemonIds: Array<number | null>;
  actionTypes: Array<Array<TypeName | null>>;
}

const SESSION_STORAGE_PREFIX: string = 'type-table:pokemon-selector:';

@Component({
  selector: 'app-pokemon-selector',
  imports: [CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, TypeSelector],
  templateUrl: './pokemon-selector.html',
  styleUrl: './pokemon-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSelector implements OnInit {
  readonly mode: InputSignal<PokemonSelectorMode> = input<PokemonSelectorMode>('defend');
  readonly slots: number[] = Array.from({ length: SLOT_COUNT }, (_, index: number) => index);
  readonly actionButtons: number[] = [0, 1, 2, 3];
  readonly actionSelections: WritableSignal<Array<Array<BaseTypeEntry | null>>> = signal<
    Array<Array<BaseTypeEntry | null>>
  >(
    Array.from({ length: SLOT_COUNT }, () =>
      Array.from({ length: this.actionButtons.length }, () => null),
    ),
  );
  readonly selectedPokemon: WritableSignal<Array<Pokemon | null>> = signal<Array<Pokemon | null>>(
    Array.from({ length: SLOT_COUNT }, () => null),
  );
  readonly activeSlot: WritableSignal<number | null> = signal<number | null>(null);
  readonly activeAction: WritableSignal<ActiveAction | null> = signal<ActiveAction | null>(null);
  readonly pendingTypes: WritableSignal<BaseTypeEntry[]> = signal<BaseTypeEntry[]>([]);
  readonly searchText: WritableSignal<string> = signal<string>('');
  readonly pendingPokemon: WritableSignal<Pokemon | null> = signal<Pokemon | null>(null);
  readonly filteredPokemon: Signal<Pokemon[]> = computed<Pokemon[]>(() => {
    const searchTerm: string = this.searchText().trim().toLowerCase();
    const selectedTypes: BaseTypeEntry[] = this.pendingTypes();

    return pokedex.filter((pokemon: Pokemon) => {
      const matchesTypes: boolean = selectedTypes.every((type: BaseTypeEntry) =>
        pokemon.type.includes(type.name),
      );
      const matchesName: boolean = pokemon.name.english.toLowerCase().includes(searchTerm);

      return matchesTypes && matchesName;
    });
  });
  readonly filteredPokemonRows: Signal<Pokemon[][]> = computed<Pokemon[][]>(() => {
    const filteredPokemon: Pokemon[] = this.filteredPokemon();
    const rowCount: number = Math.ceil(filteredPokemon.length / POKEMON_GRID_COLUMNS);

    return Array.from({ length: rowCount }, (_, rowIndex: number) =>
      filteredPokemon.slice(
        rowIndex * POKEMON_GRID_COLUMNS,
        (rowIndex + 1) * POKEMON_GRID_COLUMNS,
      ),
    );
  });

  trackPokemonRow(rowIndex: number): number {
    return rowIndex;
  }
  readonly pendingActionType: WritableSignal<BaseTypeEntry | null> =
    signal<BaseTypeEntry | null>(null);
  readonly pokemonSelected = output<PokemonSlotSelection>();
  readonly actionClicked = output<PokemonActionClick>();

  ngOnInit(): void {
    this.restoreSessionState();
    this.emitRestoredSelections();
  }

  openSlot(slotIndex: number): void {
    this.activeSlot.set(slotIndex);
    this.pendingTypes.set([]);
    this.searchText.set('');
    this.pendingPokemon.set(null);
  }

  cancelSelection(): void {
    this.activeSlot.set(null);
    this.pendingTypes.set([]);
    this.searchText.set('');
    this.pendingPokemon.set(null);
  }

  cancelActionSelection(): void {
    this.activeAction.set(null);
    this.pendingActionType.set(null);
  }

  updatePendingTypes(types: BaseTypeEntry[]): void {
    this.pendingTypes.set(types);
    this.clearPendingPokemonIfFilteredOut();
  }

  updateSearchText(searchText: string): void {
    this.searchText.set(searchText);
    this.clearPendingPokemonIfFilteredOut();
  }

  selectPokemon(pokemon: Pokemon): void {
    if (this.filteredPokemon().some((filtered: Pokemon) => filtered.id === pokemon.id)) {
      this.pendingPokemon.set(pokemon);
    }
  }

  confirmSelection(): void {
    const slotIndex: number | null = this.activeSlot();
    const pokemon: Pokemon | null = this.pendingPokemon();

    if (slotIndex === null || pokemon === null) {
      return;
    }
    const nextSelection: Array<Pokemon | null> = [...this.selectedPokemon()];

    nextSelection[slotIndex] = pokemon;
    this.selectedPokemon.set(nextSelection);
    this.persistSessionState();
    this.pokemonSelected.emit({
      slotIndex,
      pokemon,
      types: this.getReportedTypes(slotIndex, pokemon),
      mode: this.mode(),
    });
    this.cancelSelection();
  }

  removeSlot(slotIndex: number): void {
    const nextSelection: Array<Pokemon | null> = [...this.selectedPokemon()];
    const nextActions: Array<Array<BaseTypeEntry | null>> = this.actionSelections().map(
      (slotSelections: Array<BaseTypeEntry | null>, currentSlotIndex: number) =>
        currentSlotIndex === slotIndex
          ? slotSelections.map(() => null)
          : slotSelections,
    );

    nextSelection[slotIndex] = null;
    this.selectedPokemon.set(nextSelection);
    this.actionSelections.set(nextActions);
    this.persistSessionState();
    this.pokemonSelected.emit({ slotIndex, pokemon: null, types: [], mode: this.mode() });
  }

  clearTeam(): void {
    const hadSelections: boolean = this.selectedPokemon().some(
      (pokemon: Pokemon | null) => pokemon !== null,
    );

    this.selectedPokemon.set(Array.from({ length: SLOT_COUNT }, () => null));
    this.actionSelections.set(
      Array.from({ length: SLOT_COUNT }, () =>
        Array.from({ length: this.actionButtons.length }, () => null),
      ),
    );

    const storage: Storage | null = this.getSessionStorage();
    storage?.removeItem(this.getSessionStorageKey());

    if (hadSelections) {
      this.slots.forEach((slotIndex: number) => {
        this.pokemonSelected.emit({ slotIndex, pokemon: null, types: [], mode: this.mode() });
      });
    }
  }

  handleActionClick(slotIndex: number, actionIndex: number): void {
    this.activeAction.set({ slotIndex, actionIndex });
    this.pendingActionType.set(null);
    this.actionClicked.emit({ slotIndex, actionIndex });
  }

  updatePendingActionType(types: BaseTypeEntry[]): void {
    this.pendingActionType.set(types[0] ?? null);
  }

  confirmActionSelection(): void {
    const activeAction: ActiveAction | null = this.activeAction();
    const selectedType: BaseTypeEntry | null = this.pendingActionType();

    if (activeAction === null || selectedType === null) {
      return;
    }

    const nextSelections: Array<Array<BaseTypeEntry | null>> = this.actionSelections().map(
      (slotSelections: Array<BaseTypeEntry | null>, slotIndex: number) =>
        slotIndex === activeAction.slotIndex
          ? slotSelections.map(
              (actionSelection: BaseTypeEntry | null, actionIndex: number) =>
                actionIndex === activeAction.actionIndex ? selectedType : actionSelection,
            )
          : slotSelections,
    );

    this.actionSelections.set(nextSelections);
    this.persistSessionState();
    const pokemon: Pokemon | null = this.selectedPokemon()[activeAction.slotIndex];

    this.pokemonSelected.emit({
      slotIndex: activeAction.slotIndex,
      pokemon,
      types: this.getReportedTypes(activeAction.slotIndex, pokemon),
      mode: this.mode(),
    });
    this.cancelActionSelection();
  }

  getActionSelection(slotIndex: number, actionIndex: number): BaseTypeEntry | null {
    return this.actionSelections()[slotIndex][actionIndex];
  }

  getActionLabel(slotIndex: number, actionIndex: number): string {
    return this.getActionSelection(slotIndex, actionIndex)?.name.toUpperCase() ?? '+';
  }

  getActionColor(slotIndex: number, actionIndex: number): string {
    return this.getActionSelection(slotIndex, actionIndex)?.color ?? 'transparent';
  }

  getPokemonBorderBackground(pokemon: Pokemon): string {
    const firstColor: string = TypeColor[pokemon.type[0]];
    const secondColor: string = TypeColor[pokemon.type[1] ?? pokemon.type[0]];

    return `linear-gradient(#000000, #000000) padding-box, linear-gradient(to bottom right, ${firstColor}, ${secondColor}) border-box`;
  }

  private getReportedTypes(slotIndex: number, pokemon: Pokemon | null): TypeName[] {
    if (this.mode() === 'defend') {
      return pokemon ? [...pokemon.type] : [];
    }

    const actionTypes: TypeName[] = this.actionSelections()[slotIndex]
      .filter((selection: BaseTypeEntry | null): selection is BaseTypeEntry => selection !== null)
      .map((selection: BaseTypeEntry) => selection.name);

    return [...new Set(actionTypes)];
  }

  hasSelectedPokemon(): boolean {
    return this.pendingPokemon() !== null;
  }

  private clearPendingPokemonIfFilteredOut(): void {
    const selectedPokemon: Pokemon | null = this.pendingPokemon();

    if (
      selectedPokemon !== null &&
      !this.filteredPokemon().some((pokemon: Pokemon) => pokemon.id === selectedPokemon.id)
    ) {
      this.pendingPokemon.set(null);
    }
  }

  private persistSessionState(): void {
    const storage: Storage | null = this.getSessionStorage();

    if (storage === null) {
      return;
    }

    const state: PokemonSelectorSessionState = {
      pokemonIds: this.selectedPokemon().map((pokemon: Pokemon | null) => pokemon?.id ?? null),
      actionTypes: this.actionSelections().map((slotSelections: Array<BaseTypeEntry | null>) =>
        slotSelections.map((selection: BaseTypeEntry | null) => selection?.name ?? null),
      ),
    };

    storage.setItem(this.getSessionStorageKey(), JSON.stringify(state));
  }

  private restoreSessionState(): void {
    const storage: Storage | null = this.getSessionStorage();

    if (storage === null) {
      return;
    }

    const storedState: string | null = storage.getItem(this.getSessionStorageKey());

    if (storedState === null) {
      return;
    }

    try {
      const state: unknown = JSON.parse(storedState);

      if (!this.isSessionState(state)) {
        return;
      }

      const restoredPokemon: Array<Pokemon | null> = state.pokemonIds.map(
        (pokemonId: number | null) => pokedex.find((pokemon: Pokemon) => pokemon.id === pokemonId) ?? null,
      );
      const restoredActions: Array<Array<BaseTypeEntry | null>> = state.actionTypes.map(
        (slotSelections: Array<TypeName | null>) =>
          slotSelections.map(
            (typeName: TypeName | null) =>
              BASE_TYPES.find((type: BaseTypeEntry) => type.name === typeName) ?? null,
          ),
      );

      this.selectedPokemon.set(restoredPokemon);
      this.actionSelections.set(restoredActions);
    } catch {
      storage.removeItem(this.getSessionStorageKey());
    }
  }

  private emitRestoredSelections(): void {
    this.selectedPokemon().forEach((pokemon: Pokemon | null, slotIndex: number) => {
      if (pokemon !== null) {
        this.pokemonSelected.emit({
          slotIndex,
          pokemon,
          types: this.getReportedTypes(slotIndex, pokemon),
          mode: this.mode(),
        });
      }
    });
  }

  private isSessionState(state: unknown): state is PokemonSelectorSessionState {
    if (typeof state !== 'object' || state === null) {
      return false;
    }

    const candidate: Partial<PokemonSelectorSessionState> = state as Partial<PokemonSelectorSessionState>;

    return (
      Array.isArray(candidate.pokemonIds) &&
      candidate.pokemonIds.length === SLOT_COUNT &&
      candidate.pokemonIds.every((pokemonId: unknown) => pokemonId === null || typeof pokemonId === 'number') &&
      Array.isArray(candidate.actionTypes) &&
      candidate.actionTypes.length === SLOT_COUNT &&
      candidate.actionTypes.every(
        (slotSelections: unknown) =>
          Array.isArray(slotSelections) &&
          slotSelections.length === this.actionButtons.length &&
          slotSelections.every((typeName: unknown) => typeName === null || this.isTypeName(typeName)),
      )
    );
  }

  private isTypeName(value: unknown): value is TypeName {
    return typeof value === 'string' && Object.values(TypeName).includes(value as TypeName);
  }

  private getSessionStorage(): Storage | null {
    try {
      return globalThis.sessionStorage;
    } catch {
      return null;
    }
  }

  private getSessionStorageKey(): string {
    return `${SESSION_STORAGE_PREFIX}${this.mode()}`;
  }
}
