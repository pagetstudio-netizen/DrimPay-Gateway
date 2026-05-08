import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3500}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant as any} {...props}>
          {/* Icon dot */}
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variant === "destructive" ? "bg-red-300" : "bg-[#B5F03C]"}`} />

          {/* Text — title + optional description inline */}
          <span className="text-sm font-semibold whitespace-nowrap">
            {title}
            {description && (
              <span className="font-normal opacity-60 ml-1.5">{description}</span>
            )}
          </span>

          {action}
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
