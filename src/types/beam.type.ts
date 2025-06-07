/** 빔 설계 변수*/
export enum Beam {
  // 기본 정보
  fc_prime = "fc_prime",
  b = "b",
  h = "h",
  elasticity_steel = "elasticity_steel",

  // 상부 철근 정보
  fy_t = "fy_t",
  top_steel_n = "top_steel_n",
  top_steel_d = "top_steel_d",
  top_steel_y = "top_steel_y",

  // 하부 철근 정보
  fy_b = "fy_b",
  bottom_steel_n = "bottom_steel_n",
  bottom_steel_d = "bottom_steel_d",
  bottom_steel_y = "bottom_steel_y",

  // 늑근(띠철근) 정보
  stirrup_n = "stirrup_n",
  stirrup_d = "stirrup_d",
  stirrup_s = "stirrup_s",
  stirrup_h_prime = "stirrup_h_prime",
  fy_v = "fy_v",
}

/** 빔 변수 타입 */
export interface BeamType {
  [Beam.fc_prime]: number;
  [Beam.b]: number;
  [Beam.h]: number;
  [Beam.elasticity_steel]: number;
  [Beam.fy_t]: number;
  [Beam.top_steel_n]: number;
  [Beam.top_steel_d]: number;
  [Beam.top_steel_y]: number;
  [Beam.fy_b]: number;
  [Beam.bottom_steel_n]: number;
  [Beam.bottom_steel_d]: number;
  [Beam.bottom_steel_y]: number;
  [Beam.fy_v]: number;
  [Beam.stirrup_n]: number;
  [Beam.stirrup_d]: number;
  [Beam.stirrup_s]: number;
  [Beam.stirrup_h_prime]: number;
}

/** 변수 ToolTip 텍스트  */
export const BeamToolTip: { [key in Beam]: string } = {
  [Beam.fc_prime]: "콘트리트 압축강도",
  [Beam.b]: "단면 너비",
  [Beam.h]: "단면 높이",
  [Beam.elasticity_steel]: "철근 탄성계수",

  [Beam.fy_t]: "상부 철근 항복 강도",
  [Beam.top_steel_n]: "상부 철근 수",
  [Beam.top_steel_d]: "상부 철근 직경",
  [Beam.top_steel_y]: "상부 철근 위치",

  [Beam.fy_b]: "하부 철근 항복 강도",
  [Beam.bottom_steel_n]: "하부 철근 수",
  [Beam.bottom_steel_d]: "하부 철근 직경",
  [Beam.bottom_steel_y]: "하부 철근 위치",

  [Beam.fy_v]: "늑근(띠철근) 항복 강도",
  [Beam.stirrup_n]: "늑근(띠철근) 수 #한바퀴 감음으로 기본적으로 2n개가 생성됨",
  [Beam.stirrup_d]: "늑근(띠철근) 직경",
  [Beam.stirrup_s]: "늑근(띠철근) 배근 간격",
  [Beam.stirrup_h_prime]: "늑근(띠철근) 유효 깊이",
};

/** 변수 Display Name */
export const BeamDisplayName: { [key in Beam]: string } = {
  [Beam.fc_prime]: "Fc'(MPa)",
  [Beam.b]: "b (mm)",
  [Beam.h]: "h (mm)",
  [Beam.elasticity_steel]: "Es(MPa)",

  [Beam.fy_t]: "Fy of top steel (MPa)",
  [Beam.top_steel_n]: "Steel Amount (개)",
  [Beam.top_steel_d]: "Steel Diameter (mm)",
  [Beam.top_steel_y]: "Steel Position (mm)",

  [Beam.fy_b]: "Fy of bottom steel (MPa)",
  [Beam.bottom_steel_n]: "Steel Amount (개)",
  [Beam.bottom_steel_d]: "Steel Diameter (mm)",
  [Beam.bottom_steel_y]: "Steel Position (mm)",

  [Beam.fy_v]: "Fy of stirrup (MPa)",
  [Beam.stirrup_n]: "Steel Amount (개)",
  [Beam.stirrup_d]: "Steel Diameter (mm)",
  [Beam.stirrup_s]: "Steel Spacing (mm)",
  [Beam.stirrup_h_prime]: "Steel Effective Depth (mm)",
};

/** 계산 후 반환할 데이터 */
export interface BeamResult {
  /** 압축 철근 모멘트 */
  steel_compression_moment: number;
  /** 인장 철근 모멘트 */
  steel_tension_moment: number;
  /** 콘크리트 모멘트 */
  concrete_moment: number;
  /** 총 모멘트 */
  total_moment: number;
  /** 모멘트 강도 감수 계수 */
  pi_moment: number;
  /** 압축대 깊이 */
  c: number;

  /** 철근 전단 강도 */
  steel_shear_force: number;
  /** 콘크리트 전단 강도 */
  concrete_shear_force: number;
  /** 전단 강도 */
  shear_force: number;
  /** 최대 전단 강도 */
  max_shear_force: number;
  /** 전단 강도 감수 계수 */
  pi_shear_force: number;
}

/**************************/
/**
 * Beam 역설계에 필요한 타입들
 */
/**************************/

/** Beam 역설계 변수 */
export enum BeamReversed {
  requiredMoment = "requiredMoment", // 요구 모멘트 강도 (kN*m)
  requiredShear = "requiredShear", // 요구 전단 강도 (kN)

  // 제약조건
  minWidth = "minWidth", // 최소 너비 (mm)
  maxWidth = "maxWidth", // 최대 너비 (mm)
  minHeight = "minHeight", // 최소 높이 (mm)
  maxHeight = "maxHeight", // 최대 높이 (mm)

  // 재료 속성
  fc_prime = "fc_prime", // 콘크리트 압축강도 (MPa)
  fy_t = "fy_t", // 상부 철근 항복 강도 (MPa)
  fy_b = "fy_b", // 하부 철근 항복 강도 (MPa)
  fy_v = "fy_v", // 늑근 항복 강도 (MPa)
  elasticity_steel = "elasticity_steel", // 철근 탄성계수 (MPa)
}

/** Beam 역설계 변수 타입*/
export interface BeamReversedType {
  [BeamReversed.requiredMoment]: number;
  [BeamReversed.requiredShear]: number;
  [BeamReversed.minWidth]: number;
  [BeamReversed.maxWidth]: number;
  [BeamReversed.minHeight]: number;
  [BeamReversed.maxHeight]: number;
  [BeamReversed.fc_prime]: number;
  [BeamReversed.fy_t]: number;
  [BeamReversed.fy_b]: number;
  [BeamReversed.fy_v]: number;
  [BeamReversed.elasticity_steel]: number;
}

/** 변수 ToolTip 텍스트  */
export const BeamReversedToolTip: { [key in BeamReversed]: string } = {
  [BeamReversed.requiredMoment]: "요구 모멘트 강도 (kN*m)",
  [BeamReversed.requiredShear]: "요구 전단 강도 (kN)",

  [BeamReversed.minWidth]: "최소 단면 너비 (mm)",
  [BeamReversed.maxWidth]: "최대 단면 너비 (mm)",
  [BeamReversed.minHeight]: "최소 단면 높이 (mm)",
  [BeamReversed.maxHeight]: "최대 단면 높이 (mm)",

  [BeamReversed.fc_prime]: "콘크리트 압축강도 (MPa)",
  [BeamReversed.fy_t]: "상부 철근 항복 강도 (MPa)",
  [BeamReversed.fy_b]: "하부 철근 항복 강도 (MPa)",
  [BeamReversed.fy_v]: "늑근(띠철근) 항복 강도 (MPa)",
  [BeamReversed.elasticity_steel]: "철근 탄성계수 (MPa)",
};

/** BeamReversed 계산 결과 타입 */
export interface BeamReversedResult {
  /** 최적 너비 (mm) */
  b: number;
  /** 최적 높이 (mm) */
  h: number;

  /** 상부 철근 수 */
  top_steel_n: number;
  /** 상부 철근 직경 (mm) */
  top_steel_d: number;
  /** 상부 철근 위치 (mm) */
  top_steel_y: number;

  /** 하부 철근 수 */
  bottom_steel_n: number;
  /** 하부 철근 직경 (mm) */
  bottom_steel_d: number;
  /** 하부 철근 위치 (mm) */
  bottom_steel_y: number;

  /** 늑근 수 */
  stirrup_n: number;
  /** 늑근 직경 */
  stirrup_d: number;
  /** 늑근 간격 */
  stirrup_s: number;
  /** 늑근 유효 깊이 */
  stirrup_h_prime: number;

  /** 실제 설계 모멘트 강도 (kN*m) */
  actualMoment: number;
  /** 실제 설계 전단 강도 (kN) */
  actualShear: number;
}
