import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  InputSignal,
  OutputEmitterRef,
  input,
  output,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Pokemon, pokedex } from '../models/pokedex.model';
import { BASE_TYPES, BaseTypeEntry, TypeColor, TypeColorSoft, TypeName } from '../models/type-table.model';

const DARKEN_FACTOR: number = 0.72;

export const POKEMON_TYPE_COMPATIBILITY: Record<TypeName, Set<TypeName>> = BASE_TYPES.reduce(
  (compatibility: Record<TypeName, Set<TypeName>>, type: BaseTypeEntry) => {
    compatibility[type.name] = new Set<TypeName>();
    return compatibility;
  },
  {} as Record<TypeName, Set<TypeName>>,
);
console.log('start compatibility', new Date().getTime());
pokedex.forEach((pokemon: Pokemon) => {
  pokemon.type.forEach((type: TypeName) => {
    pokemon.type.forEach((otherType: TypeName) => {
      if (type !== otherType) {
        POKEMON_TYPE_COMPATIBILITY[type].add(otherType);
      }
    });
  });
});
console.log('end compatibility', POKEMON_TYPE_COMPATIBILITY, new Date().getTime());
@Component({
  selector: 'app-type-selector',
  templateUrl: './type-selector.html',
  styleUrl: './type-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeSelector {
  readonly lines: InputSignal<number> = input<number>(1);
  readonly maxSelections: InputSignal<number | null> = input<number | null>(null);
  readonly filterIncompatibleTypes: InputSignal<boolean> = input<boolean>(true);
  readonly forceDisabledTypes: InputSignal<BaseTypeEntry[]> = input<BaseTypeEntry[]>([]);
  readonly selectionChange: OutputEmitterRef<BaseTypeEntry[]> = output<BaseTypeEntry[]>();

  readonly types: BaseTypeEntry[] = BASE_TYPES;
  readonly selectedTypes: WritableSignal<BaseTypeEntry[]> = signal<BaseTypeEntry[]>([]);
  private readonly forceDisabledSelectionEffect = effect(() => {
    const forceDisabledTypes: BaseTypeEntry[] = this.forceDisabledTypes();
    const selectedTypes: BaseTypeEntry[] = this.selectedTypes();
    const nextSelection: BaseTypeEntry[] = selectedTypes.filter(
      (selectedType: BaseTypeEntry) =>
        !forceDisabledTypes.some(
          (disabledType: BaseTypeEntry) => disabledType.id === selectedType.id,
        ),
    );

    if (nextSelection.length !== selectedTypes.length) {
      this.selectedTypes.set(nextSelection);
      this.selectionChange.emit(nextSelection);
    }
  });
  readonly gridStyle: Signal<Record<string, string>> = computed<Record<string, string>>(() => {
    const lineCount: number = this.getLineCount();
    const columnCount: number = Math.ceil(this.types.length / lineCount);

    return {
      'grid-template-columns': `repeat(${columnCount}, minmax(0, 1fr))`,
      'grid-template-rows': `repeat(${lineCount}, minmax(2.75rem, auto))`,
    };
  });

  isSelected(type: BaseTypeEntry): boolean {
    return this.selectedTypes().some((selectedType: BaseTypeEntry) => selectedType.id === type.id);
  }

  isDisabled(type: BaseTypeEntry): boolean {
    return (
      !this.isSelected(type) &&
      (this.isForceDisabled(type) ||
        this.hasReachedSelectionLimit() ||
        (this.filterIncompatibleTypes() && !this.canCombineWithSelectedTypes(type)))
    );
  }

  getDisabledTooltip(type: BaseTypeEntry): string | null {
    if (!this.isDisabled(type)) {
      return null;
    }

    if (this.isForceDisabled(type)) {
      return 'Cannot exclude a type that is already included';
    }

    const maximumSelections: number | null = this.maxSelections();

    if (this.hasReachedSelectionLimit() && maximumSelections !== null) {
      return `Maximum of ${maximumSelections} types selected`;
    }

    if (
      this.selectedTypes().length === 0 ||
      !this.filterIncompatibleTypes() ||
      this.canCombineWithSelectedTypes(type)
    ) {
      return null;
    }

    const selectedTypeNames: string = this.selectedTypes()
      .map((selectedType: BaseTypeEntry) => selectedType.name.toUpperCase())
      .join(' + ');

    return `No Pokemon found with the combination ${selectedTypeNames} + ${type.name.toUpperCase()}`;
  }

  getButtonColor(type: BaseTypeEntry): string {
    const color: string = TypeColor[type.name];

    return this.isSelected(type) ? color : this.darkenColor(color);
  }

  toggleType(type: BaseTypeEntry): void {
    const selectedTypes: BaseTypeEntry[] = this.selectedTypes();
    const isSelected: boolean = selectedTypes.some(
      (selectedType: BaseTypeEntry) => selectedType.id === type.id,
    );

    if (!isSelected && (this.isForceDisabled(type) || this.hasReachedSelectionLimit())) {
      return;
    }

    const nextSelection: BaseTypeEntry[] = isSelected
      ? selectedTypes.filter((selectedType) => selectedType.id !== type.id)
      : [...selectedTypes, type];

    nextSelection.sort((first: BaseTypeEntry, second: BaseTypeEntry) => first.id - second.id);
    this.selectedTypes.set(nextSelection);
    this.selectionChange.emit(nextSelection);
  }

  private hasReachedSelectionLimit(): boolean {
    const limit: number | null = this.maxSelections();

    return limit !== null && this.selectedTypes().length >= Math.max(0, limit);
  }

  private canCombineWithSelectedTypes(type: BaseTypeEntry): boolean {
    return this.selectedTypes().every((selectedType: BaseTypeEntry) =>
      POKEMON_TYPE_COMPATIBILITY[selectedType.name].has(type.name),
    );
  }

  private isForceDisabled(type: BaseTypeEntry): boolean {
    return this.forceDisabledTypes().some(
      (disabledType: BaseTypeEntry) => disabledType.id === type.id,
    );
  }

  private getLineCount(): number {
    return Math.min(this.types.length, Math.max(1, Math.floor(this.lines())));
  }

  private darkenColor(color: string): string {
    const red: number = Number.parseInt(color.slice(1, 3), 16);
    const green: number = Number.parseInt(color.slice(3, 5), 16);
    const blue: number = Number.parseInt(color.slice(5, 7), 16);

    return `rgb(${this.darkenChannel(red)}, ${this.darkenChannel(green)}, ${this.darkenChannel(blue)})`;
  }

  private darkenChannel(channel: number): number {
    return Math.round(channel * DARKEN_FACTOR);
  }
}
