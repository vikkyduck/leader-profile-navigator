import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Quality } from '@/types/leader';

interface LeaderRadarChartProps {
  qualities: Quality[];
  title: string;
  teamAverage?: number[];
  showTeamData?: boolean;
}

const LeaderRadarChart = ({ qualities, title, teamAverage, showTeamData = false }: LeaderRadarChartProps) => {
  // «Есть данные» = свои ответы ИЛИ командное среднее: в командном режиме
  // без своих ответов плейсхолдер не должен перекрывать радар команды
  const hasData =
    qualities.some(q => q.score > 0) ||
    (showTeamData && (teamAverage?.some(v => v > 0) ?? false));
  const data = qualities.map((quality, index) => ({
    subject: quality.label.replace('Ваш ', '').replace('Ваша ', ''),
    value: quality.score,
    teamAverage: teamAverage ? teamAverage[index] : 0,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">{title}</h2>
        {hasData && (
          <span className="text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
      </div>
      <div className="flex-1 relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center px-6">
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center mx-auto mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="8.5" x2="22" y2="8.5" />
                </svg>
              </div>
              <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
                Отмечайте критерии —<br/>радар обновится
              </p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          {/* outerRadius меньше дефолтных 80%: иначе длинные русские подписи
              («устойчивость», «уникальность») обрезаются краем SVG */}
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid 
              stroke="hsl(var(--border))" 
              strokeDasharray="2 4"
              strokeOpacity={0.6}
            />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
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
              name="Мой профиль" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={hasData ? 0.15 : 0.02}
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
            />
            {showTeamData && teamAverage && (
              <Radar 
                name="Среднее по команде" 
                dataKey="teamAverage" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.08}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}
            {showTeamData && <Legend />}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeaderRadarChart;
