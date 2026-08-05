import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Sem data';
  try {
    const utcDate = parseISO(dateString);
    if (isNaN(utcDate.getTime())) {
      throw new Error('Data inválida');
    }
    const zonedDate = toZonedTime(utcDate, 'America/Sao_Paulo');
    // Ajustar para o próximo dia se a hora for antes das 3 AM UTC (meia-noite em São Paulo)
    if (utcDate.getUTCHours() < 3) {
      zonedDate.setDate(zonedDate.getDate() + 1);
    }
    const formatted = format(zonedDate, 'dd/MM/yyyy');
    return formatted;
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'DateString:', dateString);
    return 'Data inválida';
  }
};
