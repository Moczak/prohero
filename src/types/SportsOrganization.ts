// Unified SportsOrganization type for use across the project
export interface SportsOrganization {
  id: string;
  name: string;
  organization_type: string;
  modalidade_id: string | null;
  subcategoria_id: string | null;
  city: string;
  state: string;
  country: string;
  description: string;
  logo_url: string | null;
  capa_url: string | null;
  created_at: string;
  esporte_id: string | null;
}
