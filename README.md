# Multi-Party Computation Signer API

This document describes the sequence diagrams for the key shares management and signing process in a Multi-Party Computation (MPC) Signer API system.

## Compatibility

| OS                 | Status |
| ------------------ | ------ |
| macOS              | ✅     |
| Linux              | ✅     |
| Windows (via WSL2) | ✅     |
| Native Windows     | ✅     |

## Prerequisites

- [Docker](https://www.docker.com) and Docker Compose
- [Node.js](https://nodejs.org)
- [Bun](https://bun.sh)
- [Act](https://github.com/nektos/act) for local GitHub Actions testing

### Shares management

The shares management process involves distributing encrypted key shares to multiple peers for secure storage. Each peer is responsible for decrypting and storing its share in a secure vault.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    
    box Orchestrator
        participant API
    end
    
    box Peers
        participant FirstPeer as Peer 1
        participant SecondPeer as Peer 2
        participant NPeer as Peer 3..N
    end

    Client->>API: POST /keys/new (encrypted)
    API-->>Client: 202 Accepted

    API->>FirstPeer: Send key share #1
    API->>SecondPeer: Send key share #2
    API->>NPeer: Send key share #3..N

    FirstPeer-->>API: ACK (decrypted and stored in Vault)
    SecondPeer-->>API: ACK (decrypted and stored in Vault)
    NPeer-->>API: ACK (decrypted and stored in Vault)

    API-->>Client: 200 OK
```

### Signing process

The signing process involves coordinating multiple peers to collaboratively generate a digital signature without exposing the private key. The orchestrator API receives signing requests, enqueues them for processing, and the worker interacts with the peers to perform the signing operation.

```mermaid
sequenceDiagram
    autonumber

    participant Client

    box Orchestrator
        participant API
        participant Queue
        participant Worker
    end

    box Peers
        participant FirstPeer as Peer 1
        participant SecondPeer as Peer 2
        participant NPeer as Peer 3..N
    end

    Client->>API: POST /sign
    API->>Queue: Enqueue signing job
    API-->>Client: 202 Accepted

    Queue->>Worker: Dequeue signing job

    Worker->>FirstPeer: Start session
    Worker->>SecondPeer: Start session
    Worker->>NPeer: Start session

    Note right of Worker: Select quorum t-of-N (N ≥ 3)
    loop Rounds
        FirstPeer-->>Worker: Round N message
        SecondPeer-->>Worker: Round N message
        NPeer-->>Worker: Round N message

        Worker->>FirstPeer: Forward aggregated Round N messages
        Worker->>SecondPeer: Forward aggregated Round N messages
        Worker->>NPeer: Forward aggregated Round N messages
    end

    FirstPeer-->>Worker: Final contribution
    SecondPeer-->>Worker: Final contribution
    NPeer-->>Worker: Final contribution

    Worker->>Worker: Aggregate final signature
    Worker->>API: Return signature
    API-->>Client: 200 OK

```
