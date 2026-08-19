import { ComponentFixture, TestBed } from '@angular/core/testing';

import { pokedex } from '../models/pokedex.model';
import { BASE_TYPES, TypeColor, TypeName } from '../models/type-table.model';
import { PokemonSelector, PokemonSlotSelection } from './pokemon-selector';

describe('PokemonSelector', () => {
  let component: PokemonSelector;
  let fixture: ComponentFixture<PokemonSelector>;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PokemonSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should render six empty slots', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.add-slot');

    expect(buttons.length).toBe(6);
    expect(fixture.nativeElement.querySelector('.clear-team-button')).toBeTruthy();
  });

  it('should choose a Pokemon matching every selected type and emit it', () => {
    const selections: PokemonSlotSelection[] = [];
    component.pokemonSelected.subscribe((selection: PokemonSlotSelection) => {
      selections.push(selection);
    });

    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[4]]);
    component.selectPokemon(pokedex[0]);
    component.confirmSelection();

    const selectedPokemon = component.selectedPokemon()[0];

    expect(selectedPokemon).toBeTruthy();
    expect(selectedPokemon?.type).toContain(TypeName.grass);
    expect(selections[0].slotIndex).toBe(0);
    expect(selections[0].pokemon).toBe(selectedPokemon);
    expect(selections[0].types).toEqual(selectedPokemon?.type);
    expect(selections[0].mode).toBe('defend');
    expect(component.activeSlot()).toBeNull();
  });

  it('should replace the slot when confirming another selection', () => {
    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[1]]);
    component.selectPokemon(pokedex[3]);
    component.confirmSelection();
    const firstPokemonId: number | undefined = component.selectedPokemon()[0]?.id;

    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[2]]);
    component.selectPokemon(pokedex[6]);
    component.confirmSelection();
    const secondPokemon = component.selectedPokemon()[0];

    expect(secondPokemon).toBeTruthy();
    expect(secondPokemon?.id).not.toBe(firstPokemonId);
    expect(secondPokemon?.type).toContain(TypeName.water);
  });

  it('should clear the modal without changing the slot when cancelled', () => {
    component.openSlot(2);
    component.updatePendingTypes([BASE_TYPES[3]]);
    component.cancelSelection();

    expect(component.activeSlot()).toBeNull();
    expect(component.selectedPokemon()[2]).toBeNull();
  });

  it('should render the selected Pokemon header and four action buttons', () => {
    const selectedPokemon = pokedex[0];
    const selected: Array<typeof selectedPokemon | null> = [selectedPokemon, null, null, null, null, null];

    component.selectedPokemon.set(selected);
    fixture.detectChanges();

    const result: HTMLElement = fixture.nativeElement.querySelector('.pokemon-result');
    const sprite: HTMLImageElement = result.querySelector('img')!;
    const actionButtons: NodeListOf<HTMLButtonElement> = result.querySelectorAll('.pokemon-action');

    expect(sprite.src).toContain(selectedPokemon.image?.thumbnail);
    expect(sprite.alt).toBe(selectedPokemon.name.english);
    expect(result.textContent).toContain(selectedPokemon.name.english);
    expect(actionButtons.length).toBe(4);
    expect(result.querySelector('.clear-slot')).toBeTruthy();
  });

  it('should emit an action click and clear a selected slot', () => {
    const selectedPokemon = pokedex[0];
    const selected: Array<typeof selectedPokemon | null> = [selectedPokemon, null, null, null, null, null];
    const actions: Array<{ slotIndex: number; actionIndex: number }> = [];
    const selections: PokemonSlotSelection[] = [];

    component.selectedPokemon.set(selected);
    component.actionClicked.subscribe((action) => actions.push(action));
    component.pokemonSelected.subscribe((selection: PokemonSlotSelection) => selections.push(selection));
    fixture.detectChanges();

    const result: HTMLElement = fixture.nativeElement.querySelector('.pokemon-result');
    const actionButton: HTMLButtonElement = result.querySelector('.pokemon-action')!;
    const clearButton: HTMLButtonElement = result.querySelector('.clear-slot')!;

    actionButton.click();
    clearButton.click();

    expect(actions).toEqual([{ slotIndex: 0, actionIndex: 0 }]);
    expect(component.selectedPokemon()[0]).toBeNull();
    expect(selections[0]).toEqual({ slotIndex: 0, pokemon: null, types: [], mode: 'defend' });
  });

  it('should update an action button after confirming one type', () => {
    component.handleActionClick(0, 2);
    component.updatePendingActionType([BASE_TYPES[1]]);
    component.confirmActionSelection();

    fixture.detectChanges();

    expect(component.getActionLabel(0, 2)).toBe('FIRE');
    expect(component.getActionColor(0, 2)).toBe(BASE_TYPES[1].color);
    expect(component.activeAction()).toBeNull();
  });

  it('should report action types in attack mode', () => {
    fixture.componentRef.setInput('mode', 'attack');
    component.selectedPokemon.set([pokedex[0], null, null, null, null, null]);
    const selections: PokemonSlotSelection[] = [];

    component.pokemonSelected.subscribe((selection: PokemonSlotSelection) => selections.push(selection));
    component.handleActionClick(0, 0);
    component.updatePendingActionType([BASE_TYPES[1]]);
    component.confirmActionSelection();

    expect(selections[0]).toEqual({
      slotIndex: 0,
      pokemon: pokedex[0],
      types: [TypeName.fire],
      mode: 'attack',
    });
  });

  it('should create a diagonal border gradient for dual-type Pokemon', () => {
    const borderBackground: string = component.getPokemonBorderBackground(pokedex[0]);

    expect(borderBackground).toBe(
      `linear-gradient(#000000, #000000) padding-box, linear-gradient(to bottom right, ${TypeColor[TypeName.grass]}, ${TypeColor[TypeName.poison]}) border-box`,
    );
  });

  it('should filter the Pokemon grid by types and English name', () => {
    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[4]]);
    component.updateSearchText('saur');

    expect(component.filteredPokemon().map((pokemon: typeof pokedex[number]) => pokemon.name.english)).toEqual([
      'Bulbasaur',
      'Ivysaur',
      'Venusaur',
    ]);
  });

  it('should remove Pokemon containing excluded types', () => {
    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[4]]);
    component.updateExcludedTypes([BASE_TYPES[7]]);

    const filteredPokemon: typeof pokedex = component.filteredPokemon();

    expect(filteredPokemon.length).toBeGreaterThan(0);
    expect(filteredPokemon.every((pokemon) => pokemon.type.includes(TypeName.grass))).toBe(true);
    expect(filteredPokemon.every((pokemon) => !pokemon.type.includes(TypeName.poison))).toBe(true);
    expect(filteredPokemon.some((pokemon) => pokemon.name.english === 'Bulbasaur')).toBe(false);
  });

  it('should require a selected Pokemon before confirming', () => {
    component.openSlot(0);
    component.updatePendingTypes([BASE_TYPES[0]]);

    component.confirmSelection();

    expect(component.selectedPokemon()[0]).toBeNull();
    expect(component.activeSlot()).toBe(0);
  });

  it('should restore Pokemon IDs and action types from session storage', async () => {
    component.selectedPokemon.set([pokedex[0], null, null, null, null, null]);
    component.actionSelections.set([
      [BASE_TYPES[1], null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    component['persistSessionState']();

    const restoredFixture: ComponentFixture<PokemonSelector> = TestBed.createComponent(PokemonSelector);
    const restoredComponent: PokemonSelector = restoredFixture.componentInstance;
    await restoredFixture.whenStable();

    expect(restoredComponent.selectedPokemon()[0]?.id).toBe(pokedex[0].id);
    expect(restoredComponent.getActionSelection(0, 0)?.name).toBe(BASE_TYPES[1].name);
  });

  it('should clear the team, move selections, storage, and table updates', () => {
    const selections: PokemonSlotSelection[] = [];
    component.selectedPokemon.set([pokedex[0], pokedex[3], null, null, null, null]);
    component.pokemonSelected.subscribe((selection: PokemonSlotSelection) => selections.push(selection));
    component['persistSessionState']();

    component.clearTeam();

    expect(component.selectedPokemon()).toEqual([null, null, null, null, null, null]);
    expect(component.actionSelections()).toEqual([
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(sessionStorage.getItem('type-table:pokemon-selector:defend')).toBeNull();
    expect(selections).toHaveLength(6);
    expect(selections.every((selection: PokemonSlotSelection) => selection.types.length === 0)).toBe(true);
  });
});
