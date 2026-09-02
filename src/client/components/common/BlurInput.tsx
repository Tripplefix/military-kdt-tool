"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

/** Textfeld, das erst beim Verlassen (oder Enter) speichert. */
export function BlurInput({ value, onCommit, className, placeholder, multiline, rows }: Props) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value);
  }
  const commit = () => {
    if (text !== value) onCommit(text);
  };
  if (multiline) {
    return (
      <Textarea
        value={text}
        rows={rows ?? 4}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        className={className}
      />
    );
  }
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
