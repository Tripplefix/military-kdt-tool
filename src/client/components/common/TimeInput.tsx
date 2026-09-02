"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { minutesToHHMM, parseHHMM } from "@/shared/time";

interface Props {
  value: number | null;
  onChange: (min: number | null) => void;
  allowEmpty?: boolean;
  className?: string;
  placeholder?: string;
  snap?: boolean;
}

/** Zeit-Eingabe im Format HHMM (auch 7:30 oder 730 erlaubt), Wert in Minuten. */
export function TimeInput({ value, onChange, allowEmpty = false, className, placeholder = "HHMM", snap = false }: Props) {
  const [text, setText] = useState(value == null ? "" : minutesToHHMM(value));
  const [invalid, setInvalid] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    // Wert von aussen geändert: Anzeige nachziehen (empfohlenes Muster statt useEffect)
    setPrevValue(value);
    setText(value == null ? "" : minutesToHHMM(value));
    setInvalid(false);
  }

  function commit() {
    if (text.trim() === "") {
      if (allowEmpty) {
        setInvalid(false);
        onChange(null);
      } else {
        setInvalid(true);
      }
      return;
    }
    const parsed = parseHHMM(text);
    if (parsed == null) {
      setInvalid(true);
      return;
    }
    const min = snap ? Math.round(parsed / 15) * 15 : parsed;
    setInvalid(false);
    setText(minutesToHHMM(min));
    onChange(min);
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
      inputMode="numeric"
      className={cn("w-20 font-mono", invalid && "border-destructive", className)}
      aria-invalid={invalid}
    />
  );
}
