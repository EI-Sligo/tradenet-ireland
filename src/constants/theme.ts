// src/constants/theme.ts

export const COLORS = {
  background: '#0F172A',      // Deep Industrial Slate
  surface: '#1E293B',         // Elevated Dark Charcoal Card
  border: '#334155',          // Muted Steel Divider
  textPrimary: '#F8FAFC',     // Crisp White
  textSecondary: '#94A3B8',   // Cool Grey
  primaryBlue: '#2563EB',     // Electric Blue
  safetyAmber: '#F59E0B',     // High-Vis Safety Amber
  emeraldGreen: '#10B981',    // Active / Site-Ready
  crimsonRed: '#EF4444',      // Expired Ticket / Stolen Alert
};

export type UserRole = 'apprentice' | 'employer' | 'qualified_pro';
export type TradeType = 'electrical' | 'instrumentation' | 'plumbing' | 'carpentry' | 'heavy_vehicle' | 'refrigeration' | 'oem';
export type PhaseLevel = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5' | 'phase_6' | 'phase_7' | 'qualified';

export const TRADES: { label: string; value: TradeType }[] = [
  { label: 'Electrical', value: 'electrical' },
  { label: 'Electrical Instrumentation', value: 'instrumentation' },
  { label: 'Plumbing', value: 'plumbing' },
  { label: 'Carpentry & Joinery', value: 'carpentry' },
  { label: 'Heavy Vehicle Mechanics', value: 'heavy_vehicle' },
  { label: 'Refrigeration & Air Conditioning', value: 'refrigeration' },
  { label: 'Original Equipment Manufacturing (OEM)', value: 'oem' },
];

export const PHASES: { label: string; value: PhaseLevel }[] = [
  { label: 'Phase 1 (On-the-Job)', value: 'phase_1' },
  { label: 'Phase 2 (ETB / Training Centre)', value: 'phase_2' },
  { label: 'Phase 3 (On-the-Job)', value: 'phase_3' },
  { label: 'Phase 4 (Technological University)', value: 'phase_4' },
  { label: 'Phase 5 (On-the-Job)', value: 'phase_5' },
  { label: 'Phase 6 (Technological University)', value: 'phase_6' },
  { label: 'Phase 7 (On-the-Job)', value: 'phase_7' },
  { label: 'Fully Qualified Journeyman', value: 'qualified' },
];

export const IRISH_COUNTIES = [
  'Sligo', 'Leitrim', 'Mayo', 'Roscommon', 'Donegal', 'Galway',
  'Cavan', 'Monaghan', 'Louth', 'Meath', 'Westmeath', 'Longford',
  'Offaly', 'Laois', 'Kildare', 'Dublin', 'Wicklow', 'Wexford',
  'Carlow', 'Kilkenny', 'Tipperary', 'Waterford', 'Cork', 'Kerry',
  'Limerick', 'Clare', 'Antrim', 'Armagh', 'Down', 'Fermanagh',
  'Londonderry', 'Tyrone'
];

export const TRAINING_INSTITUTIONS = [
  'ATU Sligo',
  'MSLETB (Sligo / Ballina)',
  'ATU Galway / Letterkenny',
  'TUS Athlone / Limerick',
  'MTU Cork / Kerry',
  'TU Dublin',
  'SETU Waterford / Carlow',
  'DkIT Dundalk',
  'Other SOLAS / ETB Centre',
];

/** Evaluates ticket expiry dates to return the correct badge color */
export function getTicketStatus(expiryDateStr?: string | null) {
  if (!expiryDateStr) return { status: 'missing', label: 'Not Logged', color: COLORS.textSecondary };
  const diffDays = Math.ceil((new Date(expiryDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: 'expired', label: `EXPIRED (${expiryDateStr})`, color: COLORS.crimsonRed };
  if (diffDays <= 30) return { status: 'expiring_soon', label: `Expiring in ${diffDays}d`, color: COLORS.safetyAmber };
  return { status: 'valid', label: `Valid (${expiryDateStr})`, color: COLORS.emeraldGreen };
}