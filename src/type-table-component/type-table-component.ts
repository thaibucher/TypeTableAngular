import { ChangeDetectionStrategy, Component, computed, signal, WritableSignal } from '@angular/core';
import {
  EffectivenessDisplay,
  EffectivenessValue,
  effectivenessDisplay as effectivenessDisplayData,
  GEN7_TYPES,
  HIGHLIGHT_MODE,
  highlightColors as highlightColorsData,
  HighlightId,
  HighlightMode,
  TypeTableHighlightCommand,
  TypeEntry,
} from '../models/type-table.model';

const MAX_COMBINED_COLUMNS = 2;

@Component({
  selector: 'app-type-table-component',
  imports: [],
  templateUrl: './type-table-component.html',
  styleUrl: './type-table-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeTableComponent {
  currentTableData: TypeEntry[] = GEN7_TYPES;
  readonly hoveredRow = signal<number | null>(null);
  readonly hoveredColumn = signal<number | null>(null);
  readonly hoveredCombinedRow = signal<number | null>(null);
  readonly cellHighlights = signal<Record<string, HighlightId[]>>({});
  readonly persistentHighlights = signal<Record<string, true>>({});
  readonly externalHighlights: WritableSignal<Record<string, TypeTableHighlightCommand>> = signal<
    Record<string, TypeTableHighlightCommand>
  >({});
  readonly manualHighlightedColumns = computed(() => {
    const columns = new Set<number>();

    Object.keys(this.persistentHighlights()).forEach((key) => {
      const columnMatch = key.match(/^column:(\d+)$/);
      const cellMatch = key.match(/^cell:\d+:(\d+)$/);

      if (columnMatch) {
        columns.add(Number(columnMatch[1]));
      }

      if (cellMatch) {
        columns.add(Number(cellMatch[1]));
      }
    });

    return [...columns];
  });
  readonly derivedColumnCandidates = computed(() => {
    const columns = new Set<number>(this.manualHighlightedColumns());
    const hoveredColumn: number | null = this.hoveredColumn();

    if (hoveredColumn !== null) {
      columns.add(hoveredColumn);
    }

    return [...columns];
  });
  readonly highlightedColumns = computed(() => {
    const columns = new Set<number>(this.manualHighlightedColumns());

    Object.values(this.externalHighlights()).forEach((command: TypeTableHighlightCommand) => {
      if (command.direction !== 'vertical') {
        return;
      }

      command.types.forEach((type) => {
        const column: number = this.getTypeIndex(type);

        if (column >= 0) {
          columns.add(column);
        }
      });
    });

    const hoveredColumn = this.hoveredColumn();

    if (hoveredColumn !== null) {
      columns.add(hoveredColumn);
    }

    return [...columns];
  });
  readonly combinedColumns = computed(() =>
    this.derivedColumnCandidates().slice(0, MAX_COMBINED_COLUMNS),
  );
  readonly derivedColumnShown = computed(() => this.combinedColumns().length >= 2);

  readonly highlightColors = highlightColorsData;
  readonly effectivenessDisplay = effectivenessDisplayData;
  readonly highlightMode: HighlightMode = HIGHLIGHT_MODE;

  getEffectivenessDisplay(value: EffectivenessValue): EffectivenessDisplay {
    return this.effectivenessDisplay[value];
  }

  getCombinedEffectiveness(entry: TypeEntry): EffectivenessValue {
    return this.combinedColumns().reduce(
      (total, column) => total * entry.eff[column],
      1,
    ) as EffectivenessValue;
  }

  getCombinedColumnLabel(): string {
    return this.combinedColumns()
      .map((column) => this.currentTableData[column].abr)
      .join('+');
  }

  getCombinedColumnBackground(): string {
    const columns = this.combinedColumns();

    if (!this.derivedColumnShown()) {
      return 'transparent';
    }

    return `linear-gradient(to bottom right, ${this.currentTableData[columns[0]].color}, ${this.currentTableData[columns[1]].color})`;
  }

  highlightCell(row: number, column: number): void {
    this.hoveredCombinedRow.set(null);
    this.hoveredRow.set(row);
    this.hoveredColumn.set(column);
  }

  highlightRow(row: number): void {
    this.hoveredCombinedRow.set(null);
    this.hoveredRow.set(row);
    this.hoveredColumn.set(null);
  }

  highlightColumn(column: number): void {
    this.hoveredCombinedRow.set(null);
    this.hoveredRow.set(null);
    this.hoveredColumn.set(column);
  }

  highlightCombinedCell(row: number): void {
    if (!this.derivedColumnShown()) {
      this.clearHighlight();
      return;
    }

    this.hoveredCombinedRow.set(row);
    this.hoveredRow.set(row);
    this.hoveredColumn.set(null);
  }

  toggleCombinedRow(row: number): void {
    if (!this.derivedColumnShown()) {
      this.clearHighlight();
      return;
    }

    this.togglePersistentRow(row);
  }

  clearHighlight(): void {
    this.hoveredCombinedRow.set(null);
    this.hoveredRow.set(null);
    this.hoveredColumn.set(null);
  }

  togglePersistentCell(row: number, column: number): void {
    this.togglePersistentHighlight(`cell:${row}:${column}`);
    this.clearHighlight();
  }

  togglePersistentRow(row: number): void {
    this.togglePersistentHighlight(`row:${row}`);
    this.clearHighlight();
  }

  togglePersistentColumn(column: number): void {
    this.togglePersistentHighlight(`column:${column}`);
    this.clearHighlight();
  }

  applyExternalHighlight(command: TypeTableHighlightCommand): void {
    const key: string = `${command.direction}:${command.slotIndex}`;

    this.externalHighlights.update((highlights) => {
      if (command.types.length === 0) {
        const { [key]: removed, ...remaining } = highlights;
        return remaining;
      }

      return { ...highlights, [key]: command };
    });
  }

  addHighlight(row: number, column: number, highlight: HighlightId): void {
    const key = this.getCellKey(row, column);

    this.cellHighlights.update((cells) => {
      const highlights = cells[key] ?? [];

      if (highlights.includes(highlight)) {
        return cells;
      }

      return {
        ...cells,
        [key]: [...highlights, highlight].sort((first, second) => first - second),
      };
    });
  }

  getHighlightBoxShadow(row: number | null, column: number | null): string {
    const highlights: HighlightId[] = this.getActiveHighlights(row, column);
    const firstHighlightId: HighlightId | undefined = highlights[0];

    if (!firstHighlightId) {
      return 'none';
    }

    if (row === null || column === null || this.hasCellHighlight(row, column)) {
      return `inset 0 0 0 4px ${this.highlightColors[firstHighlightId]}`;
    }

    const horizontalHighlightId: HighlightId | undefined =
      this.getHorizontalHighlightIds(row)[0];
    const verticalHighlightId: HighlightId | undefined = this.getVerticalHighlightIds(column)[0];
    const shadows: string[] = [];

    if (horizontalHighlightId) {
      const color: string = this.highlightColors[horizontalHighlightId];
      shadows.push(`inset 0 4px 0 0 ${color}`, `inset 0 -4px 0 0 ${color}`);
    }

    if (verticalHighlightId) {
      const color: string = this.highlightColors[verticalHighlightId];
      shadows.push(`inset 4px 0 0 0 ${color}`, `inset -4px 0 0 0 ${color}`);
    }

    return shadows.join(', ');
  }

  private getActiveHighlights(row: number | null, column: number | null): HighlightId[] {
    const storedHighlights =
      row !== null && column !== null
        ? (this.cellHighlights()[this.getCellKey(row, column)] ?? [])
        : [];
    const isHovered =
      (row !== null &&
        this.hoveredRow() === row &&
        (this.hoveredCombinedRow() === null || this.derivedColumnShown())) ||
      (column !== null && this.hoveredColumn() === column);
    const persistentHighlights: HighlightId[] = this.getPersistentHighlightIds(row, column);
    const highlights = [
      ...(isHovered ? [1 as HighlightId] : []),
      ...persistentHighlights,
      ...storedHighlights,
    ];

    return [...new Set(highlights)].sort((first, second) => first - second) as HighlightId[];
  }

  private togglePersistentHighlight(key: string): void {
    this.persistentHighlights.update((highlights) => {
      if (highlights[key]) {
        const { [key]: removed, ...remaining } = highlights;
        return remaining;
      }

      return { ...highlights, [key]: true };
    });
  }

  private getPersistentHighlightIds(row: number | null, column: number | null): HighlightId[] {
    const highlights = this.persistentHighlights();
    const persistentIds: HighlightId[] = [];

    if (row === null && column !== null) {
      if (highlights[`column:${column}`]) {
        persistentIds.push(1);
      }
    } else if (row !== null && column === null) {
      if (highlights[`row:${row}`]) {
        persistentIds.push(1);
      }
    } else {
      const isManualHighlight: boolean = Object.keys(highlights).some((key) => {
        return (
          key === `row:${row}` ||
          key === `column:${column}` ||
          key === `cell:${row}:${column}` ||
          key.startsWith(`cell:${row}:`) ||
          (key.startsWith('cell:') && key.endsWith(`:${column}`))
        );
      });

      if (isManualHighlight) {
        persistentIds.push(1);
      }
    }

    Object.values(this.externalHighlights()).forEach((command: TypeTableHighlightCommand) => {
      const typeIndex: number = command.types.findIndex((type) => this.getTypeIndex(type) === row);
      const isHorizontalMatch: boolean =
        command.direction === 'horizontal' && row !== null && typeIndex >= 0;
      const isVerticalMatch: boolean =
        command.direction === 'vertical' && column !== null && command.types.some(
          (type) => this.getTypeIndex(type) === column,
        );

      if (isHorizontalMatch || isVerticalMatch) {
        persistentIds.push(this.getExternalHighlightId(command));
      }
    });

    return persistentIds;
  }

  private getHorizontalHighlightIds(row: number): HighlightId[] {
    const highlightIds: HighlightId[] = [];
    const isHovered =
      this.hoveredRow() === row &&
      (this.hoveredCombinedRow() === null || this.derivedColumnShown());

    if (isHovered || this.hasPersistentRowHighlight(row)) {
      highlightIds.push(1);
    }

    Object.values(this.externalHighlights()).forEach((command: TypeTableHighlightCommand) => {
      const matchesRow: boolean =
        command.direction === 'horizontal' &&
        command.types.some((type) => this.getTypeIndex(type) === row);

      if (matchesRow) {
        highlightIds.push(this.getExternalHighlightId(command));
      }
    });

    return [...new Set(highlightIds)].sort((first, second) => first - second);
  }

  private getVerticalHighlightIds(column: number): HighlightId[] {
    const highlightIds: HighlightId[] = [];
    const isHovered: boolean = this.hoveredColumn() === column;

    if (isHovered || this.hasPersistentColumnHighlight(column)) {
      highlightIds.push(1);
    }

    Object.values(this.externalHighlights()).forEach((command: TypeTableHighlightCommand) => {
      const matchesColumn: boolean =
        command.direction === 'vertical' &&
        command.types.some((type) => this.getTypeIndex(type) === column);

      if (matchesColumn) {
        highlightIds.push(this.getExternalHighlightId(command));
      }
    });

    return [...new Set(highlightIds)].sort((first, second) => first - second);
  }

  private hasCellHighlight(row: number, column: number): boolean {
    const storedCellHighlights: HighlightId[] = this.cellHighlights()[this.getCellKey(row, column)] ?? [];
    const persistentKeys: string[] = Object.keys(this.persistentHighlights());

    return (
      storedCellHighlights.length > 0 ||
      persistentKeys.some(
        (key: string) =>
          key === `cell:${row}:${column}` ||
          key === `row:${row}:${column}` ||
          (key.startsWith(`cell:${row}:`) && key.endsWith(`:${column}`)),
      )
    );
  }

  private hasPersistentRowHighlight(row: number): boolean {
    const highlights: Record<string, true> = this.persistentHighlights();

    return (
      Boolean(highlights[`row:${row}`]) ||
      Object.keys(highlights).some(
        (key: string) => key.startsWith(`cell:${row}:`),
      )
    );
  }

  private hasPersistentColumnHighlight(column: number): boolean {
    const highlights: Record<string, true> = this.persistentHighlights();

    return (
      Boolean(highlights[`column:${column}`]) ||
      Object.keys(highlights).some((key: string) => key.endsWith(`:${column}`) && key.startsWith('cell:'))
    );
  }

  private getTypeIndex(type: TypeEntry['name']): number {
    return this.currentTableData.findIndex((entry: TypeEntry) => entry.name === type);
  }

  private getExternalHighlightId(command: TypeTableHighlightCommand): HighlightId {
    if (this.highlightMode === 'team') {
      return command.direction === 'horizontal' ? 2 : 3;
    }

    return (command.slotIndex + 2) as HighlightId;
  }

  private getCellKey(row: number, column: number): string {
    return `${row}:${column}`;
  }
}
