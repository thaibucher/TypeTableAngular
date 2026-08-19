import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeName } from '../models/type-table.model';
import { TypeTableComponent } from './type-table-component';

describe('TypeTableComponent', () => {
  let component: TypeTableComponent;
  let fixture: ComponentFixture<TypeTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TypeTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply left commands as horizontal highlights', () => {
    component.applyExternalHighlight({
      direction: 'horizontal',
      slotIndex: 0,
      types: [TypeName.fire],
    });

    expect(component.getHighlightBoxShadow(1, null)).toContain(component.highlightColors[2]);
    expect(component.getHighlightBoxShadow(null, 1)).toBe('none');
  });

  it('should apply right commands as vertical highlights with the slot color', () => {
    component.applyExternalHighlight({
      direction: 'vertical',
      slotIndex: 1,
      types: [TypeName.water],
    });

    expect(component.getHighlightBoxShadow(null, 2)).toContain(component.highlightColors[3]);
    expect(component.getHighlightBoxShadow(2, null)).toBe('none');
  });

  it('should remove an external slot highlight when its types are empty', () => {
    component.applyExternalHighlight({
      direction: 'horizontal',
      slotIndex: 0,
      types: [TypeName.fire],
    });
    component.applyExternalHighlight({
      direction: 'horizontal',
      slotIndex: 0,
      types: [],
    });

    expect(component.getHighlightBoxShadow(1, null)).toBe('none');
  });

  it('should ignore external columns when creating the derived column', () => {
    component.applyExternalHighlight({
      direction: 'vertical',
      slotIndex: 0,
      types: [TypeName.fire, TypeName.water],
    });

    expect(component.combinedColumns()).toEqual([]);
    expect(component.derivedColumnShown()).toBe(false);
    expect(component.highlightedColumns()).toEqual([1, 2]);
  });

  it('should create the derived column from manually clicked columns', () => {
    component.togglePersistentColumn(1);
    component.togglePersistentColumn(2);

    expect(component.combinedColumns()).toEqual([1, 2]);
    expect(component.derivedColumnShown()).toBe(true);
  });

  it('should compose horizontal and vertical highlight borders at intersections', () => {
    component.applyExternalHighlight({
      direction: 'horizontal',
      slotIndex: 0,
      types: [TypeName.fire],
    });
    component.applyExternalHighlight({
      direction: 'vertical',
      slotIndex: 1,
      types: [TypeName.water],
    });

    const intersectionShadow: string = component.getHighlightBoxShadow(1, 2);

    expect(intersectionShadow).toContain(component.highlightColors[2]);
    expect(intersectionShadow).toContain(component.highlightColors[3]);
    expect(intersectionShadow).toContain('inset 0 4px');
    expect(intersectionShadow).toContain('inset 4px 0');
  });

  it('should combine a hovered column with a manually highlighted column', () => {
    component.togglePersistentColumn(1);
    component.highlightColumn(2);

    expect(component.combinedColumns()).toEqual([1, 2]);
    expect(component.derivedColumnShown()).toBe(true);
  });
});
