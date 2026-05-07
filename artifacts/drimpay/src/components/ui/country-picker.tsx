import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, X } from "lucide-react";

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
  subtitle?: string;
};

interface CountryPickerProps {
  options: CountryOption[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: boolean;
}

export function CountryPicker({
  options,
  value,
  onChange,
  placeholder = "Sélectionner un pays",
  disabled,
  error,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.code === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full h-12 rounded-xl border bg-muted/30 px-4 text-sm flex items-center gap-3 text-left outline-none transition-all
          focus:border-primary focus:ring-2 focus:ring-primary/20
          hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-400" : "border-border"}
          ${selected ? "text-foreground" : "text-muted-foreground/60"}`}
      >
        {selected ? (
          <>
            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg shrink-0 overflow-hidden">
              {selected.flag}
            </span>
            <span className="flex-1 truncate font-medium">{selected.name}</span>
            {selected.subtitle && (
              <span className="text-xs text-muted-foreground shrink-0">{selected.subtitle}</span>
            )}
          </>
        ) : (
          <span>{placeholder}</span>
        )}
        <svg className="w-4 h-4 text-muted-foreground ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <CountryPickerModal
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        value={value}
        onChange={(code) => { onChange(code); setOpen(false); }}
      />
    </>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  options: CountryOption[];
  value: string;
  onChange: (code: string) => void;
}

export function CountryPickerModal({ open, onClose, options, value, onChange }: ModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = options.filter(
    (o) =>
      o.name.toLowerCase().includes(query.toLowerCase()) ||
      o.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-background rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-base font-bold text-foreground">Sélectionner un pays</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-72 px-2 pb-3">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Aucun pays trouvé</p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.code === value;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => onChange(option.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left mb-0.5
                        ${isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/40"
                        }`}
                    >
                      <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xl shrink-0 shadow-sm">
                        {option.flag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {option.name}
                        </p>
                        {option.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
