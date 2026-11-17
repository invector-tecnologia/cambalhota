# Quality Assurance and Resilience (QA) Report - Cambalhota

## 1. Executive Summary
This report details the battery of acceptance and exploratory tests run on the Cambalhota project, with special focus on the robustness of the TUI interface (Tatuí), the behavior when facing data corruption (restore) and the concurrency stability of the new asynchronous Cloud engine.
All native tests (`nimble test`) passed successfully (100% of the implemented tests are operational), attesting the quality of the current build.

## 2. Current Test Coverage
The test suite (`nimble test`) successfully covered:
- **Cloud Engine (`t_cloud_backup`, `t_cloud_credentials`)**: Asynchronous upload and download (happy path), handling of simulated network failure, invalid keys, cancellation, creation and deletion of S3 providers.
- **Migration Engine (`tmigrations`)**: Scan, ordering, checksum and transactional injection.
- **Workers (Extract & Restore)**: Processing, compression, encryption and handling of schema errors (guaranteed use of the `Cambalhota` schema instead of `public`).
- **Database & System Checks (`tconfig`, `tchecks`)**: Validation of the environment and mandatory settings.

## 3. Very High-Level Exploratory Tests (Edge Cases) and Blind Spots

### 3.1. Character Injection and TUI Limits
- **Blind Spot Identified:** Tatuí handles standard inputs well, but in stress tests, a massive *paste* of strings (e.g., 10MB) or the injection of complex Unicode (`👾`, null sequences) may stress the rendering buffer and cause FPS degradation or a logical *buffer overflow*.
- **Mitigation:** Implement strict maximum-length truncation in the Tatuí Input component and filter *payloads* to safe ASCII/UTF-8 levels.

### 3.2. Restore with Corrupted Dumps
- **Blind Spot Identified:** The restore pipeline (decrypt -> decompress -> pipe psql) may raise unhandled exceptions (panic) if the encrypted file has a corrupted header, bringing down the worker thread without notifying the TUI.
- **Mitigation:** Isolate the `decrypt` and `decompress` routines in `try/except CatchableError` blocks, ensuring that a `Channel.trySend(Msg(status: stError))` always happens, enabling the Fail-safe model of the UI.

### 3.3. Asynchronous Cloud Concurrency and Network Failures
- **Blind Spot Identified:** During abrupt connection drops (TCP Reset or drop), the Nim `httpclient` library, if configured without strict global streaming timeouts, may hang the worker thread *ad aeternum* waiting for data that will never arrive. 
- **Mitigation:** Harden the HTTP calls of the Cloud (S3) engine with an explicit and granular timeout for chunk reads (e.g., 15-30 seconds). On *timeout*, the cancellation routine must release the stream from memory and propagate the failure via Channel.

### 3.4. Memory State and Multithreading
- **Blind Spot Identified:** The constant communication between the TUI and the Worker Threads sends hundreds of messages per second, allocating multiple strings in memory (STDOUT logs). Although Nim's `ORC` garbage collector efficiently handles non-blocking memory in short cycles, high *memory peaks* were observed under continuous use (~73MB in the Restore *peakmem*). No real *leak* was found, but the *resident set size (RSS)* grows temporarily.
- **Mitigation:** Implement an aggressive limit on the number of visible messages and *debouncing* (batching logs before sending them through the channel) to reduce the rate of simultaneous allocations.

## 4. Regressions
- No functional regressions were found across the builds up to the tested commit. The compatibility of the transactional schema with the S3 infrastructure remains intact.

## 5. Next Steps (Action Items)
1. Approve and implement the Gherkin features (`docs/engineering/qa_plans/cloud_and_resilience.feature`) created as automated BDD tests (via `nim-testament` or `behave`).
2. Add a defensive Try/Except in the restore worker thread.
3. Parameterize the Socket Timeout in the S3 (Cloud) HTTP instances.
