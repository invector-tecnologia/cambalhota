# ADR 008: Cloud Backup Integration and Concurrency

**Status:** Implemented

## Context
The Product Agent designed a UX/UI solution in the TUI (`app.nim`) to allow uploading (`[U]`) and downloading (`[D]`) backups/dumps directly from cloud storage. The current interface implements the visual behavior with simulated variables (`isUploading`, `isDownloading` and `progressTimer`), which requires building a real integration and asynchronous management infrastructure so network operations (heavy, long I/O) do not block the TUI main thread.

## Decision
1. **Network Integration Pattern (Cloud Integration):**
   - We will implement a generic client compatible with the S3 protocol using Nim's standard HTTP library (`std/httpclient` or `puppy`). 
   - Authentication will use the AWS Signature V4 standard, generated natively in Nim, ensuring support not only for AWS S3 but also for solutions such as MinIO, Cloudflare R2, DigitalOcean Spaces and Google Cloud Storage (via S3 interoperability).
   - An agnostic solution through HTTP calls avoids the heavy "vendor lock-in" of specific SDKs and takes advantage of Nim's lightweight compiled infrastructure.

2. **Concurrency and Multithreading:**
   - Since the TUI renders at 60fps+ in the terminal through the `pollEvent(50)` polling function, any network interruption would freeze the user's screen.
   - We will use Nim's native `Thread[T]` and `Channel[T]` primitives (specifically `system.Channel` adapted to the arc/orc memory model).
   - When `[U]` or `[D]` is pressed, the main Thread (TUI) starts the I/O process in a **Worker Thread**.
   - The Worker Thread will use HTTP Streaming (with memory-bounded chunks) to read encrypted backup files and send them to the cloud bucket.
   - On each chunk iteration, the Worker Thread sends a non-blocking message (`Channel.trySend`) to the TUI with the progress status (e.g., `bytesSent`, `totalBytes`, `stRunning`, `stError`).

3. **TUI Integration (`app.nim`):**
   - The main loop in `runTui()` will call `progressChannel.tryRecv()` before rendering.
   - The visual state object (progress and notification strings) will be fed by these messages from the channel, replacing the `progressTimer += 5` simulator.
   - This lets the interface react in real time to network traffic without terminal repaint delays.

## Trade-offs
- **Thread Complexity:** Working with Threads and Channels under Nim ORC requires the passed types to be `Sendable` (isolated from the original thread). We cannot pass open network references, which limits communication to simple status transport (strings, integers and enums).
- **Native S3 Abstraction:** Writing or using lean libraries to generate the AWS SigV4 HMAC-SHA256 signature in Nim requires development or integration of cryptography libraries.
- **Advantage:** Without huge SDKs such as the Python/Node ones for AWS, the Cambalhota binary stays ultra-fast, tiny and free of dynamic dependencies at deploy time.

## Consequences
- The user experience ("non-blocking UX/UI") designed by Product becomes 100% real in the backend: the terminal stays interactive, letting the user navigate while their dump uploads to the cloud.
- Graceful cancellations must be supported by sending signals (`Cancellation Token` or an atomic boolean) to abort the network thread if the user wants to give up in the middle of an upload.
- The technical base will be a solid foundation if the project integrates WebDAV, FTP or native Google Drive in the future.
