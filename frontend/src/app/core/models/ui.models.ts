export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string | number | null;
  exact?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
