type NotificationBellProps = {
  unreadCount?: number;
};

export function NotificationBell({ unreadCount = 0 }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative flex items-center justify-center w-9 h-9">
      <div className={`
        flex items-center justify-center w-9 h-9 rounded-xl transition-all
        ${hasUnread
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Notifications"
        >
          <path
            d="M12 2C9.243 2 7 4.243 7 7v1.515C5.22 9.56 4 11.393 4 13.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.5c0-2.107-1.22-3.94-3-4.985V7c0-2.757-2.243-5-5-5Z"
            fill="currentColor"
            opacity={hasUnread ? "1" : "0.85"}
          />
          <path
            d="M12 2C9.243 2 7 4.243 7 7v1.515C5.22 9.56 4 11.393 4 13.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.5c0-2.107-1.22-3.94-3-4.985V7c0-2.757-2.243-5-5-5Z"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinejoin="round"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M10 19a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {hasUnread && (
            <path
              d="M19 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
              fill="#ef4444"
              stroke="white"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>

      {hasUnread && (
        <span className="
          absolute -top-1 -right-1
          min-w-[18px] h-[18px]
          bg-red-500 text-white
          text-[9px] font-bold
          rounded-full
          flex items-center justify-center
          px-1 leading-none
          shadow-md
          ring-2 ring-background
        ">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}
