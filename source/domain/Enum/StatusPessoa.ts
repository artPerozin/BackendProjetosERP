/** RF-011. Só Ativo entra no sistema; Trainee é registrado, mas ainda sem acesso (decisão de 29/10/2026). */
enum StatusPessoa {
    ATIVO = "ativo",
    TRAINEE = "trainee",
    ALUMNI = "alumni",
    INATIVO = "inativo",
}

/** Quem pode fazer login. Para liberar trainees no futuro, basta incluir TRAINEE aqui. */
export const STATUS_COM_ACESSO: StatusPessoa[] = [StatusPessoa.ATIVO];
/** Quem está na EJ e pode ser colocado em projetos, mesmo sem acesso ao sistema. */
export const STATUS_NA_EJ: StatusPessoa[] = [StatusPessoa.ATIVO, StatusPessoa.TRAINEE];
export const STATUS_DE_SAIDA: StatusPessoa[] = [StatusPessoa.ALUMNI, StatusPessoa.INATIVO];

export default StatusPessoa;
