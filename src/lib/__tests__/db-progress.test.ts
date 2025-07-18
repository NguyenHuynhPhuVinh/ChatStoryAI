/**
 * Tests for Database Progress Tracking System
 *
 * Comprehensive test suite for progress indicators, time estimation,
 * and progress reporting functionality.
 */

import {
  ProgressTracker,
  ProgressStatus,
  ProgressEvent,
  ProgressCallback,
} from "../db-progress";
import { DatabaseLogger } from "../db-logging";

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

let consoleOutput: string[] = [];

beforeEach(() => {
  consoleOutput = [];

  // Mock console methods to capture output
  console.log = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  console.warn = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  console.error = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  // Mock timers
  jest.useFakeTimers();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;

  // Restore timers
  jest.useRealTimers();
});

describe("ProgressTracker", () => {
  describe("Basic Functionality", () => {
    test("should create progress tracker with default configuration", () => {
      const tracker = new ProgressTracker("test-operation");

      expect(tracker.name).toBe("test-operation");
      expect(tracker.getOverallProgress()).toBe(0);
      expect(tracker.getAllSteps()).toHaveLength(0);
      expect(tracker.isCompleted()).toBe(true); // No steps means completed
    });

    test("should add steps correctly", () => {
      const tracker = new ProgressTracker("test-operation");

      tracker.addStep("step1", "First Step", "Description of first step", 5000);
      tracker.addStep("step2", "Second Step", "Description of second step");

      const steps = tracker.getAllSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe("step1");
      expect(steps[0].name).toBe("First Step");
      expect(steps[0].status).toBe(ProgressStatus.NOT_STARTED);
      expect(steps[0].estimatedDuration).toBe(5000);
      expect(steps[1].id).toBe("step2");
      expect(steps[1].estimatedDuration).toBeUndefined();
    });

    test("should start tracking correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");

      const startTime = new Date();
      tracker.start();

      expect(tracker.getElapsedTime()).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Step Management", () => {
    test("should start step correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      tracker.startStep("step1");

      const step = tracker.getCurrentStep();
      expect(step?.id).toBe("step1");
      expect(step?.status).toBe(ProgressStatus.IN_PROGRESS);
      expect(step?.startTime).toBeInstanceOf(Date);
    });

    test("should update step progress correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();
      tracker.startStep("step1");

      tracker.updateStepProgress("step1", 50, { processed: 100, total: 200 });

      const step = tracker.getCurrentStep();
      expect(step?.progress).toBe(50);
      expect(step?.metadata?.processed).toBe(100);
      expect(step?.metadata?.total).toBe(200);
    });

    test("should complete step correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();
      tracker.startStep("step1");

      // Advance time to simulate duration
      jest.advanceTimersByTime(1000);

      tracker.completeStep("step1", { result: "success" });

      const steps = tracker.getAllSteps();
      const step = steps[0];
      expect(step.status).toBe(ProgressStatus.COMPLETED);
      expect(step.progress).toBe(100);
      expect(step.endTime).toBeInstanceOf(Date);
      expect(step.duration).toBeGreaterThan(0);
      expect(step.metadata?.result).toBe("success");
    });

    test("should fail step correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();
      tracker.startStep("step1");

      const error = new Error("Step failed");
      tracker.failStep("step1", error, { reason: "timeout" });

      const steps = tracker.getAllSteps();
      const step = steps[0];
      expect(step.status).toBe(ProgressStatus.FAILED);
      expect(step.error).toBe(error);
      expect(step.metadata?.reason).toBe("timeout");
    });

    test("should skip step correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      tracker.skipStep("step1", "Not needed in this environment");

      const steps = tracker.getAllSteps();
      const step = steps[0];
      expect(step.status).toBe(ProgressStatus.SKIPPED);
      expect(step.metadata?.reason).toBe("Not needed in this environment");
    });

    test("should throw error for unknown step", () => {
      const tracker = new ProgressTracker("test-operation");

      expect(() => tracker.startStep("unknown")).toThrow(
        "Step not found: unknown"
      );
      expect(() => tracker.updateStepProgress("unknown", 50)).toThrow(
        "Step not found: unknown"
      );
      expect(() => tracker.completeStep("unknown")).toThrow(
        "Step not found: unknown"
      );
    });
  });

  describe("Progress Calculation", () => {
    test("should calculate overall progress correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.addStep("step2", "Second Step", "Description");
      tracker.addStep("step3", "Third Step", "Description");
      tracker.start();

      expect(tracker.getOverallProgress()).toBe(0);

      tracker.startStep("step1");
      tracker.updateStepProgress("step1", 50);
      expect(tracker.getOverallProgress()).toBe(17); // 50/3 = 16.67 rounded to 17

      tracker.completeStep("step1");
      expect(tracker.getOverallProgress()).toBe(33); // 100/3 = 33.33 rounded to 33

      tracker.skipStep("step2", "Not needed");
      expect(tracker.getOverallProgress()).toBe(67); // 200/3 = 66.67 rounded to 67

      tracker.startStep("step3");
      tracker.completeStep("step3");
      expect(tracker.getOverallProgress()).toBe(100);
    });

    test("should detect completion correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.addStep("step2", "Second Step", "Description");
      tracker.start();

      expect(tracker.isCompleted()).toBe(false);

      tracker.startStep("step1");
      tracker.completeStep("step1");
      expect(tracker.isCompleted()).toBe(false);

      tracker.skipStep("step2", "Not needed");
      expect(tracker.isCompleted()).toBe(true);
    });

    test("should auto-complete tracking when all steps done", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      const completeSpy = jest.spyOn(tracker, "complete");

      tracker.startStep("step1");
      tracker.completeStep("step1");

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("Time Estimation", () => {
    test("should calculate elapsed time correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.start();

      jest.advanceTimersByTime(5000);

      expect(tracker.getElapsedTime()).toBe(5000);
    });

    test("should estimate time remaining based on progress", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.addStep("step2", "Second Step", "Description");
      tracker.start();

      // Complete first step in 2 seconds
      tracker.startStep("step1");
      jest.advanceTimersByTime(2000);
      tracker.completeStep("step1");

      // 50% complete in 2 seconds, so estimate 2 more seconds
      const remaining = tracker.getEstimatedTimeRemaining();
      expect(remaining).toBe(2000);
    });

    test("should use estimated durations when no progress yet", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description", 3000);
      tracker.addStep("step2", "Second Step", "Description", 2000);
      tracker.start();

      const remaining = tracker.getEstimatedTimeRemaining();
      expect(remaining).toBe(5000);
    });
  });

  describe("Step Filtering", () => {
    test("should filter steps by status correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.addStep("step2", "Second Step", "Description");
      tracker.addStep("step3", "Third Step", "Description");
      tracker.start();

      tracker.startStep("step1");
      tracker.completeStep("step1");
      tracker.skipStep("step2", "Not needed");
      tracker.startStep("step3");
      tracker.failStep("step3", new Error("Failed"));

      expect(tracker.getCompletedSteps()).toHaveLength(1);
      expect(tracker.getSkippedSteps()).toHaveLength(1);
      expect(tracker.getFailedSteps()).toHaveLength(1);
      expect(tracker.getStepsByStatus(ProgressStatus.IN_PROGRESS)).toHaveLength(
        0
      );
    });
  });

  describe("Progress Callbacks", () => {
    test("should call progress callbacks on events", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");

      const callback = jest.fn();
      tracker.onProgress(callback);

      tracker.start();
      expect(callback).toHaveBeenCalledWith(tracker);

      tracker.startStep("step1");
      expect(callback).toHaveBeenCalledTimes(2);

      tracker.completeStep("step1");
      expect(callback).toHaveBeenCalledTimes(4); // step completed + overall completed
    });

    test("should remove callbacks correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      const callback = jest.fn();

      tracker.onProgress(callback);
      tracker.removeCallback(callback);

      tracker.start();
      expect(callback).not.toHaveBeenCalled();
    });

    test("should handle callback errors gracefully", () => {
      const tracker = new ProgressTracker("test-operation");
      const errorCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      tracker.onProgress(errorCallback);

      // Should not throw
      expect(() => tracker.start()).not.toThrow();
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe("Console Output", () => {
    test("should output progress to console when enabled", () => {
      const tracker = new ProgressTracker("test-operation", {
        enableConsoleOutput: true,
        updateInterval: 100,
      });
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      tracker.startStep("step1");
      tracker.updateStepProgress("step1", 50);

      // Check that console output was generated
      const progressOutput = consoleOutput.find(
        (output) =>
          output.includes("[test-operation]") && output.includes("50%")
      );
      expect(progressOutput).toBeDefined();
    });

    test("should not output to console when disabled", () => {
      const tracker = new ProgressTracker("test-operation", {
        enableConsoleOutput: false,
      });
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      tracker.startStep("step1");

      const progressOutput = consoleOutput.find((output) =>
        output.includes("[test-operation]")
      );
      expect(progressOutput).toBeUndefined();
    });
  });

  describe("Summary Generation", () => {
    test("should generate comprehensive summary", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.addStep("step2", "Second Step", "Description");
      tracker.start();

      tracker.startStep("step1");
      tracker.completeStep("step1");
      tracker.skipStep("step2", "Not needed");

      const summary = tracker.getSummary();

      expect(summary.name).toBe("test-operation");
      expect(summary.overallProgress).toBe(100);
      expect(summary.totalSteps).toBe(2);
      expect(summary.completedSteps).toBe(1);
      expect(summary.skippedSteps).toBe(1);
      expect(summary.failedSteps).toBe(0);
      expect(summary.elapsedTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Integration with Logger", () => {
    test("should log progress events with structured data", () => {
      const logger = new DatabaseLogger({ format: "json", level: "debug" });
      const tracker = new ProgressTracker("test-operation", {}, logger);
      tracker.addStep("step1", "First Step", "Description");

      tracker.start();
      tracker.startStep("step1");
      tracker.completeStep("step1");

      // Check that structured logs were generated
      const startLog = consoleOutput.find((output) =>
        output.includes("Starting progress tracking")
      );
      expect(startLog).toBeDefined();

      const stepLog = consoleOutput.find((output) =>
        output.includes("Started step: First Step")
      );
      expect(stepLog).toBeDefined();

      const completeLog = consoleOutput.find((output) =>
        output.includes("Completed step: First Step")
      );
      expect(completeLog).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle step failures gracefully", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      tracker.startStep("step1");
      const error = new Error("Step failed");
      tracker.failStep("step1", error);

      const failedSteps = tracker.getFailedSteps();
      expect(failedSteps).toHaveLength(1);
      expect(failedSteps[0].error).toBe(error);
    });

    test("should handle overall failure correctly", () => {
      const tracker = new ProgressTracker("test-operation");
      tracker.addStep("step1", "First Step", "Description");
      tracker.start();

      // Advance time to simulate some elapsed time
      jest.advanceTimersByTime(1000);

      const error = new Error("Overall failure");
      tracker.fail(error);

      expect(tracker.getElapsedTime()).toBeGreaterThan(0);
    });
  });
});
