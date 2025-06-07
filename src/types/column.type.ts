/** 기둥 설계 변수*/
export enum Column {
  // 기본 정보
  fc_prime = "fc_prime",
  b = "b",
  h = "h",
  elasticity_steel = "elasticity_steel",

  // 주철근 정보
  fy = "fy",
  steel_d = "steel_d",
  steel_data = "steel_data",

  // 늑근(띠철근) 정보
  stirrup_n = "stirrup_n",
  stirrup_d = "stirrup_d",
  stirrup_s = "stirrup_s",
  fy_v = "fy_v",
}

/** 기둥 변수 타입 */
export interface ColumnType {
  [Column.fc_prime]: number;
  [Column.b]: number;
  [Column.h]: number;
  [Column.elasticity_steel]: number;
  [Column.fy]: number;
  [Column.steel_d]: number;
  [Column.steel_data]: SteelDataType[];
  [Column.fy_v]: number;
  [Column.stirrup_n]: number;
  [Column.stirrup_d]: number;
  [Column.stirrup_s]: number;
}

/** 변수 ToolTip 텍스트  */
export const ColumnToolTip: { [key in Column]: string } = {
  [Column.fc_prime]: "콘트리트 압축강도",
  [Column.b]: "단면 너비",
  [Column.h]: "단면 높이",
  [Column.elasticity_steel]: "철근 탄성계수",

  [Column.fy]: "주철근 항복 강도",
  [Column.steel_d]: "주철근 직경",
  [Column.steel_data]: "주철근 정보",

  [Column.fy_v]: "늑근(띠철근) 항복 강도",
  [Column.stirrup_n]: "늑근(띠철근) 수 #한바퀴 감음으로 기본적으로 2n개가 생성됨",
  [Column.stirrup_d]: "늑근(띠철근) 직경",
  [Column.stirrup_s]: "늑근(띠철근) 배근 간격",
};

/** 변수 Display Name */
export const ColumnDisplayName: { [key in Column]: string } = {
  [Column.fc_prime]: "Fc'(MPa)",
  [Column.b]: "b (mm)",
  [Column.h]: "h (mm)",
  [Column.elasticity_steel]: "Es(MPa)",

  [Column.fy]: "Fy(MPa)",
  [Column.steel_d]: "Steel Diameter (mm)",
  [Column.steel_data]: "Steel Data",

  [Column.fy_v]: "Fy_v (MPa)",
  [Column.stirrup_n]: "Stirrup Amount (개)",
  [Column.stirrup_d]: "Stirrup Diameter (mm)",
  [Column.stirrup_s]: "Stirrup Spacing (mm)",
};

/** 계산 후 반환할 데이터 */
export interface ColumnResult {
  /** P,M값 (N*mm)*/
  PMData: { p: number; m: number; pi: number }[];

  /** 최대 P값 (N)*/
  Pmax: number;

  /** 전단 강도 (N)*/
  shear_force: number;

  /** 전단 강도 감수 계수 */
  pi_shear_force: number;
}

// ----- 주철근 데이터 정의 --------

export enum SteelData {
  y = "y",
  n = "n",
}

export interface SteelDataType {
  [SteelData.y]: number;
  [SteelData.n]: number;
}

export const SteelDataToolTip: { [key in SteelData]: string } = {
  [SteelData.y]: "철근 위치",
  [SteelData.n]: "철근 수",
};
