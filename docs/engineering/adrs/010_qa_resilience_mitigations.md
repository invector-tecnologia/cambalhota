# ADR 010: QA Resilience Mitigations

**Status**: Implemented
## Context
The QA Agent ran a sophisticated battery of security, performance and concurrency tests on Cambalhota. It found 4 critical points (Blind Spots) that can lead to instability, lockups or vulnerabilities in the system:
1. **Buffer overflow in the TUI**: Injection of excessive or malicious characters into input fields.
2. **Worker Thread panic**: Decryption failures on corrupted files bring the thread down instead of handling the error in isolation.
3. **Network deadlock in the Cloud S3 Module**: Communication hangs because `httpclient` is used without a strict timeout configuration under intermittent network conditions.
4. **Memory allocation spikes**: Excessive progress messages sent through Channels between threads, causing high allocation (no *debouncing*).

## Technical Decision and Implementation (Nim)

### 1. Buffer Overflow Prevention in the TUI (`src/tui/app.nim` and similar)
- **Implementation**: Strictly limit the length of strings in *Tatui* / *Illwill* input fields. 
- **Details**:
  - Validate the input string `len` before appending new characters. If it exceeds a `MAX_INPUT_LENGTH` (e.g., 256 characters for paths or passwords), the extra input must be discarded.
  - Sanitize input to ignore disallowed control characters.

### 2. Fault Tolerance in the Worker Thread (`src/core/restore.nim` or `src/core/crypto.nim`)
- **Implementation**: Replace calls that can cause a panic (such as invalid access or a cryptographic failure) with `try ... except CatchableError` blocks.
- **Details**:
  - When the cryptography module detects file corruption (GCM authentication failure or invalid padding), the worker thread must not fail critically (`panic`).
  - The error must be wrapped in a message structure (`BackupEvent` or similar) with an Error status and sent back to the Main Thread through the Channel, letting the TUI show the failure gracefully and keep running.

### 3. Strict Timeout and Network Resilience (`src/core/cloud.nim`)
- **Implementation**: Configure explicit timeouts on the HTTP client and implement *Retries*.
- **Details**:
  - When instantiating `newHttpClient()` or `newAsyncHttpClient()`, the `timeout` parameter must always be set (e.g., 15000 to 30000 ms).
  - Wrap network calls to S3 in retry blocks with *Exponential Backoff*. If a `TimeoutError` occurs, the system retries up to a maximum limit before failing the operation safely (notifying through the Channel).

### 4. Message *Debouncing* in Channels (`src/core/worker.nim` / `src/core/progress.nim`)
- **Implementation**: Group (*batching*) or apply *debouncing* to progress updates sent to the Main Thread.
- **Details**:
  - Instead of sending a string to the `Channel` for every byte read or small block transferred, the worker must store the time of the last update (using `std/times` and `cpuTime`).
  - Send update messages only if the time difference exceeds a threshold (e.g., 100ms) or if the transfer is complete.
  - The message content must not be a `string` built on every iteration, but a lightweight object/tuple (`tuple[bytesRead: int, totalBytes: int]`), leaving string formatting (`"50% complete"`) to the Main Thread (TUI), which removes repeated allocations in the worker.

## Consequences and Trade-offs
- **Positive**: 
  - Greater application resilience and stability.
  - Drastic reduction of CPU and RAM consumption during heavy operations by mitigating Channel overhead.
  - A TUI that does not break from "Fat Fingers" or malicious input.
- **Negative / Trade-offs**: 
  - The TUI will lose microscopic precision in progress bars (updating every 100ms instead of continuously), which is imperceptible to a human user but changes the actual granularity.
  - Network code complexity will increase slightly because of the *retry* and *backoff* logic.
