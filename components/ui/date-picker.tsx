"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date", id }: DatePickerProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="pr-10"
        placeholder={placeholder}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}