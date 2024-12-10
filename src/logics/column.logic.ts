import { Column, ColumnResult, ColumnType, SteelData } from "@/types/column.type";
import { getEquivalentRectangularStressValues } from "@/types/concrete.type";
import { SteelArea } from "@/types/steel.type";

const MAX_COMPUTE_DURATION = 7000; // 최대 계산 시간 7초

/** 기둥 설계 페이지 계산 로직 */
export default function computeColumnDesign(column: ColumnType): ColumnResult {
  // 등가직사각형을 통한 변수 획득
  const { eps_cu, beta, eta } = getEquivalentRectangularStressValues(column[Column.fc_prime]);
  // 전달받은 주철근 데이터 오름차순 정렬
  const steel_data = column[Column.steel_data].sort((a, b) => a[SteelData.y] - b[SteelData.y]);
  // 철근 1개의 단면적
  const steel_area = SteelArea[column[Column.steel_d] as keyof typeof SteelArea];

  /**
   * ----------------
   * 1. P, M값 계산
   * ----------------
   * */

  // 결과 값을 담기위한 변수 선언
  let PMData: { p: number; m: number; pi: number }[] = [];

  const computeStartTime = Date.now(); // 컴퓨팅 시작 시간

  // STRATEGY: P - M 커브에서 M값은 0부터 시작하여 피크를 찍은 후 다시 0으로 돌아오는 형태이므로, M값이 다시 0에 가까워 질때까지 계산을 반복한다.
  let m_before = 0; // 이전 모멘트 값
  for (let c = 1; true; c++) {
    // 컴퓨팅 시간이 MAX_COMPUTE_DURATION 이상이면 종료
    const computeDuration = Date.now() - computeStartTime;
    if (computeDuration > MAX_COMPUTE_DURATION) throw Error("최대 컴퓨팅 시간을 초과했습니다.");

    /** FORCE */
    // a. 콘크리트
    const concrete_stress = eta * 0.85 * column[Column.fc_prime]; // 콘크리트 응력
    const c_prime = Math.min(column[Column.h], beta * c); // 유효 압축대 깊이
    const concrete_force = concrete_stress * c_prime * column[Column.b];

    // b. 주철근
    const steel_force_array = steel_data.map((d) => {
      const eps_steel = -eps_cu * ((c - d[SteelData.y]) / c); // 변형률

      const steel_stress = Math.max(
        Math.min(column[Column.fy], eps_steel * column[Column.elasticity_steel]),
        -column[Column.fy]
      ); // 주철근 응력

      const steel_force = steel_area * steel_stress * d[SteelData.n];
      return steel_force;
    }); // 각 y 위치에 배근되어있는 주철근들의 힘 계산

    /** MOMENT */
    // a. 콘크리트
    const concrete_moment = concrete_force * (column[Column.h] / 2 - c_prime / 2);
    // b. 주철근
    const steel_moment_array = steel_force_array.map((f, i) => {
      const y = steel_data[i][SteelData.y];
      return f * (column[Column.h] / 2 - y);
    }); // y위치에 배근되어있는 주철근들의 모멘트 계산

    /** P,M값 도출 */
    const P = concrete_force + steel_force_array.reduce((a, b) => a + b, 0); // 합력
    const M = concrete_moment + steel_moment_array.reduce((a, b) => a + b, 0); // 모멘트

    /** 강도감소계수 ϕ */
    const eps_t = eps_cu * ((c - steel_data.at(-1)![SteelData.y]) / c); // steel_data의 마지막 y값을 통해 변형률 계산
    const pi = _computePiValue(column[Column.fy], column[Column.elasticity_steel], eps_t); // 강도감소계수

    PMData.push({ p: P, m: M, pi: pi });

    // M값이 0에 가까워지면 종료 (M값이 100000N*mm 즉 0.1kN*m 보다 작으면 0에 가깝다 판단하고 종료)
    if (M < 100000 && m_before > M) {
      break;
    } else {
      m_before = M;
    }
  }

  const steel_area_sum = steel_area * steel_data.reduce((a, b) => a + b[SteelData.n], 0); // 주철근 총 단면적
  /** 최대 P값 (최대 압축 강도: 띠철근 사용시 80%, 나선철근 사용시 85% 적용됨으로 0.8로 적용) */
  const Pmax =
    0.8 *
    (0.85 * column[Column.fc_prime] * (column[Column.b] * column[Column.h] - steel_area_sum) +
      steel_area_sum * column[Column.fy]);

  /**
   * -----------------
   * 2. 전단 강도 계산
   * -----------------
   */
  // NOTE:
  // 1.철근비는 8% 이하로 제한됨으로 복부압괴는 고려하지 않음.
  // 2.콘크리트의 전단강도 계산시 축력의 효과는 나중에 계산 결과 화면에서 고려. -> 축력 효과는 요구 강도에 따라 변화하므로 결과 화면에서 동적으로 계산해준다.

  const stirrup_area = SteelArea[column[Column.stirrup_d] as keyof typeof SteelArea] * column[Column.stirrup_n]; // 전단 철근 단면적
  const stirrup_h_prime = Math.max(...column[Column.steel_data].map((d) => d[SteelData.y])); // 전단 철근 유효 깊이 (배근된 주철근중 높이 갚이 가장 큰것으로 설정)
  const concrete_shear_force = (1 / 6) * Math.sqrt(column[Column.fc_prime]) * column[Column.b] * stirrup_h_prime;
  const steel_shear_force = (stirrup_area * column[Column.fy_v] * stirrup_h_prime) / column[Column.stirrup_s];
  const shear_force = concrete_shear_force + steel_shear_force;
  const pi_shear_force = 0.75; // 고정값.

  return {
    PMData,
    Pmax,
    shear_force,
    pi_shear_force,
  };
}

/** 강도 감수 계수 계산 */
function _computePiValue(fy: number, Es: number, eps_t: number) {
  const eps_y = fy / Es; // 압축 지배 구간 기준선
  const eps_y2 = eps_y * 2.5; // 인장 지배 구간 기준선

  // 압축 지배 구간
  if (eps_t < eps_y) return 0.65;

  // 인장 지배 구간
  if (eps_t > eps_y2) return 0.85;

  // 변화구간. NOTE: eps_y와 eps_y2 사이의 값은 선형 보간을 통해 계산
  return 0.65 + (eps_t - eps_y) * (0.2 / (eps_y2 - eps_y));
}
