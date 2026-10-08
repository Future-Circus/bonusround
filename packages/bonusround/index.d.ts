// Types for the Bonus Round SDK (npm: bonusround). https://bonusround.io/docs/
// import { BonusRound } from 'bonusround';  ·  or the script tag's global window.BonusRound

export type BreakTrigger = 'intermission' | 'test' | (string & {});

export interface BreakResult {
  /** a round played (false: no ad, capped, not attached, …; the game just continues) */
  filled: boolean;
  /** the player finished the round */
  completed: boolean;
  /** why nothing played: 'no_fill', 'ad_server_unreachable', 'frequency_cap', 'not_attached', 'portal', 'ssr', … */
  reason?: string;
  score?: number;
  trigger?: string;
  brand?: string | null;
  requestId?: string | null;
  [key: string]: unknown;
}

export interface Bounds {
  center: { x: number; y: number; z: number };
  radius: number;
  obstacles?: unknown[];
}

/** Native takeover: the round runs in the game's own world with its own controls. All four are needed. */
export interface HostAdapter {
  getPlayerPosition(): { x: number; y: number; z: number };
  teleport(position: { x: number; y: number; z: number }): void;
  setBounds(bounds: Bounds | null): void;
  onFrame(cb: (dt: number) => void): void;
  getPlayerId?(): string;
  [key: string]: unknown;
}

export interface AttachOptions {
  /** the game's three.js namespace: import * as THREE from 'three' */
  THREE?: any;
  scene?: any;
  camera?: any;
  /** the WebGLRenderer (R3F: useThree().gl) */
  renderer?: any;
  /** the Group holding the level; hidden during a native round */
  worldRoot?: any;
  host?: HostAdapter;
  hudDock?: 'top' | 'top-right';
  world?: { cameraMode?: 'third-person' | 'first-person'; playerHeightM?: number; walkSpeedMps?: number; jumpVelocity?: number; gravity?: number };
}

export interface InitOptions {
  /** your public publisher id, pub_ + 16 hex (https://bonusround.io/app/games/). Without one only the test round plays. */
  pub?: string;
  /** ask for the house test round (Fizzpop Soda) at every break, never billed */
  test?: boolean;
  muted?: boolean;
  /** where the SDK runtime and ad server live (default https://bonusround.io) */
  server?: string;
  /** the ad edge, if different from server */
  api?: string;
  /** seconds of "Ad · Bonus Round in N" before a takeover; 0 = off */
  countdownSec?: number;
  storage?: boolean;
  inworld?: boolean;
  brandworld?: boolean;
}

export type BonusRoundEvent = 'attach' | 'start' | 'end' | 'reward' | 'ambient' | 'event' | 'countdown';

export interface BonusRoundSDK {
  readonly version: string;
  readonly pub: string | null;
  readonly base: string;
  readonly api: string;
  /** set the publisher id (and options) before attach(). The script tag's data-pub does the same. */
  init(options: InitOptions): BonusRoundSDK;
  config(options: Omit<InitOptions, 'pub' | 'server' | 'api'>): BonusRoundSDK;
  /** once, after the renderer, scene and camera exist */
  attach(options: AttachOptions): Promise<{ mode: 'overlay' | 'native-local' | 'native-net' | 'off'; already?: boolean; [k: string]: unknown }>;
  /** at a natural break: resolves when the round ends, or right away when nothing plays */
  break(trigger?: BreakTrigger, options?: { countdownEndsAt?: number }): Promise<BreakResult>;
  zone(name: string, options?: { live?: boolean; countdownEndsAt?: number }): Promise<BreakResult & { zone?: string }>;
  rewarded(options: { onReward?: (r: BreakResult) => void; label?: string; button?: boolean | 'portal' }): Promise<BreakResult | { shown: boolean; hide(): void; start(): Promise<BreakResult> } | { registered: boolean }>;
  /** whether an interval round may interrupt now (null = auto) */
  safe(value?: boolean | null): BonusRoundSDK;
  placeAmbient(hint: { position: [number, number, number]; rotationY?: number } | null): BonusRoundSDK;
  on(type: BonusRoundEvent, cb: (data: any) => void): BonusRoundSDK;
  off(type: BonusRoundEvent, cb: (data: any) => void): BonusRoundSDK;
  cancel(): boolean;
  consent(granted: boolean): BonusRoundSDK;
  debug(): Promise<{ version: string; pub: string | null; mode: string | null; attached: boolean; requests: unknown[]; warnings: unknown[]; [k: string]: unknown }>;
  ready(): Promise<BonusRoundSDK>;
}

export declare const BonusRound: BonusRoundSDK;
export default BonusRound;

declare global {
  interface Window {
    BonusRound?: BonusRoundSDK;
    /** command queue: (window.bonusround = window.bonusround || []).push((BR) => BR.attach({ … })) */
    bonusround?: { push(...cmds: Array<((br: BonusRoundSDK) => void) | [string, ...unknown[]]>): number } | Array<unknown>;
    bonusroundConfig?: InitOptions & { base?: string };
  }
}
