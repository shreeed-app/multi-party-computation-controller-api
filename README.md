# Multi-Party Computation Controller API

NestJS HTTP API for the multi-party computation controller. Exposes key generation and threshold signing endpoints, enqueues jobs via BullMQ, and dispatches them to the cryptographic engine over gRPC. Clients poll for job completion.

## Compatibility

| OS                 | Status |
| ------------------ | ------ |
| macOS              | ✅      |
| Linux              | ✅      |
| Windows (via WSL2) | ✅      |
| Native Windows     | ✅      |

## Prerequisites

- [Docker](https://www.docker.com) and Docker Compose
- [Node.js](https://nodejs.org)
- [Bun](https://bun.sh)
- [Act](https://github.com/nektos/act) for local GitHub Actions testing

### Key generation

The client submits a key generation request. The API enqueues the job and returns a job ID immediately. The worker calls the Rust engine via gRPC, which coordinates the multi-party computation protocol across nodes. On completion the public key and key package are stored in Redis and exposed through the polling endpoint.

```mermaid
sequenceDiagram
    autonumber
    participant Client

    box API
        participant HTTP
        participant Queue
        participant Worker
    end

    participant Redis
    participant Engine as Cryptographic engine

    Client->>HTTP: POST /key-generation
    HTTP->>Queue: Enqueue job
    HTTP-->>Client: 202 Accepted { jobId }

    Queue->>Worker: Dequeue job
    Worker->>Engine: GenerateKey RPC
    Engine-->>Worker: { publicKey, publicKeyPackage }

    Worker->>Redis: Store key metadata
    Worker->>Queue: Mark job completed

    Client->>HTTP: GET /jobs/:jobId
    HTTP-->>Client: 200 OK { status: "completed", result: { publicKey, publicKeyPackage } }
```

### Signing

The client submits a signing request referencing a previously generated key. The worker retrieves the key metadata from Redis, then calls the Rust engine to produce a threshold signature. The client polls until the job completes.

```mermaid
sequenceDiagram
    autonumber
    participant Client

    box API
        participant HTTP
        participant Queue
        participant Worker
    end

    participant Redis
    participant Engine as Cryptographic engine

    Client->>HTTP: POST /signing { keyIdentifier, message }
    HTTP->>Queue: Enqueue job
    HTTP-->>Client: 202 Accepted { jobId }

    Queue->>Worker: Dequeue job
    Worker->>Redis: Retrieve key metadata
    Redis-->>Worker: { publicKeyPackage, algorithm, threshold, participants }

    Worker->>Engine: Sign RPC
    Engine-->>Worker: { signature }

    Worker->>Queue: Mark job completed

    Client->>HTTP: GET /jobs/:jobId
    HTTP-->>Client: 200 OK { status: "completed", result: { signature } }
```
