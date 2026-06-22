// Role / team that carries an estimate per task (e.g. Backend, Frontend, QC).
export type Role = {
  id: string;
  key: string; // stable machine key used in Task.estimates, e.g. "backend"
  name: string; // display label
  color?: string;
  enabled: boolean;
};
