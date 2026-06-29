import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';

interface DashboardEquityChartProps {
  currentEquity: number;
}

export const DashboardEquityChart: React.FC<DashboardEquityChartProps> = ({ currentEquity }) => {
  // Generate realistic looking mock data ending exactly at currentEquity
  const data = useMemo(() => {
    const dataPoints = [];
    let rollingValue = currentEquity * 0.75; // Start at 75% of current equity
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      if (i === 0) {
        rollingValue = currentEquity;
      } else {
        // Random daily fluctuation between -2% and +3.5%
        const change = 1 + (Math.random() * 0.055 - 0.02);
        rollingValue = rollingValue * change;
      }

      dataPoints.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Equity: Number(rollingValue.toFixed(2))
      });
    }
    return dataPoints;
  }, [currentEquity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121318] border border-orbit-border/50 p-3 rounded-lg shadow-xl">
          <p className="text-orbit-gray-text text-xs mb-1 font-sans">{label}</p>
          <p className="text-orbit-accent font-data font-bold">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full h-[240px] mt-6"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1C24" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="Equity" 
            stroke="#F7931A" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEquity)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
