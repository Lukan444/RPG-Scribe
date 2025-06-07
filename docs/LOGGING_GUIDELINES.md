# Logging Guidelines for RPG Scribe

This document provides guidelines for implementing and managing logging within the RPG Scribe application, with a focus on security, PII protection, and effective debugging.

## Guiding Principles

1.  **Security and Privacy First:** Avoid logging sensitive information (PII, API keys, full transcripts, verbose user inputs within errors) unless absolutely necessary for debugging, and even then, only at appropriate `DEBUG` levels with clear warnings.
2.  **Production vs. Development:** Logging behavior should differ significantly between environments. Production logs should be less verbose by default.
3.  **Actionable Logs:** Logs should provide enough context to diagnose issues without exposing sensitive data.
4.  **Consistency:** Use the provided logging utilities (`LiveTranscriptionLogger`, `SystemLoggerService`) for consistent log structure and control.

## Log Levels

The application uses the following log levels (from `LiveTranscriptionLogLevel`):

*   **DEBUG (0):** Detailed information useful for developers during active debugging. May contain more sensitive data (e.g., truncated snippets, detailed error properties).
*   **INFO (1):** General operational information, milestones, successful operations (e.g., service started, file processed successfully, segment metadata). Should not contain PII.
*   **WARN (2):** Potential issues or unexpected situations that do not critically affect the current operation but might indicate problems if they persist.
*   **ERROR (3):** Errors that caused an operation to fail or indicate a significant problem.

## Logger Implementations

*   **`Logger` (`src/utils/logger.ts`):** A basic wrapper around `console` methods. It passes metadata and error objects directly to the console.
*   **`LiveTranscriptionLogger` (`src/utils/liveTranscriptionLogger.ts`):**
    *   Provides structured logging for specific components/services.
    *   By default, it is **enabled only when `process.env.NODE_ENV === 'development'`**. This is a primary safeguard for production.
    *   Its default logging level (if enabled) is `DEBUG`.
    *   Crucially, methods like `logTranscriptionSegment` are designed to log metadata (e.g., text length) rather than full transcription text at `INFO` level, which is good for PII protection.
    *   It can store logs in memory for debugging purposes (e.g., via UI).
*   **`SystemLoggerService` (`src/services/systemLogger.service.ts`):**
    *   A singleton service that uses `LiveTranscriptionLogger` instances for different system modules.
    *   Aggregates logs in memory and allows for filtering and export.

## Recommendations for PII-Safe and Effective Logging

1.  **Production Log Configuration:**
    *   **Primary Safeguard:** The default behavior where `LiveTranscriptionLogger` (and thus `SystemLoggerService`) is disabled in production (when `NODE_ENV=production`) should be maintained unless there's a critical need for frontend logging in production.
    *   **If Enabled in Production:** If application logging *must* be enabled in a production environment (e.g., by overriding the default `enabled` flag), the default log level **must be explicitly configured to `INFO` or `WARN`**.
        ```typescript
        // Example: When creating a logger instance for a production-safe scenario
        // This configuration would typically come from a centralized config service
        // that reads environment variables.
        const prodLogger = createLiveTranscriptionLogger('MyComponent', {
          enabled: true, // Only if explicitly needed for production
          level: LiveTranscriptionLogLevel.INFO,
          includeStackTrace: false // Avoid including full error objects in client-side production logs
        });
        ```
    *   `DEBUG` level logging should be disabled in production builds by default.

2.  **Control Log Levels and Features via Environment Variables:**
    *   It is strongly recommended to control logger behavior (enabled status, level, stack trace inclusion) through environment variables (e.g., `REACT_APP_LOG_ENABLED`, `REACT_APP_LOG_LEVEL`, `REACT_APP_LOG_INCLUDE_STACKTRACE` for the frontend; similar variables for backend functions).
    *   The application's startup or configuration service should read these variables and apply them when initializing loggers. This allows dynamic adjustment of logging verbosity without code changes.

3.  **Handling Sensitive Data in Logs:**
    *   **Transcription Text:**
        *   **DO NOT** log full transcription text at `INFO`, `WARN`, or `ERROR` levels. The current `logTranscriptionSegment` correctly logs metadata (length) instead of content. Maintain this practice.
        *   If snippets of transcription text are ever needed for `DEBUG` logs, they **must be truncated** (e.g., first 20-50 characters) and a clear warning comment added.
    *   **Audio Data:** Avoid logging raw audio data (e.g., base64 strings) at any level. Log metadata like chunk size or duration instead.
    *   **Error Objects:**
        *   When logging error objects, be cautious. While messages and stack traces are often needed, some error objects (especially from third-party SDKs) might inadvertently contain parts of the original request data.
        *   For frontend loggers (`LiveTranscriptionLogger`, `SystemLoggerService`'s in-memory store if exposed to users), prefer logging sanitized error information (e.g., `error.message`, `error.name`, custom error codes) rather than the full error object, especially if `includeStackTrace` is considered for production.
        *   For backend Firebase Functions logs (which go to Google Cloud Logging), logging full error objects is more common for debugging, but still be mindful if errors could echo significant PII. The current proxy functions attempt to log specific fields for known API errors.
    *   **User Identifiers (User IDs, Names, etc.):** Avoid logging these directly alongside sensitive data like full error details or verbose operational parameters unless strictly necessary for a specific debugging context. Prefer using internal session IDs or operation IDs for correlation. `SystemLoggerService` includes context like `userId`, `sessionId`; ensure this context is used responsibly.
    *   **File Names:** Be aware that user-uploaded file names (as logged by `OpenAIWhisperService`) can sometimes be PII. While often useful for debugging, consider if this is a significant risk for your user base.

4.  **Log Export from `SystemLoggerService`:**
    *   The `exportLogs(LogExportFormat.JSON)` method will export everything captured in the `SystemLogEntry`, including full error objects if they were stored. This JSON export should be handled with care, treated as potentially sensitive, and not exposed insecurely.
    *   The CSV and TXT export formats are safer as they only include error messages and stacks, not full error objects.

5.  **Secure Log Storage and Transmission:**
    *   **Backend Logs (Firebase Functions):** Logs are stored in Google Cloud Logging. Ensure access to these logs in GCP is strictly controlled via IAM permissions.
    *   **Frontend Logs (In-memory/Console):** These are primarily for live debugging. If there's ever a feature to send these logs to a backend, ensure the transmission is over HTTPS and the receiving endpoint is secured.
    *   Avoid implementing custom log shipping from the client unless absolutely necessary and done with extreme care for security and PII.

6.  **Log Review and Auditing:**
    *   Periodically review the types of data being logged, especially after changes to logging code or when integrating new services.
    *   Ensure that production log levels are set appropriately to avoid accidental PII leakage.

7.  **Comments and Warnings in Code:**
    *   For any logging statements that remain potentially sensitive but are deemed necessary for debugging (and are at appropriate `DEBUG` levels, with data truncation if possible), add a comment warning about the sensitivity and the need to ensure these logs are disabled or secured in production.

By following these guidelines, RPG Scribe can maintain effective logging for development and troubleshooting while minimizing the risk of exposing PII or other sensitive information.
