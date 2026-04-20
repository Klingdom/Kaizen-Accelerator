/**
 * MVP event catalog (E1-T3).
 *
 * Every constant below is a VERBATIM string matching ARCHITECTURE.md §6.1.
 * Services emit and subscribe by string name — no symbol types — so that the
 * event log (bamx:v1:events-log) and future Postgres trigger tables carry
 * stable, human-readable event names.
 *
 * Do not rename these constants. If a new event is added in a later sprint,
 * append it below AND add it to §6.1 in the same PR.
 */

// --- Composition lifecycle (ARCHITECTURE §6.1) ------------------------------
export const CycleProposed = 'CycleProposed';
export const CycleAccepted = 'CycleAccepted';
export const CycleEdited = 'CycleEdited';
export const CycleRejected = 'CycleRejected';
export const CompositionStarted = 'CompositionStarted';
export const CompositionClosed = 'CompositionClosed';

// --- ScheduledActivity lifecycle --------------------------------------------
export const ActivityStarted = 'ActivityStarted';
export const ActivityStartedLate = 'ActivityStartedLate';
export const ActivityCompleted = 'ActivityCompleted';

// --- Reflection + Friction + Kaizen -----------------------------------------
export const ReflectionStubbed = 'ReflectionStubbed';
export const ReflectionCaptured = 'ReflectionCaptured';
export const VarianceLogged = 'VarianceLogged';
export const FrictionSignalCaptured = 'FrictionSignalCaptured';
export const WeeklyReflectionCompleted = 'WeeklyReflectionCompleted';
export const KaizenPromoted = 'KaizenPromoted';
export const KaizenBaselineLocked = 'KaizenBaselineLocked';
export const KaizenRemeasured = 'KaizenRemeasured';
export const KaizenClosed = 'KaizenClosed';

// --- PDCA experiments --------------------------------------------------------
export const PdcaExperimentOpened = 'PdcaExperimentOpened';
export const PdcaTickCommitted = 'PdcaTickCommitted';
export const PdcaExperimentClosed = 'PdcaExperimentClosed';

// --- Composer -----------------------------------------------------------------
export const ComposerInfeasible = 'ComposerInfeasible';

// --- Accelerator project type (30-Day Kaizen) --------------------------------
export const ProjectPhaseAdvanced = 'ProjectPhaseAdvanced';
export const AcceleratorPaceWarning = 'AcceleratorPaceWarning';

/**
 * Full list of MVP event names in the §6.1 declaration order. Exported so
 * tests + introspection surfaces can enumerate.
 */
export const EVENT_NAMES = Object.freeze([
  CycleProposed,
  CycleAccepted,
  CycleEdited,
  CycleRejected,
  CompositionStarted,
  CompositionClosed,
  ActivityStarted,
  ActivityStartedLate,
  ActivityCompleted,
  ReflectionStubbed,
  ReflectionCaptured,
  VarianceLogged,
  FrictionSignalCaptured,
  WeeklyReflectionCompleted,
  KaizenPromoted,
  KaizenBaselineLocked,
  KaizenRemeasured,
  KaizenClosed,
  PdcaExperimentOpened,
  PdcaTickCommitted,
  PdcaExperimentClosed,
  ComposerInfeasible,
  ProjectPhaseAdvanced,
  AcceleratorPaceWarning
]);

/**
 * Convenience default export — namespaced bundle.
 */
export default Object.freeze({
  CycleProposed,
  CycleAccepted,
  CycleEdited,
  CycleRejected,
  CompositionStarted,
  CompositionClosed,
  ActivityStarted,
  ActivityStartedLate,
  ActivityCompleted,
  ReflectionStubbed,
  ReflectionCaptured,
  VarianceLogged,
  FrictionSignalCaptured,
  WeeklyReflectionCompleted,
  KaizenPromoted,
  KaizenBaselineLocked,
  KaizenRemeasured,
  KaizenClosed,
  PdcaExperimentOpened,
  PdcaTickCommitted,
  PdcaExperimentClosed,
  ComposerInfeasible,
  ProjectPhaseAdvanced,
  AcceleratorPaceWarning,
  EVENT_NAMES
});
