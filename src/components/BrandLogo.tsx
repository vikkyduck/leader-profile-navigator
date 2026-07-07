import logoSrc from '@/assets/logo-bez-vody.png';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BrandLogo = ({ className = '', size = 'md' }: BrandLogoProps) => {
  const sizes = {
    sm: 'h-14',
    md: 'h-20',
    lg: 'h-28',
    xl: 'h-40',
  };

  return (
    <a
      href="https://withoutwater.ru"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center shrink-0 hover:opacity-90 transition-opacity duration-200 ${className}`}
      title="Без воды · withoutwater"
    >
      <img
        src={logoSrc}
        alt="Без воды — withoutwater"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </a>
  );
};

export default BrandLogo;
