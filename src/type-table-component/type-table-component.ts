import { Component, OnInit } from '@angular/core';
import { GEN7_TYPES, TypeEntry } from '../models/type-table.model';

type EffectivenessValue = 0 | 0.5 | 1 | 2;

interface EffectivenessDisplay {
  displayText: string;
  color: string;
}

@Component({
  selector: 'app-type-table-component',
  imports: [],
  templateUrl: './type-table-component.html',
  styleUrl: './type-table-component.css',
})
export class TypeTableComponent implements OnInit {
  ngOnInit(): void {
   // throw new Error('Method not implemented.');
  }
  currentTableData: TypeEntry[] = GEN7_TYPES;
  readonly effectivenessDisplay: Record<EffectivenessValue, EffectivenessDisplay> = {
    0: { displayText: '0', color: '#9ca3af' },
    0.5: { displayText: '1/2', color: '#f59e0b' },
    1: { displayText: '1', color: '#d1d5db' },
    2: { displayText: '2', color: '#4ade80' },
  };

  getEffectivenessDisplay(value: EffectivenessValue): EffectivenessDisplay {
    return this.effectivenessDisplay[value];
  }
}
