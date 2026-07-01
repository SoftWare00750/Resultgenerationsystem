"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, PenLine } from "lucide-react";

interface SignatureUploadProps {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  hint?: string;
}

export function SignatureUpload({
  label = "Signature",
  value,
  onChange,
  hint = "Upload a clear image of your signature (PNG/JPG, max 2MB)",
}: SignatureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative border rounded-lg p-3 bg-muted/20 flex items-center gap-3">
          <img
            src={value}
            alt="Signature preview"
            className="h-14 max-w-[180px] object-contain border rounded bg-white"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">Signature uploaded</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs mt-1 h-7 px-2 text-destructive hover:text-destructive"
              onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            >
              <X className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-muted/20 transition-colors"
        >
          <PenLine className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">Upload Signature</span>
          <span className="text-xs text-muted-foreground">PNG, JPG up to 2MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}