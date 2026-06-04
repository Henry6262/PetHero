import { Waves, Coffee, Music, Mountain, HeartPulse, Clapperboard, type LucideProps } from 'lucide-react';
import type { IconKey } from '@/lib/mock';

const MAP: Record<IconKey, React.ComponentType<LucideProps>> = {
  waves: Waves,
  coffee: Coffee,
  music: Music,
  mountain: Mountain,
  'heart-pulse': HeartPulse,
  clapperboard: Clapperboard,
};

export default function CategoryIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Cmp = MAP[icon];
  return <Cmp {...props} />;
}
