export enum ParticleTemplate {
  SPHERE = 'SPHERE',
  HEART = 'HEART',
  FLOWER = 'FLOWER',
  SATURN = 'SATURN',
  BUDDHA = 'BUDDHA',
  FIREWORKS = 'FIREWORKS',
}

export interface ParticleState {
  template: ParticleTemplate;
  color: string;
  tension: number; // 0.0 to 1.0
  isConnected: boolean;
  isStreaming: boolean;
}

export interface ControlPanelProps {
  currentTemplate: ParticleTemplate;
  setTemplate: (t: ParticleTemplate) => void;
  currentColor: string;
  setColor: (c: string) => void;
  isConnected: boolean;
  tension: number;
  toggleConnection: () => void;
}
