import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BASE_TYPES, BaseTypeEntry, TypeName } from '../models/type-table.model';
import { POKEMON_TYPE_COMPATIBILITY, TypeSelector } from './type-selector';

describe('TypeSelector', () => {
  let component: TypeSelector;
  let fixture: ComponentFixture<TypeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(TypeSelector);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lines', 3);
    fixture.componentRef.setInput('maxSelections', 2);
    await fixture.whenStable();
  });

  it('should render all 18 types in uppercase', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons.length).toBe(BASE_TYPES.length);
    expect(buttons[0].textContent.trim()).toBe('NORMAL');
    expect(buttons[17].textContent.trim()).toBe('FAIRY');
  });

  it('should use the requested number of grid lines', () => {
    expect(component.gridStyle()).toEqual({
      'grid-template-columns': 'repeat(6, minmax(0, 1fr))',
      'grid-template-rows': 'repeat(3, minmax(2.75rem, auto))',
    });
  });

  it('should sort selections by id and emit the current selection', () => {
    const emittedSelections: number[][] = [];
    component.selectionChange.subscribe((selection) => {
      emittedSelections.push(selection.map((type) => type.id));
    });

    component.toggleType(BASE_TYPES[5]);
    component.toggleType(BASE_TYPES[1]);

    expect(component.selectedTypes().map((type) => type.id)).toEqual([1, 5]);
    expect(emittedSelections).toEqual([[5], [1, 5]]);
  });

  it('should disable unselected types when the selection limit is reached', () => {
    component.toggleType(BASE_TYPES[0]);
    component.toggleType(BASE_TYPES[1]);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[2].disabled).toBe(true);
  });

  it('should disable type combinations that do not exist in the Pokedex', () => {
    const compatibleType: BaseTypeEntry = BASE_TYPES.find(
      (type) => POKEMON_TYPE_COMPATIBILITY[TypeName.grass].has(type.name),
    )!;
    const incompatibleType: BaseTypeEntry = BASE_TYPES.find(
      (type) =>
        type.name !== TypeName.grass &&
        !POKEMON_TYPE_COMPATIBILITY[TypeName.grass].has(type.name),
    )!;

    component.toggleType(BASE_TYPES.find((type) => type.name === TypeName.grass)!);

    expect(component.isDisabled(compatibleType)).toBe(false);
    expect(component.isDisabled(incompatibleType)).toBe(true);
  });

  it('should allow an exclude selector to select up to 17 types', () => {
    fixture.componentRef.setInput('maxSelections', 17);
    fixture.componentRef.setInput('filterIncompatibleTypes', false);

    BASE_TYPES.slice(0, 17).forEach((type: BaseTypeEntry) => component.toggleType(type));

    expect(component.selectedTypes()).toHaveLength(17);
    expect(component.isDisabled(BASE_TYPES[17])).toBe(true);
  });

  it('should force specified types to be disabled', () => {
    fixture.componentRef.setInput('forceDisabledTypes', [BASE_TYPES[0]]);

    expect(component.isDisabled(BASE_TYPES[0])).toBe(true);
  });

  it('should unselect a type when it becomes force-disabled', async () => {
    component.toggleType(BASE_TYPES[0]);
    fixture.componentRef.setInput('forceDisabledTypes', [BASE_TYPES[0]]);
    await fixture.whenStable();

    expect(component.selectedTypes()).toEqual([]);
  });

  it('should describe impossible type combinations in the disabled tooltip', () => {
    component.toggleType(BASE_TYPES.find((type) => type.name === TypeName.grass)!);
    const incompatibleType: BaseTypeEntry = BASE_TYPES.find(
      (type) =>
        type.name !== TypeName.grass &&
        !POKEMON_TYPE_COMPATIBILITY[TypeName.grass].has(type.name),
    )!;

    expect(component.getDisabledTooltip(incompatibleType)).toBe(
      `No Pokemon found with the combination GRASS + ${incompatibleType.name.toUpperCase()}`,
    );
  });

  it('should describe the maximum selection limit in the disabled tooltip', () => {
    component.toggleType(BASE_TYPES[0]);
    component.toggleType(BASE_TYPES[1]);

    expect(component.getDisabledTooltip(BASE_TYPES[2])).toBe('Maximum of 2 types selected');
  });

  it('should explain force-disabled types in the tooltip', () => {
    fixture.componentRef.setInput('forceDisabledTypes', [BASE_TYPES[0]]);

    expect(component.getDisabledTooltip(BASE_TYPES[0])).toBe(
      'Cannot exclude a type that is already included',
    );
  });

  it('should use a darker color until a type is selected', () => {
    expect(component.getButtonColor(BASE_TYPES[0])).toBe('rgb(121, 121, 86)');

    component.toggleType(BASE_TYPES[0]);

    expect(component.getButtonColor(BASE_TYPES[0])).toBe(BASE_TYPES[0].color);
  });
});
