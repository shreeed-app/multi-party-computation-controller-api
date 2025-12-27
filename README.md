# Multi-Party Computation Signer API

This document describes the architecture and workflow of a Multi-Party Computation (MPC) Signer API that enables secure key management and signing operations using distributed peers. The system leverages a bootstrap API, a worker process, and multiple peers that hold shares of cryptographic keys.

## Shares management

Each peer in the mesh holds a unique share of the cryptographic key, managed securely within its own Vault instance. The bootstrap worker coordinates signing requests by communicating with the peers to obtain partial signatures.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant API as Bootstrap API
    participant Queue as Redis Queue
    participant Worker as Bootstrap Worker
    participant FirstPeer as Peer #1
    participant SecondPeer as Peer #2
    participant ThirdPeer as Peer #3

    Client->>API: POST /keys/...
    API->>Queue: Enqueue job
    API-->>Client: 202 Accepted

    Queue->>Worker: Dequeue job
    Worker->>FirstPeer: Send key share #1
    Worker->>SecondPeer: Send key share #2
    Worker->>ThirdPeer: Send key share #3

    FirstPeer-->>Worker: ACK (stored in Vault)
    SecondPeer-->>Worker: ACK (stored in Vault)
    ThirdPeer-->>Worker: ACK (stored in Vault)

    Worker->>API: Key creation complete
    API-->>Client: 200 OK
```

## Signing process

The signing process involves coordinating multiple peers to generate a valid signature without any single peer having access to the complete private key.

```mermaid
sequenceDiagram
    autonumber

    participant Client
    participant API as Bootstrap API
    participant Queue as Redis Queue
    participant Worker as Bootstrap Worker
    participant FirstPeer as Peer #1
    participant SecondPeer as Peer #2
    participant ThirdPeer as Peer #3

    %% Public API
    Client->>API: POST /sign
    API->>Queue: Enqueue signing job
    API-->>Client: 202 Accepted

    %% Worker orchestration
    Queue->>Worker: Dequeue signing job

    Worker->>FirstPeer: Start signing session by sending digest
    Worker->>SecondPeer: Start signing session by sending digest
    Worker->>ThirdPeer: Start signing session by sending digest

    FirstPeer->>FirstPeer: Generate a random nonce share locally
    SecondPeer->>SecondPeer: Generate a random nonce share locally
    ThirdPeer->>ThirdPeer: Generate a random nonce share locally

    FirstPeer-->>Worker: Send public nonce commitment
    SecondPeer-->>Worker: Send public nonce commitment
    ThirdPeer-->>Worker: Send public nonce commitment

    Worker->>Worker: Combine all nonce commitments into one global nonce
    Worker->>Worker: Derive the public challenge from the global nonce

    Worker->>FirstPeer: Broadcast derived challenge
    Worker->>SecondPeer: Broadcast derived challenge
    Worker->>ThirdPeer: Broadcast derived challenge

    FirstPeer->>FirstPeer: Compute partial signature
    SecondPeer->>SecondPeer: Compute partial signature
    ThirdPeer->>ThirdPeer: Compute partial signature

    FirstPeer-->>Worker: Send partial signature
    SecondPeer-->>Worker: Send partial signature
    ThirdPeer-->>Worker: Send partial signature

    Worker->>Worker: Aggregate partial signatures into final signature
    Worker->>API: Return final signature
    API-->>Client: 200 OK
```
