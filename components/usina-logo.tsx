import Image from "next/image";

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
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src="/usina-logo2.png"
          alt="Logo Usina"
          fill
          className="object-contain"
        />
      </div>
      <span
        className="ml-2 text-xl font-bold italic font-montserrat"
        style={{ color: "#148F77" }}
      >
        USINA LEADS
      </span>
    </div>
  );
}
