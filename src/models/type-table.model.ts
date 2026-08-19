export enum TypeName {
  normal = 'normal',
  fire = 'fire',
  water = 'water',
  electric = 'electric',
  grass = 'grass',
  ice = 'ice',
  fighting = 'fighting',
  poison = 'poison',
  ground = 'ground',
  flying = 'flying',
  psychic = 'psychic',
  bug = 'bug',
  rock = 'rock',
  ghost = 'ghost',
  dragon = 'dragon',
  dark = 'dark',
  steel = 'steel',
  fairy = 'fairy',
}

export const TypeAbbreviation: Record<TypeName, string> = {
  [TypeName.normal]: 'nor',
  [TypeName.fire]: 'fir',
  [TypeName.water]: 'wat',
  [TypeName.electric]: 'ele',
  [TypeName.grass]: 'gra',
  [TypeName.ice]: 'ice',
  [TypeName.fighting]: 'fig',
  [TypeName.poison]: 'poi',
  [TypeName.ground]: 'gro',
  [TypeName.flying]: 'fly',
  [TypeName.psychic]: 'psy',
  [TypeName.bug]: 'bug',
  [TypeName.rock]: 'roc',
  [TypeName.ghost]: 'gho',
  [TypeName.dragon]: 'dra',
  [TypeName.dark]: 'dar',
  [TypeName.steel]: 'ste',
  [TypeName.fairy]: 'fai',
};

export const TypeColor: Record<TypeName, string> = {
  [TypeName.normal]: '#A8A878',
  [TypeName.fire]: '#F08030',
  [TypeName.water]: '#6890F0',
  [TypeName.electric]: '#F8D030',
  [TypeName.grass]: '#78C850',
  [TypeName.ice]: '#98D8D8',
  [TypeName.fighting]: '#C03028',
  [TypeName.poison]: '#A040A0',
  [TypeName.ground]: '#E0C068',
  [TypeName.flying]: '#A890F0',
  [TypeName.psychic]: '#F85888',
  [TypeName.bug]: '#A8B820',
  [TypeName.rock]: '#B8A038',
  [TypeName.ghost]: '#705898',
  [TypeName.dragon]: '#7038F8',
  [TypeName.dark]: '#705848',
  [TypeName.steel]: '#B8B8D0',
  [TypeName.fairy]: '#EE99AC',
};

export type EffectivenessValue = 0 | 0.25 | 0.5 | 1 | 2 | 4;
export type HighlightId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface EffectivenessDisplay {
  displayText: string;
  backgroundColor: string;
  fontColor: string;
}

export const highlightColors: Record<HighlightId, string> = {
  1: '#f5f5f5',
  2: '#60a5fa',
  3: '#facc15',
  4: '#fb7185',
  5: '#c084fc',
  6: '#34d399',
  7: '#fb923c',
};

export const effectivenessDisplay: Record<EffectivenessValue, EffectivenessDisplay> = {
  0: { displayText: '0', backgroundColor: '#9ca3af', fontColor: '#ffffff' },
  0.5: { displayText: '/2', backgroundColor: '#f59e0b', fontColor: '#ffffff' },
  0.25: { displayText: '/4', backgroundColor: '#ff6d00', fontColor: '#ffffff' },
  1: { displayText: '', backgroundColor: '#4b5563', fontColor: '#ffffff' },
  2: { displayText: 'x2', backgroundColor: '#4ade80', fontColor: '#ffffff' },
  4: { displayText: 'x4', backgroundColor: '#00c853', fontColor: '#ffffff' },
};

export interface BaseTypeEntry {
  name: string;
  abr: string;
  id: number;
  color: string;
}

export interface TypeEntry extends BaseTypeEntry {
  eff: EffectivenessValue[];
}

export const BASE_TYPES: BaseTypeEntry[] = [
  {
    name: TypeName.normal,
    abr: TypeAbbreviation[TypeName.normal],
    id: 0,
    color: TypeColor[TypeName.normal],
  },
  {
    name: TypeName.fire,
    abr: TypeAbbreviation[TypeName.fire],
    id: 1,
    color: TypeColor[TypeName.fire],
  },
  {
    name: TypeName.water,
    abr: TypeAbbreviation[TypeName.water],
    id: 2,
    color: TypeColor[TypeName.water],
  },
  {
    name: TypeName.electric,
    abr: TypeAbbreviation[TypeName.electric],
    id: 3,
    color: TypeColor[TypeName.electric],
  },
  {
    name: TypeName.grass,
    abr: TypeAbbreviation[TypeName.grass],
    id: 4,
    color: TypeColor[TypeName.grass],
  },
  {
    name: TypeName.ice,
    abr: TypeAbbreviation[TypeName.ice],
    id: 5,
    color: TypeColor[TypeName.ice],
  },
  {
    name: TypeName.fighting,
    abr: TypeAbbreviation[TypeName.fighting],
    id: 6,
    color: TypeColor[TypeName.fighting],
  },
  {
    name: TypeName.poison,
    abr: TypeAbbreviation[TypeName.poison],
    id: 7,
    color: TypeColor[TypeName.poison],
  },
  {
    name: TypeName.ground,
    abr: TypeAbbreviation[TypeName.ground],
    id: 8,
    color: TypeColor[TypeName.ground],
  },
  {
    name: TypeName.flying,
    abr: TypeAbbreviation[TypeName.flying],
    id: 9,
    color: TypeColor[TypeName.flying],
  },
  {
    name: TypeName.psychic,
    abr: TypeAbbreviation[TypeName.psychic],
    id: 10,
    color: TypeColor[TypeName.psychic],
  },
  {
    name: TypeName.bug,
    abr: TypeAbbreviation[TypeName.bug],
    id: 11,
    color: TypeColor[TypeName.bug],
  },
  {
    name: TypeName.rock,
    abr: TypeAbbreviation[TypeName.rock],
    id: 12,
    color: TypeColor[TypeName.rock],
  },
  {
    name: TypeName.ghost,
    abr: TypeAbbreviation[TypeName.ghost],
    id: 13,
    color: TypeColor[TypeName.ghost],
  },
  {
    name: TypeName.dragon,
    abr: TypeAbbreviation[TypeName.dragon],
    id: 14,
    color: TypeColor[TypeName.dragon],
  },
  {
    name: TypeName.dark,
    abr: TypeAbbreviation[TypeName.dark],
    id: 15,
    color: TypeColor[TypeName.dark],
  },
  {
    name: TypeName.steel,
    abr: TypeAbbreviation[TypeName.steel],
    id: 16,
    color: TypeColor[TypeName.steel],
  },
  {
    name: TypeName.fairy,
    abr: TypeAbbreviation[TypeName.fairy],
    id: 17,
    color: TypeColor[TypeName.fairy],
  },
];

export const GEN7_TYPES: TypeEntry[] = [
  {
    ...BASE_TYPES[0],
    eff: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1],
  },
  {
    ...BASE_TYPES[1],
    eff: [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1],
  },
  {
    ...BASE_TYPES[2],
    eff: [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1],
  },
  {
    ...BASE_TYPES[3],
    eff: [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1],
  },
  {
    ...BASE_TYPES[4],
    eff: [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1],
  },
  {
    ...BASE_TYPES[5],
    eff: [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1],
  },
  {
    ...BASE_TYPES[6],

    eff: [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5],
  },
  {
    ...BASE_TYPES[7],
    eff: [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2],
  },
  {
    ...BASE_TYPES[8],
    eff: [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1],
  },
  {
    ...BASE_TYPES[9],
    eff: [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1],
  },
  {
    ...BASE_TYPES[10],
    eff: [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1],
  },
  {
    ...BASE_TYPES[11],
    eff: [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5],
  },
  {
    ...BASE_TYPES[12],
    eff: [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1],
  },
  {
    ...BASE_TYPES[13],
    eff: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1],
  },
  {
    ...BASE_TYPES[14],
    eff: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0],
  },
  {
    ...BASE_TYPES[15],
    eff: [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5],
  },
  {
    ...BASE_TYPES[16],
    eff: [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2],
  },
  {
    ...BASE_TYPES[17],
    eff: [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1],
  },
];
