import computeBeamReversed from "@/logics/beam-reversed.logic";
import { BeamReversedResult, BeamReversedType } from "@/types/beam.type";
import { PAGE_STEP } from "@/types/step.type";
import { useFormik } from "formik";
import { useState } from "react";
import * as yup from "yup";
// BeamReversedPage 상태관리
export function useBeamReversedState() {
  // 페이지 스텝 (입력, 처리, 결과)
  const [pageStep, setPageStep] = useState<PAGE_STEP>(PAGE_STEP.INPUT);

  // 처리 결과
  const [result, setResult] = useState<BeamReversedResult>();

  // 입력 데이터 관리
  const formik = useFormik<BeamReversedType>({
    initialValues: {
      requiredMoment: 500, // kN*m
      requiredShear: 200, // kN

      minWidth: 250, // mm
      maxWidth: 600, // mm
      minHeight: 500, // mm
      maxHeight: 1200, // mm

      fc_prime: 30, // MPa
      fy_t: 600, // MPa
      fy_b: 600, // MPa
      fy_v: 400, // MPa
      elasticity_steel: 200000, // MPa
    },
    onSubmit: (values) => {
      // 상태를 PROCESSING으로 업데이트
      setPageStep(PAGE_STEP.PROCESSING);

      // 역설계 계산을 비동기로 실행
      setTimeout(() => {
        const result = computeBeamReversed(values);
        setResult(result);
        // 상태를 RESULT로 업데이트
        setPageStep(PAGE_STEP.RESULT);
      }, 0);
    },
    validationSchema: yup.object({
      requiredMoment: yup
        .number()
        .required("요구 모멘트 강도는 필수입니다.")
        .positive("요구 모멘트 강도는 양수여야 합니다."),
      requiredShear: yup
        .number()
        .required("요구 전단 강도는 필수입니다.")
        .positive("요구 전단 강도는 양수여야 합니다."),

      minWidth: yup.number().required().positive(),
      maxWidth: yup
        .number()
        .required()
        .positive()
        .moreThan(yup.ref("minWidth"), "최대 너비는 최소 너비보다 커야 합니다."),
      minHeight: yup.number().required().positive(),
      maxHeight: yup
        .number()
        .required()
        .positive()
        .moreThan(yup.ref("minHeight"), "최대 높이는 최소 높이보다 커야 합니다."),

      fc_prime: yup.number().required().positive(),
      fy_t: yup.number().required().positive(),
      fy_b: yup.number().required().positive(),
      fy_v: yup.number().required().positive(),
      elasticity_steel: yup.number().required().positive(),
    }),
  });

  return { pageStep, setPageStep, formik, result };
}
