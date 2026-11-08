import React from 'react';
import { TeamStats, MatchAnalysis } from '../types';

interface TeamRadarChartProps {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  analysis: MatchAnalysis;
}

export const TeamRadarChart: React.FC<TeamRadarChartProps> = ({
  homeTeam,
  awayTeam,
  analysis
}) => {
  // 6 Metric Axes (Normalized 0 - 100)
  const axes = [
    { label: 'Hücum Gücü', home: analysis.homeAttackScore, away: analysis.awayAttackScore },
    { label: 'Savunma Direnci', home: analysis.homeDefenseScore, away: analysis.awayDefenseScore },
    { label: 'İY Skor Etkisi', home: analysis.homeHtImpactScore, away: analysis.awayHtImpactScore },
    { label: 'Korner Temposu', home: Math.min(100, Math.round((homeTeam.avgCorners / 9) * 100)), away: Math.min(100, Math.round((awayTeam.avgCorners / 9) * 100)) },
    { label: 'Şut İsabeti', home: Math.min(100, Math.round((homeTeam.shotsOnTargetAvg / 9) * 100)), away: Math.min(100, Math.round((awayTeam.shotsOnTargetAvg / 9) * 100)) },
    { label: 'Gole Kapatma', home: Math.round(homeTeam.cleanSheetRate * 100), away: Math.round(awayTeam.cleanSheetRate * 100) },
  ];

  const size = 260;
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Convert (value, axisIndex) to (x, y) coordinates
  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build SVG polygon points
  const homePoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(axis.home, i);
    return `${x},${y}`;
  }).join(' ');

  const awayPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(axis.away, i);
    return `${x},${y}`;
  }).join(' ');

  // Grid concentric circles / hexagons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Concentric Hexagons */}
          {gridLevels.map((lvl, idx) => {
            const pts = Array.from({ length: numAxes }).map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = radius * lvl;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ');

            return (
              <polygon
                key={idx}
                points={pts}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray={lvl === 1 ? 'none' : '3,3'}
              />
            );
          })}

          {/* Axis Spokes */}
          {axes.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Away Team Polygon (Purple glow) */}
          <polygon
            points={awayPoints}
            fill="rgba(168, 85, 247, 0.25)"
            stroke="#a855f7"
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Home Team Polygon (Emerald glow) */}
          <polygon
            points={homePoints}
            fill="rgba(16, 185, 129, 0.3)"
            stroke="#10b981"
            strokeWidth="2.2"
            className="transition-all duration-300"
          />

          {/* Home Team Data Points */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(axis.home, i);
            return (
              <circle
                key={`home-${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill="#10b981"
                stroke="#030712"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Away Team Data Points */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(axis.away, i);
            return (
              <circle
                key={`away-${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill="#a855f7"
                stroke="#030712"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Axis Labels */}
          {axes.map((axis, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 22;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-400 text-[10px] font-semibold tracking-tight"
              >
                {axis.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend below Radar Chart */}
      <div className="flex items-center space-x-6 mt-3 text-xs font-bold">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30"></span>
          <span className="text-emerald-300">{homeTeam.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-purple-400 ring-2 ring-purple-500/30"></span>
          <span className="text-purple-300">{awayTeam.name}</span>
        </div>
      </div>
    </div>
  );
};

