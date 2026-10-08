// Types for the Bonus Round SDK (npm: bonusround). https://bonusround.io/docs/
// import { BonusRound } from 'bonusround';  ·  or the script tag's global window.BonusRound

export type BreakTrigger = 'intermission' | 'test' | (string & {});

/**
 * break() resolves exactly once: after the round has fully ended ('end' already fired) with filled:true, or with
 * filled:false when no round plays for this call (no round starts later because of it). If 'start' fired for this call
 * (e.g. the countdown showed, then was cancelled), 'end' fires before break() resolves filled:false.
 */
export interface BreakResult {
  /** a round played (false: no ad, capped, not attached, busy, …; the game just continues) */
  filled: boolean;
  /** the player finished the round */
  completed: boolean;
  /** why nothing played: 'no_fill', 'ad_server_unreachable', 'frequency_cap', 'not_attached', 'countdown_game' (BonusRound.cancel()), 'countdown_hidden',
   *  'busy' (a round was already on screen: its 'end' resumes your game, so don't resume on 'busy'), 'portal', 'ssr', … */
  reason?: string;
  /** the round's id: the same id as its 'start' and 'end' events */
  id?: string;
  /** this call arrived while another break() was still preparing and shares that round's outcome */
  joined?: boolean;
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

/** 'start': before anything of the round is on screen (the countdown card included). Exactly once per round. */
export interface RoundStartEvent {
  id: string;
  format: 'takeover';
  trigger: string;
  brand: string | null;
  requestId: string | null;
  test: boolean;
  /** a live zone round (zone()): the game keeps running, don't pause for it */
  live?: boolean;
}
/** 'end': after the round is gone, exactly once per 'start', same id, before break() resolves */
export interface RoundEndEvent extends BreakResult {
  id: string;
  /** the game had the mouse locked before the round: 'restored' (re-locked from the Continue click) or 'was-locked'
   *  (free now: re-lock on the player's next click) */
  pointerLock?: 'restored' | 'was-locked';
}

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
  /** at a natural break: resolves once, after the round has fully ended, or with filled:false when nothing plays for this call */
  break(trigger?: BreakTrigger, options?: { countdownEndsAt?: number }): Promise<BreakResult>;
  zone(name: string, options?: { live?: boolean; countdownEndsAt?: number }): Promise<BreakResult & { zone?: string }>;
  rewarded(options: { onReward?: (r: BreakResult) => void; label?: string; button?: boolean | 'portal' }): Promise<BreakResult | { shown: boolean; hide(): void; start(): Promise<BreakResult> } | { registered: boolean }>;
  /** whether an interval round may interrupt now (null = auto) */
  safe(value?: boolean | null): BonusRoundSDK;
  placeAmbient(hint: { position: [number, number, number]; rotationY?: number } | null): BonusRoundSDK;
  on(type: 'start', cb: (e: RoundStartEvent) => void): BonusRoundSDK;
  on(type: 'end', cb: (e: RoundEndEvent) => void): BonusRoundSDK;
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
