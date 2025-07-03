import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ActivityData {
  date: string;
  payroll: number;
  attendance: number;
  overtime: number;
  tips: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

const COLORS = {
  payroll: 'red',    // blue
  attendance: 'grey', // green
  overtime: 'black',   // yellow
  tips: '#f53d8a'        // red
};

export function ActivityChart({ data }: ActivityChartProps) {
  return (
 
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%" className="text-xs">
            <BarChart
              data={data}
              barCategoryGap={10}
              margin={{
                top: 10,
                right: 0,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3"  />
              <XAxis dataKey="date" fontSize={10}/>
              <YAxis fontSize={10}/>
              <Tooltip contentStyle={{ backgroundColor: 'white', color: 'black' }} />
              <Legend />
             
              <Bar
                dataKey="payroll"
                name="Payroll Activities"
                fill={COLORS.payroll}
                stackId="a"
                
              />
              <Bar
                dataKey="attendance"
                name="Attendance Records"
                fill={COLORS.attendance}
                stackId="a"
                
              />
              <Bar
                dataKey="overtime"
                name="Overtime Entries"
                fill={COLORS.overtime}
                stackId="a"
                
              />
              <Bar
                dataKey="tips"
                name="Tips Records"
                fill={COLORS.tips}
                stackId="a"
                
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
    
  );
} 