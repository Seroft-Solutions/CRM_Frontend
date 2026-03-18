import Image from 'next/image';
import { cn } from '@/lib/utils';
import crmCupLogo from '../../../public/crm-cup-logo.png';

type CrmCupLogoVariant = 'seal' | 'mark';

interface CrmCupLogoProps {
  className?: string;
  variant?: CrmCupLogoVariant;
  title?: string;
}

export function CrmCupLogo({
  className,
  variant = 'seal',
  title = 'CRM Cup logo',
}: CrmCupLogoProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={cn(
        'relative block overflow-hidden',
        variant === 'mark' ? 'rounded-full' : '',
        className
      )}
    >
      <Image
        src={crmCupLogo}
        alt={title}
        fill
        sizes={variant === 'mark' ? '64px' : '256px'}
        className={cn('object-contain', variant === 'mark' ? 'scale-[1.08]' : '')}
        priority={variant === 'seal'}
      />
    </span>
  );
}
