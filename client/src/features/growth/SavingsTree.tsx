import { useMemo } from "react";

interface SavingsTreeProps {
  /** Total saved balance in dollars */
  balance: number;
  /** Optional override size in pixels */
  size?: number;
}

interface TreeStage {
  trunkH: number;
  trunkW: number;
  canopyR: number;
  leafFill: string;
  leafStroke: string;
  label: string;
  stage: number; // 0-4
}

function getStage(balance: number): TreeStage {
  if (balance <= 0)
    return {
      trunkH: 0,
      trunkW: 0,
      canopyR: 0,
      leafFill: "#9fb8a3",
      leafStroke: "#8fa893",
      label: "Seed",
      stage: 0,
    };
  if (balance < 50)
    return {
      trunkH: 16,
      trunkW: 3,
      canopyR: 7,
      leafFill: "#8fb393",
      leafStroke: "#7fa383",
      label: "Sprout",
      stage: 1,
    };
  if (balance < 200)
    return {
      trunkH: 24,
      trunkW: 4,
      canopyR: 11,
      leafFill: "#6b9470",
      leafStroke: "#5b8460",
      label: "Sapling",
      stage: 2,
    };
  if (balance < 1000)
    return {
      trunkH: 32,
      trunkW: 5,
      canopyR: 15,
      leafFill: "#4d7a54",
      leafStroke: "#3d6a44",
      label: "Growing",
      stage: 3,
    };
  return {
    trunkH: 40,
    trunkW: 6,
    canopyR: 19,
    leafFill: "#3d6343",
    leafStroke: "#2d5333",
    label: "Full Bloom",
    stage: 4,
  };
}

function FallingCoin({ delay, x }: { delay: number; x: number }) {
  return (
    <g>
      <circle cx={x} cy={0} r={2} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.5}>
        <animate
          attributeName="cy"
          from="-5"
          to="50"
          dur="3s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.1;0.7;1"
          dur="3s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}

function LeafDecoration({
  cx,
  cy,
  delay,
}: {
  cx: number;
  cy: number;
  delay: number;
}) {
  return (
    <circle cx={cx} cy={cy} r={2.5} fill="#a8d5b0" opacity={0.7}>
      <animate
        attributeName="opacity"
        values="0.5;0.9;0.5"
        dur="4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

export function SavingsTree({ balance, size = 120 }: SavingsTreeProps) {
  const stage = useMemo(() => getStage(balance), [balance]);
  const vb = 60;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        width={size}
        height={size}
        className="drop-shadow-sm"
      >
        {/* Pot / base */}
        <path
          d="M20 48 L23 52 L37 52 L40 48 Z"
          fill="#a89880"
          stroke="#8a7a68"
          strokeWidth={0.5}
        />
        <rect
          x={18}
          y={46}
          width={24}
          height={3}
          rx={1.5}
          fill="#b8a890"
          stroke="#9a8a78"
          strokeWidth={0.5}
        />

        {/* Soil inside pot */}
        <ellipse cx={30} cy={48} rx={9} ry={1.5} fill="#5c4a3a" />

        {/* Trunk */}
        {stage.trunkH > 0 && (
          <rect
            x={30 - stage.trunkW / 2}
            y={48 - stage.trunkH}
            width={stage.trunkW}
            height={stage.trunkH}
            rx={1}
            fill="#8B6914"
            stroke="#7a5a10"
            strokeWidth={0.5}
            className="transition-all duration-700"
          />
        )}

        {/* Branch stubs for stage >= 2 */}
        {stage.stage >= 2 && (
          <>
            <line
              x1={30}
              y1={48 - stage.trunkH * 0.5}
              x2={30 - 5}
              y2={48 - stage.trunkH * 0.65}
              stroke="#8B6914"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <line
              x1={30}
              y1={48 - stage.trunkH * 0.65}
              x2={30 + 4}
              y2={48 - stage.trunkH * 0.8}
              stroke="#8B6914"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Main canopy */}
        {stage.canopyR > 0 && (
          <circle
            cx={30}
            cy={48 - stage.trunkH - stage.canopyR * 0.4}
            r={stage.canopyR}
            fill={stage.leafFill}
            stroke={stage.leafStroke}
            strokeWidth={0.8}
            className="transition-all duration-700"
          />
        )}

        {/* Secondary canopy layers for depth (stage >= 3) */}
        {stage.stage >= 3 && (
          <>
            <circle
              cx={30 - stage.canopyR * 0.5}
              cy={48 - stage.trunkH - stage.canopyR * 0.15}
              r={stage.canopyR * 0.65}
              fill={stage.leafFill}
              stroke={stage.leafStroke}
              strokeWidth={0.5}
              opacity={0.85}
            />
            <circle
              cx={30 + stage.canopyR * 0.5}
              cy={48 - stage.trunkH - stage.canopyR * 0.15}
              r={stage.canopyR * 0.65}
              fill={stage.leafFill}
              stroke={stage.leafStroke}
              strokeWidth={0.5}
              opacity={0.85}
            />
          </>
        )}

        {/* Leaf decorations (stage >= 2) */}
        {stage.stage >= 2 && (
          <>
            <LeafDecoration
              cx={30 - stage.canopyR * 0.3}
              cy={48 - stage.trunkH - stage.canopyR * 0.6}
              delay={0}
            />
            <LeafDecoration
              cx={30 + stage.canopyR * 0.3}
              cy={48 - stage.trunkH - stage.canopyR * 0.5}
              delay={1.5}
            />
          </>
        )}

        {/* Flower / star at top (stage 4 = Full Bloom) */}
        {stage.stage === 4 && (
          <g>
            <text
              x={30}
              y={48 - stage.trunkH - stage.canopyR * 1.1}
              textAnchor="middle"
              fontSize={8}
              className="animate-pulse"
            >
              🌸
            </text>
          </g>
        )}

        {/* Falling coins for stage >= 2 */}
        {stage.stage >= 2 && (
          <>
            <FallingCoin delay={0} x={22} />
            {stage.stage >= 3 && <FallingCoin delay={1.2} x={38} />}
            {stage.stage >= 4 && <FallingCoin delay={2.4} x={30} />}
          </>
        )}
      </svg>

      {/* Stage label badge */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[9px] font-medium text-sage-600">
          {stage.label}
        </span>
      </div>
    </div>
  );
}
