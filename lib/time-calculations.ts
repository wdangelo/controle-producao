// lib/time-calculations.ts
// Funções para cálculo de tempo de produção

interface Session {
  data_inicio: Date;
  data_inicio_almoco?: Date | null;
  data_fim_almoco?: Date | null;
  data_fim?: Date | null;
}

/**
 * Calcula o tempo total trabalhado em uma sessão (em segundos)
 * Considera pausas de almoço
 */
export function calculateSessionDuration(session: Session): number {
  const inicio = new Date(session.data_inicio).getTime();
  const fim = session.data_fim ? new Date(session.data_fim).getTime() : Date.now();
  
  let totalSeconds = Math.floor((fim - inicio) / 1000);
  
  // Subtrair tempo de almoço (pausa)
  if (session.data_inicio_almoco && session.data_fim_almoco) {
    const pausaInicio = new Date(session.data_inicio_almoco).getTime();
    const pausaFim = new Date(session.data_fim_almoco).getTime();
    const pausaSeconds = Math.floor((pausaFim - pausaInicio) / 1000);
    totalSeconds -= pausaSeconds;
  }
  
  return Math.max(0, totalSeconds);
}

/**
 * Calcula o tempo total de produção de um serviço
 * Soma todas as sessões dos operadores que trabalharam no serviço
 */
export function calculateTotalServiceTime(sessions: Session[]): number {
  return sessions.reduce((total, session) => {
    return total + calculateSessionDuration(session);
  }, 0);
}

/**
 * Calcula o tempo total incluindo preparo
 * Retorna objeto com tempo de preparo, produção e total
 */
export function calculateCompleteServiceTime(
  sessions: Session[],
  tempoPreparoSegundos?: number | null
): {
  tempoPreparo: number
  tempoProducao: number
  tempoTotal: number
} {
  const tempoProducao = calculateTotalServiceTime(sessions)
  const tempoPreparo = tempoPreparoSegundos || 0
  
  return {
    tempoPreparo,
    tempoProducao,
    tempoTotal: tempoPreparo + tempoProducao
  }
}

/**
 * Formata segundos para formato legível (HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formata segundos para formato resumido (ex: "2h 30min")
 */
export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
