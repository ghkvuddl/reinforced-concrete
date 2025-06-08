import { useBeamReversedState } from "@/hooks/useBeamReversedState";
import { PAGE_STEP } from "@/types/step.type";
import { BeamReversed, BeamReversedDisplayName, BeamReversedToolTip, BeamReversedType } from "@/types/beam.type";
import {
  Button,
  Center,
  Divider,
  Heading,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Text,
  Tooltip,
  Box,
  FormControl,
  FormLabel,
  VStack,
} from "@chakra-ui/react";
import { FormikErrors } from "formik";
import { useRouter } from "next/router";

// BeamReversedPage UI
const BeamReversedPage = () => {
  const router = useRouter();
  const { pageStep, setPageStep, formik, result } = useBeamReversedState();

  switch (pageStep) {
    // 데이터 입력 UI
    case PAGE_STEP.INPUT:
      return (
        <form onSubmit={formik.handleSubmit} className="p-8">
          {/* 요구 강도 입력 */}
          <Heading size="md">✏️ 요구 강도</Heading>
          <VStack my={6} gap={4}>
            <BeamReversedInputComponent
              type={BeamReversed.requiredMoment}
              value={formik.values.requiredMoment}
              setValue={formik.setFieldValue}
              step={50}
            />

            <BeamReversedInputComponent
              type={BeamReversed.requiredShear}
              value={formik.values.requiredShear}
              setValue={formik.setFieldValue}
              step={20}
            />
          </VStack>
          <Divider my={8} />

          {/* 단면 제약 조건 */}
          <Heading size="md">✏️ 단면 제약 조건</Heading>
          <VStack my={6} gap={4}>
            <BeamReversedInputComponent
              type={BeamReversed.minWidth}
              value={formik.values.minWidth}
              setValue={formik.setFieldValue}
              step={10}
              min={200}
            />

            <BeamReversedInputComponent
              type={BeamReversed.maxWidth}
              value={formik.values.maxWidth}
              setValue={formik.setFieldValue}
              step={10}
              min={formik.values.minWidth}
            />

            <BeamReversedInputComponent
              type={BeamReversed.minHeight}
              value={formik.values.minHeight}
              setValue={formik.setFieldValue}
              step={10}
              min={300}
            />

            <BeamReversedInputComponent
              type={BeamReversed.maxHeight}
              value={formik.values.maxHeight}
              setValue={formik.setFieldValue}
              step={10}
              min={formik.values.minHeight}
            />
          </VStack>
          <Divider my={8} />

          {/* 재료 속성 */}
          <Heading size="md">✏️ 재료 속성</Heading>
          <VStack my={6} gap={4}>
            <BeamReversedInputComponent
              type={BeamReversed.fc_prime}
              value={formik.values.fc_prime}
              setValue={formik.setFieldValue}
              step={1}
              min={21}
              max={50}
            />

            <BeamReversedInputComponent
              type={BeamReversed.fy_t}
              value={formik.values.fy_t}
              setValue={formik.setFieldValue}
              step={50}
            />

            <BeamReversedInputComponent
              type={BeamReversed.fy_b}
              value={formik.values.fy_b}
              setValue={formik.setFieldValue}
              step={50}
            />

            <BeamReversedInputComponent
              type={BeamReversed.fy_v}
              value={formik.values.fy_v}
              setValue={formik.setFieldValue}
              step={50}
            />

            <BeamReversedInputComponent
              type={BeamReversed.elasticity_steel}
              value={formik.values.elasticity_steel}
              setValue={formik.setFieldValue}
              step={10000}
              min={100000}
            />
          </VStack>

          {/* 계산 버튼 */}
          <Button isDisabled={!formik.isValid} mt={8} w="full" type="submit" colorScheme="blue">
            Show Result
          </Button>
        </form>
      );

    // 데이터 처리중 UI
    case PAGE_STEP.PROCESSING:
      return (
        <Center h="full">
          <Spinner thickness="4px" color="blue.500" size="lg" />
        </Center>
      );

    // 결과 UI
    case PAGE_STEP.RESULT:
      if (!result) return null;

      return (
        <div className="p-8">
          {/* 계산 결과 */}
          <Heading size="lg" mb={6}>
            최적 단면 설계 결과
          </Heading>

          {/* 단면 정보 */}
          <Box p={4} borderWidth="1px" borderRadius="lg" mb={6}>
            <Heading size="md" mb={4}>
              🔶 단면 정보
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <ResultComponent title="너비 b (mm)" value={result.b} />
              <ResultComponent title="높이 h (mm)" value={result.h} />
            </HStack>
          </Box>

          {/* 상부 철근 정보 */}
          <Box p={4} borderWidth="1px" borderRadius="lg" mb={6}>
            <Heading size="md" mb={4}>
              🔶 상부 철근 정보
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <ResultComponent title="철근 수" value={result.top_steel_n} />
              <ResultComponent title="직경 (mm)" value={result.top_steel_d} />
              <ResultComponent title="위치 (mm)" value={result.top_steel_y} />
            </HStack>
          </Box>

          {/* 하부 철근 정보 */}
          <Box p={4} borderWidth="1px" borderRadius="lg" mb={6}>
            <Heading size="md" mb={4}>
              🔶 하부 철근 정보
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <ResultComponent title="철근 수" value={result.bottom_steel_n} />
              <ResultComponent title="직경 (mm)" value={result.bottom_steel_d} />
              <ResultComponent title="위치 (mm)" value={result.bottom_steel_y} />
            </HStack>
          </Box>

          {/* 늑근 정보 */}
          <Box p={4} borderWidth="1px" borderRadius="lg" mb={6}>
            <Heading size="md" mb={4}>
              🔶 늑근(띠철근) 정보
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <ResultComponent title="철근 수( 2 = 한바퀴 )" value={result.stirrup_n} />
              <ResultComponent title="직경 (mm)" value={result.stirrup_d} />
              <ResultComponent title="간격 (mm)" value={result.stirrup_s} />
              <ResultComponent title="유효 깊이 (mm)" value={result.stirrup_h_prime} />
            </HStack>
          </Box>

          {/* 강도 검증 */}
          <Box p={4} borderWidth="1px" borderRadius="lg" mb={6} bgColor="blue.50">
            <Heading size="md" mb={4}>
              🔶 강도 검증
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <ResultComponent title="요구 모멘트 강도 (kN*m)" value={formik.values.requiredMoment} />
              <ResultComponent
                title="실제 모멘트 강도 (kN*m)"
                value={result.actualMoment}
                color={result.actualMoment >= formik.values.requiredMoment ? "green.500" : "red.500"}
              />
              <ResultComponent title="요구 전단 강도 (kN)" value={formik.values.requiredShear} />
              <ResultComponent
                title="실제 전단 강도 (kN)"
                value={result.actualShear}
                color={result.actualShear >= formik.values.requiredShear ? "green.500" : "red.500"}
              />
            </HStack>
          </Box>

          <HStack w="full" mt={4}>
            <Button className="flex-grow" onClick={() => setPageStep(PAGE_STEP.INPUT)} colorScheme="blue">
              Back
            </Button>
            <Button className="flex-grow" onClick={() => router.push("/")} colorScheme="blue">
              Home
            </Button>
          </HStack>
        </div>
      );
  }
};

export default BeamReversedPage;

/** 데이터 입력 컴포넌트 */
const BeamReversedInputComponent = ({
  type,
  step,
  value = 0,
  setValue,
  min = 1,
  max = 9999999,
}: {
  type: BeamReversed;
  step?: number;
  value?: number;
  setValue?: (
    field: string,
    value: any,
    shouldValidate?: boolean
  ) => Promise<void> | Promise<FormikErrors<BeamReversedType>>;
  min?: number;
  max?: number;
}) => {
  return (
    <Tooltip label={BeamReversedToolTip[type]}>
      <FormControl>
        <FormLabel fontWeight="bold">{BeamReversedDisplayName[type]}</FormLabel>
        <NumberInput
          value={value}
          onChange={(valueString) => setValue && setValue(type, Number(valueString))}
          step={step}
          min={min}
          max={max}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    </Tooltip>
  );
};

/** 결과 표시 컴포넌트 */
const ResultComponent = ({ title, value, color }: { title: string; value: number | string; color?: string }) => {
  return (
    <HStack my={2}>
      <Text fontWeight="bold">{`${title}:`}</Text>
      <Text fontSize="lg" fontWeight="medium" color={color}>
        {typeof value === "number" ? value.toFixed(2) : value}
      </Text>
    </HStack>
  );
};
