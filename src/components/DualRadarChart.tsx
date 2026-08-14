import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export interface RadarSeries {
  name: string;
  values: number[];
  /** CSS-цвет линии; по умолчанию — фирменный primary */
  color?: string;
}

interface DualRadarChartProps {
  labels: string[];
  seriesA: RadarSeries;
  seriesB: RadarSeries;
  title?: string;
}

/**
 * Паутинка с двумя линиями по одним и тем же осям. В отличие от
 * LeaderRadarChart, названия рядов задаются снаружи: здесь это не
 * «я и команда», а «важно мне» и «даёт компания».
 */
const DualRadarChart = ({ labels, seriesA, seriesB, title }: DualRadarChartProps) => {
  const colorA = seriesA.color ?? 'hsl(var(--primary))';
  const colorB = seriesB.color ?? 'hsl(var(--chart-2))';

  const data = labels.map((label, i) => ({
    subject: label,
    a: seriesA.values[i] ?? 0,
    b: seriesB.values[i] ?? 0,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      {title && (
        <h2 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
          {title}
        </h2>
      )}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {/* outerRadius меньше дефолтного: 15 русских подписей иначе режет краем SVG */}
          <RadarChart data={data} outerRadius="64%">
            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="2 4" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 500 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              tickCount={3}
              axisLine={false}
            />
            <Radar
              name={seriesA.name}
              dataKey="a"
              stroke={colorA}
              fill={colorA}
              fillOpacity={0.14}
              strokeWidth={2}
            />
            <Radar
              name={seriesB.name}
              dataKey="b"
              stroke={colorB}
              fill={colorB}
              fillOpacity={0.08}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DualRadarChart;
