export interface HomeLayoutBlock {
  id: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  isVisible: boolean;
}
