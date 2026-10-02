import Image from "next/image";

interface XoraLogoProps {
  size?: number;
  className?: string;
}

export function XoraLogo({ size = 32, className = "" }: XoraLogoProps) {
  return (
    <Image
      src="/icons/xora-icon.png"
      alt="Xora"
      width={size}
      height={size}
      className={className}
    />
  );
}
