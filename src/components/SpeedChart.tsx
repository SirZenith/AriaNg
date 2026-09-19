import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatPoint } from '@/services/monitor';
import { formatVolume } from '@/utils/format';

interface SpeedChartProps {
    data: StatPoint[];
    height?: number;
}

export default function SpeedChart({ data, height = 140 }: SpeedChartProps) {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis
                        width={64}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => formatVolume(Number(value), 'auto')}
                    />
                    <Tooltip
                        labelFormatter={(label) => new Date(Number(label)).toLocaleTimeString()}
                        formatter={(value) => formatVolume(Number(value)) + '/s'}
                    />
                    <Area
                        type="monotone"
                        dataKey="downloadSpeed"
                        name="Download"
                        stroke="#a3be8c"
                        fill="#a3be8c"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="uploadSpeed"
                        name="Upload"
                        stroke="#81a1c1"
                        fill="#81a1c1"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
