export interface NavItem {
  to?: string;
  text: string;
  chatMessage?: string;
  icon?: string;
  items?: {
    icon?: {
      dark: string;
      light: string;
    };
    text: string;
    description?: string;
    to: string;
    chatStyle?: boolean;
    featured?: boolean;
  }[];
}
