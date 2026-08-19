import { Component, computed, signal } from '@angular/core';
import {
  EffectivenessDisplay,
  EffectivenessValue,
  effectivenessDisplay as effectivenessDisplayData,
  GEN7_TYPES,
  highlightColors as highlightColorsData,
  HighlightId,
  TypeEntry,
} from '../models/type-table.model';

const MAX_COMBINED_COLUMNS = 2;

@Component({
  selector: 'app-type-table-component',
  imports: [],
  templateUrl: './type-table-component.html',
  styleUrl: './type-table-component.css',
})
export class TypeTableComponent {
  currentTableData: TypeEntry[] = GEN7_TYPES;
  readonly hoveredRow = signal<number | null>(null);
  readonly hoveredColumn = signal<number | null>(null);
  readonly cellHighlights = signal<Record<string, HighlightId[]>>({});
  readonly persistentHighlights = signal<Record<string, true>>({});
  readonly highlightedColumns = computed(() => {
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

    const hoveredColumn = this.hoveredColumn();

    if (hoveredColumn !== null) {
      columns.add(hoveredColumn);
    }

    return [...columns];
  });
  readonly combinedColumns = computed(() =>
    this.highlightedColumns().slice(0, MAX_COMBINED_COLUMNS),
  );

  readonly highlightColors = highlightColorsData;
  readonly effectivenessDisplay = effectivenessDisplayData;

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

    if (columns.length < 2) {
      return 'transparent';
    }

    return `linear-gradient(to bottom right, ${this.currentTableData[columns[0]].color}, ${this.currentTableData[columns[1]].color})`;
  }

  highlightCell(row: number, column: number): void {
    this.hoveredRow.set(row);
    this.hoveredColumn.set(column);
  }

  highlightRow(row: number): void {
    this.hoveredRow.set(row);
    this.hoveredColumn.set(null);
  }

  highlightColumn(column: number): void {
    this.hoveredRow.set(null);
    this.hoveredColumn.set(column);
  }

  highlightCombinedCell(row: number): void {
    this.hoveredRow.set(row);
    this.hoveredColumn.set(null);
  }

  clearHighlight(): void {
    this.hoveredRow.set(null);
    this.hoveredColumn.set(null);
  }

  togglePersistentCell(row: number, column: number): void {
    this.togglePersistentHighlight(`cell:${row}:${column}`);
  }

  togglePersistentRow(row: number): void {
    this.togglePersistentHighlight(`row:${row}`);
  }

  togglePersistentColumn(column: number): void {
    this.togglePersistentHighlight(`column:${column}`);
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
    const highlights = this.getActiveHighlights(row, column);
    const firstHighlight = highlights[0];

    return firstHighlight
      ? `inset 0 0 0 2px ${this.highlightColors[firstHighlight]}`
      : 'none';
  }

  private getActiveHighlights(row: number | null, column: number | null): HighlightId[] {
    const storedHighlights =
      row !== null && column !== null
        ? this.cellHighlights()[this.getCellKey(row, column)] ?? []
        : [];
    const isHovered =
      (row !== null && this.hoveredRow() === row) ||
      (column !== null && this.hoveredColumn() === column);
    const isPersistent = this.isPersistentlyHighlighted(row, column);
    const highlights = isHovered || isPersistent ? [1, ...storedHighlights] : storedHighlights;

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

  private isPersistentlyHighlighted(row: number | null, column: number | null): boolean {
    const highlights = this.persistentHighlights();

    if (row === null && column !== null) {
      return Boolean(highlights[`column:${column}`]);
    }

    if (row !== null && column === null) {
      return Boolean(highlights[`row:${row}`]);
    }

    if (row === null || column === null) {
      return false;
    }

    return Object.keys(highlights).some((key) => {
      return (
        key === `row:${row}` ||
        key === `column:${column}` ||
        key === `cell:${row}:${column}` ||
        key.startsWith(`cell:${row}:`) ||
        (key.startsWith('cell:') && key.endsWith(`:${column}`))
      );
    });
  }

  private getCellKey(row: number, column: number): string {
    return `${row}:${column}`;
  }
}
