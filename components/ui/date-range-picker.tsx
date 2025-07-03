'use client';

import { useState } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

type Props = {
  onChange: (range: RangeKeyDict) => void;
  initialRange?: {
    startDate: Date;
    endDate: Date;
  };
};

export function DateRangePicker({ onChange, initialRange }: Props) {
  const [state, setState] = useState([
    {
      startDate: initialRange?.startDate || new Date(),
      endDate: initialRange?.endDate || new Date(),
      key: 'selection',
    },
  ]);

  return (
    <div className="rounded border p-2 shadow">
      <DateRange
        editableDateInputs={true}
        onChange={(item) => {
          setState([item.selection]);
          onChange(item);
        }}
        moveRangeOnFirstSelection={false}
        ranges={state}
        className="text-sm"
      />
    </div>
  );
}
