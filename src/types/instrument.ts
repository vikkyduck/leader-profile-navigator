import { CriterionWithTitle } from './leader';
import type { Instrument } from '@/lib/api';

export interface InstrumentQuality {
  id: string;
  label: string;
  description: string;
  criteria: CriterionWithTitle[];
}

export interface InstrumentConfig {
  id: string;
  title: string;
  subtitle: string;
  /** Идентификатор инструмента в собственном API (/api/responses) */
  instrument: Instrument;
  showLogo?: boolean;
  qualities: InstrumentQuality[];
}
