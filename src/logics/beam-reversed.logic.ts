import computeBeamDesign from "@/logics/beam.logic";
import { Beam, BeamReversedResult, BeamReversedType, BeamType } from "@/types/beam.type";
import { getEquivalentRectangularStressValues } from "@/types/concrete.type";
import { SteelArea, SUPPORTED_STEEL_DIAMETER } from "@/types/steel.type";

/**
 * 유전 알고리즘 기반 빔 역설계 로직 ( 선택 > 교배 > 돌연변이 > 대체 의 과정을 통해 최적 빔 설계를 찾습니다.)
 * 요구 모멘트 및 전단 강도를 만족하는 최적 빔 설계를 찾습니다.
 */
export default function computeBeamReversed(requirements: BeamReversedType): BeamReversedResult {
  // 요구 강도 (단위 변환: kN*m → N*mm, kN → N)
  const targetMoment = requirements.requiredMoment * 1000000; // kN*m → N*mm
  const targetShear = requirements.requiredShear * 1000; // kN → N

  // 설계 제약조건
  const constraints = {
    min_width: requirements.minWidth,
    max_width: requirements.maxWidth,
    min_height: requirements.minHeight,
    max_height: requirements.maxHeight,
    cover: 50, // 기본 피복두께 50mm
    available_diameters: [...SUPPORTED_STEEL_DIAMETER],
    max_steel_count: 8,
    min_stirrup_spacing: 100, // 최소 늑근 간격 100mm
    max_stirrup_spacing: 300, // 최대 늑근 간격 300mm
    stirrup_diameters: [10, 13, 16, 19, 22], // 허용 늑근 직경
  } satisfies BeamReversedConstraints;

  // 1단계: 초기 추정값 계산
  const initialEstimate = estimateInitialDimensions(requirements, constraints, targetMoment, targetShear);

  // 2단계: 유전 알고리즘 최적화 실행
  const optimizationResult = optimizeBeamDesign(requirements, constraints, initialEstimate, targetMoment, targetShear);

  // 3단계: 결과 검증 및 포맷팅
  const finalResult = validateAndFormatResult(optimizationResult);

  return finalResult;
}

/** 보 너비에 따른 사용 가능한 철근 직경 범위 반환 */
function getAvailableDiametersForWidth(beamWidth: number): number[] {
  if (beamWidth <= 250) {
    // 좁은 보 (200-250mm): D13-D19 주로 사용
    return SUPPORTED_STEEL_DIAMETER.filter((d) => d >= 13 && d <= 19);
  } else if (beamWidth <= 400) {
    // 중간 보 (250-400mm): D19-D25 주로 사용
    return SUPPORTED_STEEL_DIAMETER.filter((d) => d >= 19 && d <= 25);
  } else {
    // 넓은 보 (400mm+): D22-D32 주로 사용
    return SUPPORTED_STEEL_DIAMETER.filter((d) => d >= 22 && d <= 32);
  }
}

/** 보 너비에 따른 최대 철근 수 반환 */
function getMaxSteelCountForWidth(beamWidth: number): number {
  if (beamWidth <= 250) {
    // 좁은 보: 최대 4개
    return 4;
  } else if (beamWidth <= 400) {
    // 중간 보: 최대 6개
    return 6;
  } else {
    // 넓은 보: 최대 8개
    return 8;
  }
}

/** 필요 철근 단면적으로부터 최적 철근 개수/직경 조합 추정 */
function estimateSteelConfiguration(requiredArea: number, beamWidth: number) {
  // 보의 너비별 사용 가능한 철근 직경과 최대 개수 설정
  const availableDiameters = getAvailableDiametersForWidth(beamWidth);
  const maxSteelCount = getMaxSteelCountForWidth(beamWidth);

  let bestConfig = { count: 2, diameter: availableDiameters[0] };
  let minWaste = Infinity;

  // 가능한 모든 철근 조합 검토
  for (const diameter of availableDiameters) {
    const singleArea = SteelArea[diameter as keyof typeof SteelArea];
    const requiredCount = Math.ceil(requiredArea / singleArea);

    // 제약조건 확인 (보 너비별 최대 철근 수 제한 적용)
    if (requiredCount < 2 || requiredCount > maxSteelCount) continue;

    const actualArea = singleArea * requiredCount;
    const waste = actualArea - requiredArea;

    // 낭비가 적고 개수가 적은 조합 선호 (TODO: 현업에서 주로 사용하는 조합을 기준으로 패널티 부여방식 변경하면 더 좋을듯)
    const penalty = waste + (requiredCount - 2) * singleArea * 1.2;

    if (penalty < minWaste) {
      minWaste = penalty;
      bestConfig = { count: requiredCount, diameter: diameter };
    }
  }

  return {
    steel_count: bestConfig.count,
    steel_diameter: bestConfig.diameter,
  };
}

/** 초기 치수 추정 */
function estimateInitialDimensions(
  requirements: BeamReversedType,
  constraints: BeamReversedConstraints,
  targetMoment: number,
  targetShear: number
) {
  const { fc_prime, fy_b, fy_t, elasticity_steel } = requirements;

  // 콘크리트 등가응력블록 파라미터 가져오기
  const { beta, eta, eps_cu } = getEquivalentRectangularStressValues(fc_prime);

  // ===== 주어진 공식 기반 초기 치수 추정 =====
  // c: 압축대 깊이, h: 높이, b: 너비, β: 콘크리트 응력블록 계수, Ac: 등가직사각형 통해 변환된 콘크리트 단면적, Sc: 콘크리트 Stress
  // 1. Mc = Fc * (h / 2 - c * β / 2)
  // 2. Fc = Sc * Ac
  // 3. Sc = η * fc' * 0.85
  // 4. Ac = β * c * b
  // (이해 어려울시 public > assets > equivalent-rectangle.png 참고)
  //
  // 조합하면: Mc = η * fc' * 0.85 * β * c * b * (h / 2 - c * β / 2)

  // 초기 가정값들
  const assumed_width = (constraints.min_width + constraints.max_width) / 2; // mm (초기 가정 너비)
  const assumed_c_ratio = 0.25; // c/h 비율 가정 (균형철근비보다 낮게 해서 인장지배 파괴 가정, 일반적으로 균형 상태에서 c/h = 0.375 ~ 0.5)

  // STEP1. 높이 추정
  // c/h = 0.25 가정하에 높이 계산
  // h를 기준으로 c = 0.25*h 대입
  // Mc = η * fc' * 0.85 * β * (0.25*h) * b * (h/2 - (0.25*h)*β/2)
  // Mc = η * fc' * 0.85 * β * 0.25 * h * b * (0.5 - 0.125*β) * h
  // Mc = η * fc' * 0.85 * β * 0.25 * b * (0.5 - 0.125*β) * h²

  const concrete_stress = Math.abs(eta * fc_prime * 0.85);
  const lever_arm_factor = 0.5 - (assumed_c_ratio / 2) * beta;
  const height_coefficient = concrete_stress * beta * assumed_c_ratio * assumed_width * lever_arm_factor;

  const estimatedHeight = Math.sqrt(targetMoment / height_coefficient);
  // 높이 제한 적용
  const h = Math.max(constraints.min_height, Math.min(constraints.max_height, estimatedHeight));

  // STEP2. 너비 추정 (전단 조건 + 모멘트 조건 고려)
  const c = assumed_c_ratio * h;
  // 유효깊이 추정: 일반적인 주철근 직경(D25)의 반지름을 가정
  const assumed_steel_radius = SUPPORTED_STEEL_DIAMETER[5] / 2; // D25 철근의 반지름 = 12.5mm로 가정
  const d = h - constraints.cover - assumed_steel_radius;

  // 전단 조건에서 너비 추정: Vc = (1/6) * √(fc') * b * d
  const shearBasedWidth = (targetShear * 6) / (Math.sqrt(fc_prime) * d);

  // 모멘트 조건에서 너비 추정
  // Mc = η * fc' * 0.85 * β * c * b * (h/2 - c*β/2)
  const Ac = beta * c; // 단위 너비당 콘크리트 단면적
  const Fc_per_width = concrete_stress * Ac; // 단위 너비당 콘크리트 Stress
  const lever_arm = h / 2 - (c * beta) / 2; // 레버암
  const momentBasedWidth = targetMoment / (Fc_per_width * lever_arm);

  // 두 조건 중 더 큰 값 선택 (안전측)
  const estimatedWidth = Math.max(shearBasedWidth, momentBasedWidth);
  const b = Math.max(constraints.min_width, Math.min(constraints.max_width, estimatedWidth));

  // STEP3. 필요 철근량 계산
  // 평형조건: Fc + Fsc + Fst = 0
  // Fc: 콘크리트 압축력, Fsc: 압축철근력, Fst: 인장철근력
  // 따라서: Fst = -(Fc + Fsc)

  const top_steel_y = constraints.cover + assumed_steel_radius; // 압축철근 위치

  // 1. 콘크리트 압축력 계산
  const concrete_compression_force = Fc_per_width * b;

  // 2. 압축철근 변형률 및 응력 계산
  const steel_compression_strain = (Math.abs(eps_cu) * (c - top_steel_y)) / c;
  const steel_compression_stress = Math.max(-fy_t, Math.min(fy_t, steel_compression_strain * elasticity_steel));

  // 3. 가정된 압축철근량 (최소 철근비 적용)
  const min_steel_ratio = 0.002; // 최소 철근비 0.2%
  const assumed_compression_steel_area = min_steel_ratio * b * h;
  const steel_compression_force = steel_compression_stress * assumed_compression_steel_area;

  // 4. 평형조건에서 필요한 인장철근력
  const required_steel_tension_force = concrete_compression_force + steel_compression_force;

  // 5. 필요 인장철근 단면적
  const requiredSteelArea = required_steel_tension_force / fy_b;

  // 6. 압축철근 개수/직경 추정
  const { steel_count: top_steel_count, steel_diameter: top_steel_diameter } = estimateSteelConfiguration(
    assumed_compression_steel_area,
    b
  );

  const { steel_count: bottom_steel_count, steel_diameter: bottom_steel_diameter } = estimateSteelConfiguration(
    requiredSteelArea,
    b
  );

  // 7. 전단강도 기반 늑근 간격 추정
  // Vs = Av * fy * d / s (필요 전단 보강량)
  // Vc = (1/6) * √(fc') * b * d (콘크리트 전단강도)
  // 필요 전단 보강: Vs_required = V - ϕ*Vc (여기서 ϕ = 0.75)
  const phi_shear = 0.75;
  const concrete_shear_strength = (Math.sqrt(fc_prime) * b * d) / 6;
  const required_stirrup_shear = Math.max(0, targetShear - phi_shear * concrete_shear_strength);

  // 늑근 간격 계산: s = Av * fy * d / Vs_required
  const assumed_stirrup_diameter = 13; // D13 기본 가정
  const stirrup_area = SteelArea[assumed_stirrup_diameter as keyof typeof SteelArea] * 2; // 단면에서 한번감으면 2개 생김
  const optimal_stirrup_spacing =
    required_stirrup_shear > 0
      ? Math.min(
          constraints.max_stirrup_spacing,
          Math.max(constraints.min_stirrup_spacing, (stirrup_area * requirements.fy_v * d) / required_stirrup_shear)
        )
      : constraints.max_stirrup_spacing;

  return {
    width: Math.round(b),
    height: Math.round(h),
    steel_area: requiredSteelArea,
    top_steel_count,
    top_steel_diameter,
    bottom_steel_count,
    bottom_steel_diameter,
    stirrup_spacing: Math.round(optimal_stirrup_spacing),
    stirrup_diameter: assumed_stirrup_diameter,
  };
}

/** 유전 알고리즘 최적화 */
function optimizeBeamDesign(
  requirements: BeamReversedType,
  constraints: BeamReversedConstraints,
  initial: any,
  targetMoment: number,
  targetShear: number
) {
  const MAX_ITERATIONS = 500;
  const POPULATION_SIZE = 100;
  const CONVERGENCE_THRESHOLD = 0.001; // 수렴 조건
  const STABILITY_GENERATIONS = 100; // 안정성

  // 초기 개체군 생성 (더 많은 초기 추정값 기반 개체 포함)
  let population = generateInitialPopulation(constraints, initial, POPULATION_SIZE);

  let bestSolution = null;
  let bestFitness = Infinity;
  let iterations = 0;
  let stableGenerations = 0; // 안정된 세대 수 카운트

  for (let gen = 0; gen < MAX_ITERATIONS; gen++) {
    iterations++;

    // 각 개체 평가
    const evaluatedPopulation = population.map((individual) => {
      const beam = createBeamFromIndividual(individual, requirements, constraints);
      const fitness = evaluateFitness(beam, targetMoment, targetShear);
      return { individual, beam, fitness };
    });

    // 최적해 업데이트
    const currentBest = evaluatedPopulation.reduce((best, current) =>
      current.fitness < best.fitness ? current : best
    );

    if (currentBest.fitness < bestFitness) {
      const improvement = bestFitness - currentBest.fitness;
      // 개선이 매우 미미한 경우 안정 카운터 증가 (지나치게 빠른 수렴 방지)
      if (improvement < 0.01) {
        stableGenerations++;
      } else {
        stableGenerations = 0; // 유의미한 개선이 있으면 안정 카운터 리셋
      }
      bestFitness = currentBest.fitness;
      bestSolution = currentBest;
    } else {
      stableGenerations++;
    }

    // 수렴 조건 확인
    if (bestFitness < CONVERGENCE_THRESHOLD || stableGenerations >= STABILITY_GENERATIONS) break;

    // 다음 세대 생성
    population = generateNextGeneration(constraints, evaluatedPopulation, POPULATION_SIZE);
  }

  const status =
    bestFitness < CONVERGENCE_THRESHOLD
      ? "수렴됨"
      : stableGenerations >= STABILITY_GENERATIONS
      ? "안정화됨"
      : iterations >= MAX_ITERATIONS
      ? "최대반복횟수도달"
      : "해를찾을수없음";
  console.log(`최적화 완료: ${status} (세대: ${iterations}, 최적해 적합도: ${bestFitness})`);

  return {
    best_solution: bestSolution?.beam,
    fitness: bestFitness,
    iterations,
    status,
  };
}

/** 개체군 초기화 */
function generateInitialPopulation(constraints: BeamReversedConstraints, initial: any, size: number) {
  const population = [];

  const initialBasedCount = Math.floor(size * 0.2); // 전체 개체의 20%를 초기 추정값 기반으로 설정

  for (let i = 0; i < size; i++) {
    const width = randomBetween(constraints.min_width, constraints.max_width);
    const availableDiameters = getAvailableDiametersForWidth(width);
    const maxSteelCount = getMaxSteelCountForWidth(width);
    const useDiameters = availableDiameters.length > 0 ? availableDiameters : constraints.available_diameters;

    const individual = {
      width: width,
      height: randomBetween(constraints.min_height, constraints.max_height),
      top_steel_count: randomInt(2, maxSteelCount),
      top_steel_diameter: randomChoice(useDiameters),
      bottom_steel_count: randomInt(2, maxSteelCount),
      bottom_steel_diameter: randomChoice(useDiameters),
      stirrup_diameter: randomChoice(constraints.stirrup_diameters),
      stirrup_spacing: randomBetween(constraints.min_stirrup_spacing, constraints.max_stirrup_spacing),
    };

    // 초기 추정값 기반 개체들 생성 (처음 20%는 초기값 기반)
    if (i < initialBasedCount) {
      individual.width = initial.width + randomBetween(-50, 50);
      individual.height = initial.height + randomBetween(-50, 50);
      individual.top_steel_count = initial.top_steel_count + randomInt(-1, 1);
      individual.top_steel_diameter = initial.top_steel_diameter;
      individual.bottom_steel_count = initial.bottom_steel_count + randomInt(-1, 1);
      individual.bottom_steel_diameter = initial.bottom_steel_diameter;
      individual.stirrup_diameter = initial.stirrup_diameter;
      individual.stirrup_spacing = initial.stirrup_spacing + randomBetween(-20, 20);

      // 제약조건 적용
      individual.width = Math.max(constraints.min_width, Math.min(constraints.max_width, individual.width));
      individual.height = Math.max(constraints.min_height, Math.min(constraints.max_height, individual.height));
      individual.stirrup_spacing = Math.max(
        constraints.min_stirrup_spacing,
        Math.min(constraints.max_stirrup_spacing, individual.stirrup_spacing)
      );
    }

    population.push(individual);
  }

  return population;
}

/** 개체를 BeamType으로 변환 */
function createBeamFromIndividual(
  individual: any,
  requirements: BeamReversedType,
  constraints: BeamReversedConstraints
): BeamType {
  const { cover } = constraints;

  return {
    [Beam.fc_prime]: requirements.fc_prime,
    [Beam.elasticity_steel]: requirements.elasticity_steel,
    [Beam.b]: individual.width,
    [Beam.h]: individual.height,

    // 상부 철근
    [Beam.fy_t]: requirements.fy_t,
    [Beam.top_steel_n]: individual.top_steel_count,
    [Beam.top_steel_d]: individual.top_steel_diameter,
    [Beam.top_steel_y]: cover + individual.top_steel_diameter / 2,

    // 하부 철근
    [Beam.fy_b]: requirements.fy_b,
    [Beam.bottom_steel_n]: individual.bottom_steel_count,
    [Beam.bottom_steel_d]: individual.bottom_steel_diameter,
    [Beam.bottom_steel_y]: individual.height - cover - individual.bottom_steel_diameter / 2,

    // 늑근
    [Beam.fy_v]: requirements.fy_v,
    [Beam.stirrup_n]: 2, // 기본 2개 (한 바퀴)
    [Beam.stirrup_d]: individual.stirrup_diameter,
    [Beam.stirrup_s]: individual.stirrup_spacing,
    [Beam.stirrup_h_prime]: individual.height - 2 * cover,
  };
}

/** 적합도 평가 */
function evaluateFitness(beam: BeamType, targetMoment: number, targetShear: number): number {
  try {
    const result = computeBeamDesign(beam);

    // 강도 요구사항 만족도 계산
    const actualMoment = result.total_moment * result.pi_moment;
    const actualShear = result.shear_force * result.pi_shear_force;

    const momentRatio = actualMoment / targetMoment;
    const shearRatio = actualShear / targetShear;

    // 제약조건 위반 페널티
    let penalty = 0;
    if (momentRatio < 1.0) penalty += (1.0 - momentRatio) * 1000; // 강도 부족 심각한 페널티
    if (shearRatio < 1.0) penalty += (1.0 - shearRatio) * 1000;

    // TODO: 경제성 지표 계산 (콘크리트 체적, 철근 중량, 늑근 비용 등)
    // const concreteVolume = 콘크리트 체적 구하는 식
    // const steelAreaTop = SteelArea[beam[Beam.top_steel_d] as keyof typeof SteelArea] * beam[Beam.top_steel_n];
    // const steelAreaBottom = SteelArea[beam[Beam.bottom_steel_d] as keyof typeof SteelArea] * beam[Beam.bottom_steel_n];
    // const stirrupArea = SteelArea[beam[Beam.stirrup_d] as keyof typeof SteelArea] * beam[Beam.stirrup_n];

    // // 늑근 밀도 계산 (1m당 늑근 개수)
    // const stirrupDensity = 1000 / beam[Beam.stirrup_s]; // 개/m
    // const stirrupWeight = stirrupArea * stirrupDensity * 단위 중량 변환 계수 값(ex. 7.85e-6 같은값 넣으면 될듯); // kg/m
    // const mainSteelWeight = (steelAreaTop + steelAreaBottom) * 단위 중량 변환 계수 값(ex. 7.85e-6); // kg/m

    // // 총 비용 함수 (임의의 가중치) -> 각 재료의 단가 구해서 가중치 조정해주면 될듯
    // const cost = concreteVolume * 100 + mainSteelWeight * 1.2 + stirrupWeight * 1.5; // 늑근은 가공비 고려하여 높은 단가

    // 과설계 페널티 (1% 이상 초과시)
    const overDesignPenalty = Math.max(0, momentRatio - 1.01) * 100 + Math.max(0, shearRatio - 1.01) * 100;

    return penalty + overDesignPenalty /** + cost */;
  } catch (error) {
    return 1e6; // 계산 실패시 큰 페널티
  }
}

/** 다음 세대 생성 (선택, 교배, 돌연변이) */
function generateNextGeneration(constraints: BeamReversedConstraints, evaluatedPopulation: any[], size: number) {
  // 엘리트 선택 (상위 20%)
  const sorted = evaluatedPopulation.sort((a, b) => a.fitness - b.fitness);
  const eliteCount = Math.floor(size * 0.2);
  const nextGeneration = sorted.slice(0, eliteCount).map((item) => item.individual);

  // 나머지는 토너먼트 선택 + 교배로 생성
  while (nextGeneration.length < size) {
    // 첫 부모 선택
    const parent1 = tournamentSelection(evaluatedPopulation, 5);
    // 두 번째 부모 선택
    const parent2 = tournamentSelection(evaluatedPopulation, 5);
    // 교배
    const offspring = crossover(parent1.individual, parent2.individual);
    // 돌연변이 발생 (8% 확률)
    const mutated = mutate(offspring, constraints, 0.08);
    nextGeneration.push(mutated);
  }

  return nextGeneration;
}

/** 토너먼트 선택 */
function tournamentSelection(population: any[], tournamentSize: number = 3) {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    tournament.push(population[randomInt(0, population.length - 1)]);
  }
  return tournament.reduce((best, current) => (current.fitness < best.fitness ? current : best));
}

/** 교배 연산 */
function crossover(parent1: any, parent2: any) {
  return {
    width: randomChoice([parent1.width, parent2.width]),
    height: randomChoice([parent1.height, parent2.height]),
    top_steel_count: randomChoice([parent1.top_steel_count, parent2.top_steel_count]),
    top_steel_diameter: randomChoice([parent1.top_steel_diameter, parent2.top_steel_diameter]),
    bottom_steel_count: randomChoice([parent1.bottom_steel_count, parent2.bottom_steel_count]),
    bottom_steel_diameter: randomChoice([parent1.bottom_steel_diameter, parent2.bottom_steel_diameter]),
    stirrup_diameter: randomChoice([parent1.stirrup_diameter, parent2.stirrup_diameter]),
    stirrup_spacing: randomChoice([parent1.stirrup_spacing, parent2.stirrup_spacing]),
  };
}

/** 돌연변이 연산 */
function mutate(individual: any, constraints: BeamReversedConstraints, mutationRate: number = 0.08) {
  const mutated = { ...individual };

  const largeChangeProb = 0.3; // 30% 확률로 큰 변화

  if (Math.random() < mutationRate) {
    const changeAmount = Math.random() < largeChangeProb ? randomBetween(-50, 50) : randomBetween(-25, 25);
    mutated.width += changeAmount;
    mutated.width = Math.max(constraints.min_width, Math.min(constraints.max_width, mutated.width));
  }

  if (Math.random() < mutationRate) {
    const changeAmount = Math.random() < largeChangeProb ? randomBetween(-50, 50) : randomBetween(-25, 25);
    mutated.height += changeAmount;
    mutated.height = Math.max(constraints.min_height, Math.min(constraints.max_height, mutated.height));
  }

  if (Math.random() < mutationRate) {
    const maxSteelCount = getMaxSteelCountForWidth(mutated.width);
    mutated.bottom_steel_count = Math.max(2, Math.min(maxSteelCount, mutated.bottom_steel_count + randomInt(-2, 2)));
  }

  if (Math.random() < mutationRate) {
    const maxSteelCount = getMaxSteelCountForWidth(mutated.width);
    mutated.top_steel_count = Math.max(2, Math.min(maxSteelCount, mutated.top_steel_count + randomInt(-2, 2)));
  }

  // 보의 너비에 따른 적절한 철근 직경 범위 선택
  // 철근 직경 변경 확률 -> 1.5배
  if (Math.random() < mutationRate * 1.5) {
    const availableDiameters = getAvailableDiametersForWidth(mutated.width);
    mutated.bottom_steel_diameter = randomChoice(availableDiameters);
  }

  if (Math.random() < mutationRate * 1.5) {
    const availableDiameters = getAvailableDiametersForWidth(mutated.width);
    mutated.top_steel_diameter = randomChoice(availableDiameters);
  }

  if (Math.random() < mutationRate) {
    const changeAmount = Math.random() < largeChangeProb ? randomBetween(-30, 30) : randomBetween(-15, 15);
    mutated.stirrup_spacing += changeAmount;
    mutated.stirrup_spacing = Math.max(
      constraints.min_stirrup_spacing,
      Math.min(constraints.max_stirrup_spacing, mutated.stirrup_spacing)
    );
  }

  return mutated;
}

/** 결과 검증 및 포맷팅 */
function validateAndFormatResult(optimization: any): BeamReversedResult {
  if (!optimization.best_solution) {
    throw new Error("최적화 실패: 해를 찾을 수 없습니다.");
  }

  const beam = optimization.best_solution;
  const result = computeBeamDesign(beam);

  // 실제 용량 계산 (N*mm → kN*m, N → kN로 변환)
  const actualMoment = (result.total_moment * result.pi_moment) / 1000000;
  const actualShear = (result.shear_force * result.pi_shear_force) / 1000;

  return {
    b: beam[Beam.b],
    h: beam[Beam.h],
    top_steel_n: beam[Beam.top_steel_n],
    top_steel_d: beam[Beam.top_steel_d],
    top_steel_y: beam[Beam.top_steel_y],
    bottom_steel_n: beam[Beam.bottom_steel_n],
    bottom_steel_d: beam[Beam.bottom_steel_d],
    bottom_steel_y: beam[Beam.bottom_steel_y],
    stirrup_n: beam[Beam.stirrup_n],
    stirrup_d: beam[Beam.stirrup_d],
    stirrup_s: beam[Beam.stirrup_s],
    stirrup_h_prime: beam[Beam.stirrup_h_prime],
    actualMoment,
    actualShear,
  };
}

// 유틸리티 함수들
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

interface BeamReversedConstraints {
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  cover: number; // 피복 두께
  available_diameters: number[];
  max_steel_count: number;
  min_stirrup_spacing: number; // 최소 늑근 간격
  max_stirrup_spacing: number; // 최대 늑근 간격
  stirrup_diameters: number[]; // 허용 늑근 직경
}
