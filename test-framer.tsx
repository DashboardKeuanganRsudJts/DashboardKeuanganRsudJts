import React, { useState } from 'react';

export function Test() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className={`transition-all duration-300 overflow-hidden relative ${isOpen ? 'w-72' : 'w-16'}`} style={{ height: 500, backgroundColor: 'blue' }}>
      <div className={`absolute top-0 left-0 w-72 h-full bg-red-500 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         Expanded Content (288px wide)
      </div>
      <div className={`absolute top-0 left-0 w-16 h-full bg-green-500 transition-opacity duration-300 ${!isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         Collapsed
      </div>
    </div>
  )
}
