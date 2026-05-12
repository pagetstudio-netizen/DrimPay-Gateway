import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, X, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

interface PopupSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function PopupSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner",
  title,
  disabled,
  error,
  className,
}: PopupSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={[
          "w-full h-10 rounded-xl border bg-muted/30 px-4 text-sm flex items-center gap-2 text-left outline-none transition-all",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-400" : "border-border",
          selected ? "text-foreground" : "text-muted-foreground/60",
          className ?? "",
        ].join(" ")}
      >
        {selected ? (
          <>
            {selected.icon && (
              <span className="shrink-0 flex items-center">{selected.icon}</span>
            )}
            <span className="flex-1 truncate font-medium">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
      </button>

      <PopupSelectModal
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        value={value}
        onChange={(val) => { onChange(val); setOpen(false); }}
        title={title ?? placeholder}
      />
    </>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  title?: string;
}

export function PopupSelectModal({
  open, onClose, options, value, onChange,
  title = "Sélectionner",
}: ModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
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
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {options.length > 5 && (
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Rechercher..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-72 px-2 pb-3">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Aucun résultat</p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange(option.value)}
                      className={[
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left mb-0.5",
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/40",
                      ].join(" ")}
                    >
                      {option.icon && (
                        <span className="shrink-0 flex items-center">{option.icon}</span>
                      )}
                      <span className={`text-sm font-medium flex-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {option.label}
                      </span>
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
