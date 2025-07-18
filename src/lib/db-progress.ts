/**
 * Database Progress Tracking System
 * 
 * Provides progress indicators for long-running database initialization tasks,
 * including progress tracking, estimated time remaining, and both console
 * and programmatic progress access.
 */

import { LogContext, DatabaseLogger, getDatabaseLogger } from './db-logging';

// Progress status types
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

// Progress step interface
export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: ProgressStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress?: number; // 0-100 percentage
  estimatedDuration?: number; // milliseconds
  error?: Error;
  metadata?: Record<string, any>;
}

// Progress tracker configuration
export interface ProgressConfig {
  enableConsoleOutput: boolean;
  enableDetailedLogging: boolean;
  updateInterval: number; // milliseconds
  estimateBasedOnHistory: boolean;
  persistProgress: boolean;
  showPercentage: boolean;
  showTimeRemaining: boolean;
  showElapsedTime: boolean;
}

// Progress update callback type
export type ProgressCallback = (tracker: ProgressTracker) => void;

// Progress event types
export enum ProgressEvent {
  STARTED = 'started',
  STEP_STARTED = 'step_started',
  STEP_PROGRESS = 'step_progress',
  STEP_COMPLETED = 'step_completed',
  STEP_FAILED = 'step_failed',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Progress event data
export interface ProgressEventData {
  event: ProgressEvent;
  tracker: ProgressTracker;
  step?: ProgressStep;
  timestamp: Date;
}

// Default progress configuration
const DEFAULT_PROGRESS_CONFIG: ProgressConfig = {
  enableConsoleOutput: true,
  enableDetailedLogging: true,
  updateInterval: 1000,
  estimateBasedOnHistory: true,
  persistProgress: false,
  showPercentage: true,
  showTimeRemaining: true,
  showElapsedTime: true,
};

/**
 * Progress Tracker Class
 * 
 * Tracks progress of database initialization tasks with detailed
 * progress reporting, time estimation, and event callbacks.
 */
export class ProgressTracker {
  private steps: Map<string, ProgressStep> = new Map();
  private stepOrder: string[] = [];
  private currentStepId: string | null = null;
  private startTime: Date | null = null;
  private endTime: Date | null = null;
  private config: ProgressConfig;
  private logger: DatabaseLogger;
  private callbacks: ProgressCallback[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private progressHistory: Map<string, number[]> = new Map(); // For time estimation

  constructor(
    public readonly name: string,
    config: Partial<ProgressConfig> = {},
    logger?: DatabaseLogger
  ) {
    this.config = { ...DEFAULT_PROGRESS_CONFIG, ...config };
    this.logger = logger || getDatabaseLogger();
  }

  /**
   * Add a progress step to track
   */
  addStep(
    id: string,
    name: string,
    description: string,
    estimatedDuration?: number
  ): void {
    const step: ProgressStep = {
      id,
      name,
      description,
      status: ProgressStatus.NOT_STARTED,
      estimatedDuration,
    };

    this.steps.set(id, step);
    this.stepOrder.push(id);

    this.logger.debug(`Added progress step: ${name}`, {
      operation: 'progress-tracking',
      stepId: id,
      totalSteps: this.stepOrder.length,
    });
  }

  /**
   * Start tracking progress
   */
  start(): void {
    this.startTime = new Date();
    
    this.logger.info(`Starting progress tracking: ${this.name}`, {
      operation: 'progress-tracking',
      totalSteps: this.stepOrder.length,
      estimatedDuration: this.getTotalEstimatedDuration(),
    });

    this.emitEvent(ProgressEvent.STARTED);
    this.startUpdateTimer();
  }

  /**
   * Start a specific step
   */
  startStep(stepId: string): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    if (this.currentStepId && this.currentStepId !== stepId) {
      // Auto-complete previous step if not already completed
      const currentStep = this.steps.get(this.currentStepId);
      if (currentStep && currentStep.status === ProgressStatus.IN_PROGRESS) {
        this.completeStep(this.currentStepId);
      }
    }

    step.status = ProgressStatus.IN_PROGRESS;
    step.startTime = new Date();
    this.currentStepId = stepId;

    this.logger.info(`Started step: ${step.name}`, {
      operation: 'progress-tracking',
      stepId,
      stepName: step.name,
      stepIndex: this.stepOrder.indexOf(stepId) + 1,
      totalSteps: this.stepOrder.length,
    });

    this.emitEvent(ProgressEvent.STEP_STARTED, step);
    this.updateConsoleOutput();
  }

  /**
   * Update progress for current step
   */
  updateStepProgress(stepId: string, progress: number, metadata?: Record<string, any>): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.progress = Math.max(0, Math.min(100, progress));
    if (metadata) {
      step.metadata = { ...step.metadata, ...metadata };
    }

    this.logger.debug(`Updated step progress: ${step.name} (${progress}%)`, {
      operation: 'progress-tracking',
      stepId,
      progress,
      metadata,
    });

    this.emitEvent(ProgressEvent.STEP_PROGRESS, step);
    this.updateConsoleOutput();
  }

  /**
   * Complete a step
   */
  completeStep(stepId: string, metadata?: Record<string, any>): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = ProgressStatus.COMPLETED;
    step.endTime = new Date();
    step.progress = 100;
    
    if (step.startTime) {
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      this.recordStepDuration(stepId, step.duration);
    }

    if (metadata) {
      step.metadata = { ...step.metadata, ...metadata };
    }

    this.logger.info(`Completed step: ${step.name}`, {
      operation: 'progress-tracking',
      stepId,
      duration: step.duration,
      metadata,
    });

    this.emitEvent(ProgressEvent.STEP_COMPLETED, step);
    this.updateConsoleOutput();

    // Check if all steps are completed
    if (this.isCompleted()) {
      this.complete();
    }
  }

  /**
   * Mark a step as failed
   */
  failStep(stepId: string, error: Error, metadata?: Record<string, any>): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = ProgressStatus.FAILED;
    step.endTime = new Date();
    step.error = error;
    
    if (step.startTime) {
      step.duration = step.endTime.getTime() - step.startTime.getTime();
    }

    if (metadata) {
      step.metadata = { ...step.metadata, ...metadata };
    }

    this.logger.error(`Failed step: ${step.name}`, {
      operation: 'progress-tracking',
      stepId,
      duration: step.duration,
      metadata,
    }, error);

    this.emitEvent(ProgressEvent.STEP_FAILED, step);
    this.updateConsoleOutput();
  }

  /**
   * Skip a step
   */
  skipStep(stepId: string, reason: string, metadata?: Record<string, any>): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = ProgressStatus.SKIPPED;
    step.endTime = new Date();
    
    if (metadata) {
      step.metadata = { ...step.metadata, reason, ...metadata };
    } else {
      step.metadata = { reason };
    }

    this.logger.info(`Skipped step: ${step.name} (${reason})`, {
      operation: 'progress-tracking',
      stepId,
      reason,
      metadata,
    });

    this.updateConsoleOutput();

    // Check if all steps are completed or skipped
    if (this.isCompleted()) {
      this.complete();
    }
  }

  /**
   * Complete the entire progress tracking
   */
  complete(): void {
    this.endTime = new Date();
    this.stopUpdateTimer();

    const totalDuration = this.startTime ? 
      this.endTime.getTime() - this.startTime.getTime() : 0;

    this.logger.info(`Completed progress tracking: ${this.name}`, {
      operation: 'progress-tracking',
      totalDuration,
      completedSteps: this.getCompletedSteps().length,
      failedSteps: this.getFailedSteps().length,
      skippedSteps: this.getSkippedSteps().length,
      totalSteps: this.stepOrder.length,
    });

    this.emitEvent(ProgressEvent.COMPLETED);
    this.updateConsoleOutput();
  }

  /**
   * Fail the entire progress tracking
   */
  fail(error: Error): void {
    this.endTime = new Date();
    this.stopUpdateTimer();

    const totalDuration = this.startTime ? 
      this.endTime.getTime() - this.startTime.getTime() : 0;

    this.logger.error(`Failed progress tracking: ${this.name}`, {
      operation: 'progress-tracking',
      totalDuration,
      completedSteps: this.getCompletedSteps().length,
      failedSteps: this.getFailedSteps().length,
      totalSteps: this.stepOrder.length,
    }, error);

    this.emitEvent(ProgressEvent.FAILED);
    this.updateConsoleOutput();
  }

  /**
   * Get overall progress percentage
   */
  getOverallProgress(): number {
    if (this.stepOrder.length === 0) return 0;

    let totalProgress = 0;
    for (const stepId of this.stepOrder) {
      const step = this.steps.get(stepId)!;
      if (step.status === ProgressStatus.COMPLETED || step.status === ProgressStatus.SKIPPED) {
        totalProgress += 100;
      } else if (step.status === ProgressStatus.IN_PROGRESS && step.progress !== undefined) {
        totalProgress += step.progress;
      }
    }

    return Math.round(totalProgress / this.stepOrder.length);
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(): number | null {
    if (!this.startTime || this.stepOrder.length === 0) return null;

    const completedSteps = this.getCompletedSteps();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.startTime.getTime();

    if (completedSteps.length === 0) {
      // Use estimated durations if available
      const totalEstimated = this.getTotalEstimatedDuration();
      return totalEstimated > 0 ? totalEstimated : null;
    }

    // Calculate based on actual progress
    const overallProgress = this.getOverallProgress();
    if (overallProgress === 0) return null;

    const estimatedTotal = (elapsedTime / overallProgress) * 100;
    return Math.max(0, estimatedTotal - elapsedTime);
  }

  /**
   * Get elapsed time
   */
  getElapsedTime(): number {
    if (!this.startTime) return 0;
    const endTime = this.endTime || new Date();
    return endTime.getTime() - this.startTime.getTime();
  }

  /**
   * Check if tracking is completed
   */
  isCompleted(): boolean {
    return this.stepOrder.every(stepId => {
      const step = this.steps.get(stepId)!;
      return step.status === ProgressStatus.COMPLETED || 
             step.status === ProgressStatus.SKIPPED;
    });
  }

  /**
   * Get steps by status
   */
  getStepsByStatus(status: ProgressStatus): ProgressStep[] {
    return this.stepOrder
      .map(id => this.steps.get(id)!)
      .filter(step => step.status === status);
  }

  getCompletedSteps(): ProgressStep[] {
    return this.getStepsByStatus(ProgressStatus.COMPLETED);
  }

  getFailedSteps(): ProgressStep[] {
    return this.getStepsByStatus(ProgressStatus.FAILED);
  }

  getSkippedSteps(): ProgressStep[] {
    return this.getStepsByStatus(ProgressStatus.SKIPPED);
  }

  /**
   * Get all steps in order
   */
  getAllSteps(): ProgressStep[] {
    return this.stepOrder.map(id => this.steps.get(id)!);
  }

  /**
   * Get current step
   */
  getCurrentStep(): ProgressStep | null {
    return this.currentStepId ? this.steps.get(this.currentStepId) || null : null;
  }

  /**
   * Add progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  removeCallback(callback: ProgressCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Get progress summary for reporting
   */
  getSummary(): {
    name: string;
    overallProgress: number;
    elapsedTime: number;
    estimatedTimeRemaining: number | null;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    currentStep: string | null;
  } {
    return {
      name: this.name,
      overallProgress: this.getOverallProgress(),
      elapsedTime: this.getElapsedTime(),
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      totalSteps: this.stepOrder.length,
      completedSteps: this.getCompletedSteps().length,
      failedSteps: this.getFailedSteps().length,
      skippedSteps: this.getSkippedSteps().length,
      currentStep: this.getCurrentStep()?.name || null,
    };
  }

  // Private helper methods

  private getTotalEstimatedDuration(): number {
    return this.stepOrder.reduce((total, stepId) => {
      const step = this.steps.get(stepId)!;
      return total + (step.estimatedDuration || 0);
    }, 0);
  }

  private recordStepDuration(stepId: string, duration: number): void {
    if (!this.config.estimateBasedOnHistory) return;

    if (!this.progressHistory.has(stepId)) {
      this.progressHistory.set(stepId, []);
    }
    
    const history = this.progressHistory.get(stepId)!;
    history.push(duration);
    
    // Keep only last 10 records for estimation
    if (history.length > 10) {
      history.shift();
    }
  }

  private emitEvent(event: ProgressEvent, step?: ProgressStep): void {
    const eventData: ProgressEventData = {
      event,
      tracker: this,
      step,
      timestamp: new Date(),
    };

    // Call all registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(this);
      } catch (error) {
        this.logger.warn('Progress callback error', {
          operation: 'progress-tracking',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  private startUpdateTimer(): void {
    if (!this.config.enableConsoleOutput || this.updateTimer) return;

    this.updateTimer = setInterval(() => {
      this.updateConsoleOutput();
    }, this.config.updateInterval);
  }

  private stopUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private updateConsoleOutput(): void {
    if (!this.config.enableConsoleOutput) return;

    const summary = this.getSummary();
    let output = `[${this.name}] `;

    if (this.config.showPercentage) {
      output += `${summary.overallProgress}% `;
    }

    if (summary.currentStep) {
      output += `${summary.currentStep} `;
    }

    if (this.config.showElapsedTime) {
      output += `(${this.formatDuration(summary.elapsedTime)} elapsed`;
      
      if (this.config.showTimeRemaining && summary.estimatedTimeRemaining) {
        output += `, ~${this.formatDuration(summary.estimatedTimeRemaining)} remaining`;
      }
      
      output += ')';
    }

    console.log(output);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
