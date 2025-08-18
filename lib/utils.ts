// lib/utils.ts

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.locale('fr');

type FormatEventOptions = {
  date: Date | null;
  heureInconnue: boolean;
  prix?: number | string | null | undefined;
};

export function formatEventDetails({
  date,
  heureInconnue,
  prix,
}: FormatEventOptions): {
  dateHeure: string;
  prixTexte: string;
} {
  if (!date) {
    return { dateHeure: 'Date inconnue', prixTexte: '' };
  }

  const dateStr = dayjs(date).format('D MMMM YYYY');
  const heureStr = heureInconnue ? 'Heure inconnue' : dayjs(date).format('HH:mm');
  const dateHeure = `${dateStr} | ${heureStr}`;

  let prixNum: number | null = null;

  if (typeof prix === 'string') {
    const trimmed = prix.trim();
    if (trimmed === '') {
      prixNum = null;
    } else {
      const parsed = parseFloat(trimmed);
      prixNum = isNaN(parsed) ? null : parsed;
    }
  } else if (typeof prix === 'number') {
    prixNum = prix;
  } else {
    prixNum = null;
  }

  // Ici, c'est gratuit si prixNum est null, NaN, 0 ou < 0
  const prixTexte =
    !prixNum || isNaN(prixNum) || prixNum <= 0
      ? 'Gratuit'
      : `${prixNum} MAD`;

  return { dateHeure, prixTexte };
}