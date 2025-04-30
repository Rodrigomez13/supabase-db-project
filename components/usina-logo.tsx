interface UsinaLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UsinaLogo({ size = "md", className = "" }: UsinaLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-usina-primary/20 border-2 border-usina-primary flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-2/3 w-2/3 text-usina-primary"
        >
          <path
            d="M13 18.9405C16.5318 18.4459 19.25 15.3904 19.25 11.75C19.25 7.74289 16.0071 4.5 12 4.5C7.99289 4.5 4.75 7.74289 4.75 11.75C4.75 15.3904 7.46819 18.4459 11 18.9405V21.25C11 21.6642 11.3358 22 11.75 22H12.25C12.6642 22 13 21.6642 13 21.25V18.9405Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15.75V8.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 10.75L12 8.25L15 10.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="ml-2 text-xl font-bold text-foreground">
        USINA LEADS
      </span>
    </div>
  );
}
