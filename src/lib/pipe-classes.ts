/**
 * Piping class data model from PP-SPE-0002 Rev-2
 *
 * Each pipe class has its own color for 3D visualization.
 */

import { PIPE_CLASSES, type PipeClassKey } from './equipment-register';

/** Color mapping for pipe classes in 3D visualization */
export const PIPE_CLASS_COLORS: Record<PipeClassKey, string> = {
  COFA: '#d2703ff',   // Crude Oil / Process - red
  COFB: '#e0a94a',    // Low Pressure Steam - amber
  CPFA: '#d2703f',    // High Pressure - red (darker)
  ROFA: '#8b7fd4',    // RO/Demineralized Water - purple
  NOAA: '#2ccbb8',    // Stainless Steel - teal
  BOAA: '#6fe0d1',    // Monel - light teal
  NOAB: '#2ccbb8',    // SS Tubing - teal
  CRFC: '#d2703f',    // High Pressure Steam - red
};

/** Pipe class legend for UI */
export const PIPE_CLASS_LEGEND = Object.entries(PIPE_CLASSES).map(([key, cls]) => ({
  key: key as PipeClassKey,
  label: cls.description,
  code: cls.code,
  classRating: cls.classRating,
  material: cls.material,
  color: PIPE_CLASS_COLORS[key as PipeClassKey],
  pipeSizes: cls.pipeSizes,
  schedule: cls.schedule,
  connectionType: cls.connectionType,
}));

/** Pipe schedule colors for visual thickness indication */
export const PIPE_SCHEDULE_COLORS: Record<string, string> = {
  'XS': '#d2703f',
  'STD': '#e0a94a',
  '20': '#7f9aa6',
  '40': '#7f9aa6',
  '60': '#d2703f',
  '160': '#d2703f',
  'XXS': '#d2703f',
  'Tubing': '#2ccbb8',
};
