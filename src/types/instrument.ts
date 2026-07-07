import { CriterionWithTitle } from './leader';

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
  tableName: string;
  showLogo?: boolean;
  qualities: InstrumentQuality[];
}
