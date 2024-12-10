import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import React, { Dispatch, SetStateAction } from "react";
import {
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Wrap,
} from "@chakra-ui/react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/** P-M 그래프 */
const PMGraphGraphic = ({
  data,
  pMax,
  testLoad,
  setTestLoad,
}: {
  data: { p: number; m: number; pi: number }[];
  pMax: number;
  testLoad: {
    force?: number;
    moment?: number;
  };
  setTestLoad: Dispatch<
    SetStateAction<{
      force?: number;
      moment?: number;
    }>
  >;
}) => {
  const pmData = data.map((d) => ({ m: d.m / 1000000, p: d.p / 1000, pi: d.pi }));
  const datasets = [
    // Pmax 적용된 P-M 그래프
    {
      label: "P-M with Pmax",
      data: pmData.map((d) => ({ x: d.m, y: Math.min(pMax / 1000, d.p) })), // x, y 데이터
      backgroundColor: "rgba(75, 192, 192, 1)",
      borderWidth: 0,
      pointRadius: 1.8,
    },
    // ϕPmax적용된 ϕP-ϕM 그래프
    {
      label: "ϕP-ϕM with ϕPmax",
      data: pmData.map((d) => ({ x: d.m * d.pi, y: Math.min((pMax * d.pi) / 1000, d.p * d.pi) })), // x, y 데이터
      backgroundColor: "rgba(255, 165, 0, 1)",
      borderWidth: 0,
      pointRadius: 1.8,
    },

    // P-M 그래프
    {
      label: "P-M",
      data: pmData.map((d) => ({ x: d.m, y: d.p })), // x, y 데이터
      backgroundColor: "rgba(211, 211, 211, 1)",
      borderWidth: 0,
      pointRadius: 1,
    },
    // ϕP-ϕM 그래프
    {
      label: "ϕP-ϕM",
      data: pmData.map((d) => ({ x: d.m * d.pi, y: d.p * d.pi })), // x, y 데이터
      backgroundColor: "rgba(211, 211, 211, 1)",
      borderWidth: 0,
      pointRadius: 1,
    },
  ];
  if (testLoad.force !== undefined && testLoad.moment !== undefined) {
    datasets.unshift(
      // 요구강도 그래프
      {
        label: "테스트 강도",
        data: [{ x: testLoad.moment, y: testLoad.force }],
        backgroundColor: "rgba(255, 0, 0, 1)",
        borderWidth: 0,
        pointRadius: 5,
      }
    );
  }

  const chartData = {
    labels: pmData.map((d) => d.m), // x축 데이터
    datasets: datasets,
  };

  const options = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "M (kN*m)" } },
      y: { title: { display: true, text: "P (kN)" } },
    },
  };

  return (
    <div className="flex flex-col">
      <Scatter data={chartData} options={options} />
      <Heading ml={4} size="sm">
        🧪 요구강도 테스트 (테스트할 하중을 입력해주세요)
      </Heading>
      <Wrap ml={4} my={4} alignItems="center" spacingX={10}>
        <div className="flex items-center gap-4">
          {/* 요구 축력 입력 필드*/}
          <div className="text-[16px] font-bold">{"Pu (kN)"}</div>
          <NumberInput
            step={1}
            name="force"
            value={testLoad.force}
            onChange={(valueString) => setTestLoad((e) => ({ ...e, force: Number(valueString) }))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </div>

        {/* 요구 휨 모멘트 입력 필드*/}
        <div className="flex items-center gap-4">
          <div className="text-[16px] font-bold">{"Mu (kN*m)"}</div>
          <NumberInput
            step={1}
            name="moment"
            value={testLoad.moment}
            min={0}
            onChange={(valueString) => setTestLoad((e) => ({ ...e, moment: Number(valueString) }))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </div>
      </Wrap>
    </div>
  );
};

export default React.memo(PMGraphGraphic);
