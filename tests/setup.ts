/**
 * Vitest Global Setup
 * 
 * This file runs before all tests and sets up the testing environment.
 * It's necessary to have this as a separate file because:
 * 1. reflect-metadata MUST be loaded before any decorator code executes
 * 2. Vitest's setupFiles ensures this runs at the right time in the lifecycle
 */

// Required for tsyringe dependency injection decorators
import "reflect-metadata";

// Optional: You can add more global test configuration here in the future
// Examples:
// - Global test utilities
// - Custom matchers
// - Environment variables for tests
// - Mock configurations

