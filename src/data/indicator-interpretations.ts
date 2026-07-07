import { Quality } from '@/types/leader';

export interface AxisPair {
  axis1: string;
  axis2: string;
  axis1Label: string;
  axis2Label: string;
  synergy: string;
  risk: string;
}

export interface BusinessProfile {
  id: string;
  title: string;
  emoji: string;
  description: string;
  condition: (scores: Record<string, number>) => boolean;
}

export const axisPairs: AxisPair[] = [
  {
    axis1: 'platform_economy',
    axis2: 'experience_economy',
    axis1Label: 'Платформы',
    axis2Label: 'Впечатления',
    synergy: 'Масштабируемый опыт — вы можете доставлять впечатления тысячам клиентов одновременно через цифровые каналы.',
    risk: 'Впечатления без платформ — это ручной бутик, который не масштабируется. Платформы без впечатлений — это холодная автоматизация.',
  },
  {
    axis1: 'experience_economy',
    axis2: 'creative_economy',
    axis1Label: 'Впечатления',
    axis2Label: 'Креатив',
    synergy: 'Креативные впечатления — вы создаёте уникальные переживания, которые невозможно скопировать.',
    risk: 'Впечатления без креатива быстро становятся шаблонными. Креатив без впечатлений остаётся в голове дизайнера.',
  },
  {
    axis1: 'cognitive_engineering',
    axis2: 'meaningful_legacy',
    axis1Label: 'ИИ',
    axis2Label: 'Наследие',
    synergy: 'Осмысленная автоматизация — ИИ усиливает ваши ценности и помогает масштабировать культуру.',
    risk: 'ИИ без ценностей — автоматизация пустоты. Ценности без технологий — красивые слова без масштаба.',
  },
  {
    axis1: 'platform_economy',
    axis2: 'cognitive_engineering',
    axis1Label: 'Платформы',
    axis2Label: 'ИИ',
    synergy: 'Интеллектуальная платформа — данные питают ИИ, ИИ оптимизирует платформу. Замкнутый цикл роста.',
    risk: 'Платформа без ИИ — это вчерашний день. ИИ без данных платформы — игрушка без практической ценности.',
  },
  {
    axis1: 'creative_economy',
    axis2: 'meaningful_legacy',
    axis1Label: 'Креатив',
    axis2Label: 'Наследие',
    synergy: 'Бренд с миссией — ваш креатив подкреплён глубокими ценностями, которые резонируют с аудиторией.',
    risk: 'Креатив без ценностей — красивая обёртка без содержания. Ценности без креатива не находят выражения.',
  },
];

export const businessProfiles: BusinessProfile[] = [
  {
    id: 'digital-leader',
    title: 'Цифровой лидер',
    emoji: '🚀',
    description: 'Ваш бизнес силён в технологиях и автоматизации. Следующий шаг — наполнить платформу эмоциями и смыслами, чтобы технология работала на впечатления, а не просто на эффективность.',
    condition: (s) => s.platform_economy >= 7 && s.cognitive_engineering >= 7,
  },
  {
    id: 'experience-master',
    title: 'Мастер впечатлений',
    emoji: '🎭',
    description: 'Вы умеете создавать эмоции. Но без платформенной базы и ИИ ваш бизнес трудно масштабировать. Автоматизируйте доставку впечатлений — и вы вырастете кратно.',
    condition: (s) => s.experience_economy >= 7 && s.creative_economy >= 7,
  },
  {
    id: 'purpose-driven',
    title: 'Бизнес со смыслом',
    emoji: '🧭',
    description: 'У вас сильные ценности и культура. Это фундамент. Теперь нужно упаковать эти смыслы в креативный продукт и доставить через технологии.',
    condition: (s) => s.meaningful_legacy >= 7,
  },
  {
    id: 'ai-innovator',
    title: 'ИИ-инноватор',
    emoji: '🤖',
    description: 'Вы активно используете ИИ — это ваше конкурентное преимущество. Убедитесь, что технологии служат вашим ценностям и создают впечатления, а не просто оптимизируют процессы.',
    condition: (s) => s.cognitive_engineering >= 7,
  },
  {
    id: 'creative-brand',
    title: 'Креативный бренд',
    emoji: '🎨',
    description: 'Ваш продукт строится на смыслах и дизайне. Усильте это платформенными технологиями и ИИ — и вы создадите бренд, который невозможно скопировать.',
    condition: (s) => s.creative_economy >= 7,
  },
  {
    id: 'balanced',
    title: 'Сбалансированный бизнес',
    emoji: '⚖️',
    description: 'У вас ровный профиль без ярких пиков. Это может быть и силой, и слабостью. Выберите одну ось для прорыва — именно асимметрия создаёт уникальность.',
    condition: (s) => {
      const values = Object.values(s);
      const max = Math.max(...values);
      const min = Math.min(...values);
      return max - min <= 3;
    },
  },
  {
    id: 'starting',
    title: 'На старте трансформации',
    emoji: '🌱',
    description: 'Ваш бизнес пока работает в традиционной модели. Это не плохо — это точка отсчёта. Начните с платформенной экономики: оцифруйте данные и процессы. Это фундамент для всего остального.',
    condition: (s) => {
      const values = Object.values(s);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return avg < 4;
    },
  },
];

export interface Imbalance {
  pair: AxisPair;
  type: 'synergy' | 'risk';
  gap: number;
  strongAxis: string;
  weakAxis: string;
}

export function analyzeImbalances(scores: Record<string, number>): Imbalance[] {
  const results: Imbalance[] = [];

  for (const pair of axisPairs) {
    const score1 = scores[pair.axis1] || 0;
    const score2 = scores[pair.axis2] || 0;
    const gap = Math.abs(score1 - score2);

    if (gap >= 4) {
      results.push({
        pair,
        type: 'risk',
        gap,
        strongAxis: score1 > score2 ? pair.axis1Label : pair.axis2Label,
        weakAxis: score1 > score2 ? pair.axis2Label : pair.axis1Label,
      });
    } else if (score1 >= 6 && score2 >= 6) {
      results.push({
        pair,
        type: 'synergy',
        gap,
        strongAxis: pair.axis1Label,
        weakAxis: pair.axis2Label,
      });
    }
  }

  return results.sort((a, b) => b.gap - a.gap);
}

export function detectProfile(scores: Record<string, number>): BusinessProfile {
  for (const profile of businessProfiles) {
    if (profile.condition(scores)) {
      return profile;
    }
  }
  return businessProfiles[businessProfiles.length - 1]; // fallback
}

export function getNextStep(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort(([, a], [, b]) => a - b);
  const weakest = entries[0];
  const strongest = entries[entries.length - 1];

  const axisNames: Record<string, string> = {
    platform_economy: 'Платформенную экономику',
    experience_economy: 'Экономику впечатлений',
    creative_economy: 'Креативную экономику',
    cognitive_engineering: 'Когнитивный инжиниринг',
    meaningful_legacy: 'Смысловое наследие',
  };

  const axisNamesNom: Record<string, string> = {
    platform_economy: 'Платформенная экономика',
    experience_economy: 'Экономика впечатлений',
    creative_economy: 'Креативная экономика',
    cognitive_engineering: 'Когнитивный инжиниринг',
    meaningful_legacy: 'Смысловое наследие',
  };

  if (strongest[1] - weakest[1] >= 5) {
    return `Ваша сильная сторона — ${axisNamesNom[strongest[0]]} (${strongest[1]}/10). Но ${axisNames[weakest[0]]} (${weakest[1]}/10) создаёт узкое место. Сфокусируйтесь на ней — это даст наибольший эффект роста.`;
  }

  if (weakest[1] <= 3) {
    return `Начните с ${axisNames[weakest[0]].toLowerCase()} — сейчас это ${weakest[1]}/10. Даже небольшой рост здесь значительно изменит ваш профиль и откроет новые связки с другими осями.`;
  }

  return `У вас сбалансированный профиль. Выберите одну ось для прорывного роста — рекомендуем ${axisNames[weakest[0]].toLowerCase()} (${weakest[1]}/10), чтобы создать асимметричное преимущество.`;
}
