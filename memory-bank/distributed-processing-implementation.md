# Distributed Processing Implementation

This document describes the implementation of distributed processing in the RPG Archivist application.

## Overview

The distributed processing system allows the application to distribute processing tasks across multiple nodes, improving performance and scalability. It includes node discovery, task distribution, worker management, health monitoring, and fault tolerance mechanisms.

## Components

### 1. Models

- **DistributedProcessingConfig**: Configuration for distributed processing
- **ProcessingNode**: Information about a processing node
- **DistributedTask**: Information about a distributed task
- **NodeRole**: Enum for node roles (master, worker, hybrid)
- **NodeStatus**: Enum for node statuses (online, offline, busy, etc.)
- **TaskPriority**: Enum for task priorities (low, normal, high, critical)
- **TaskStatus**: Enum for task statuses (pending, assigned, in_progress, etc.)

### 2. Services

- **NodeDiscoveryService**: Discovers and manages processing nodes
- **TaskDistributionService**: Distributes tasks to processing nodes
- **DistributedWorkerPool**: Manages worker threads for processing tasks
- **NodeHealthMonitorService**: Monitors node health and updates status

### 3. Controllers and Routes

- **DistributedProcessingController**: Handles API requests for distributed processing
- **DistributedProcessingRoutes**: Defines API routes for distributed processing

### 4. UI Components

- **NodeStatusCard**: Displays the status of a processing node
- **TaskStatusCard**: Displays the status of a distributed task
- **NodeList**: Displays a list of processing nodes
- **TaskList**: Displays a list of distributed tasks
- **DistributedProcessingDashboard**: Dashboard for monitoring distributed processing

### 5. Frontend Service

- **DistributedProcessingService**: Service for interacting with the distributed processing API

## Features

### Node Discovery and Registration

The system supports three methods of node discovery:

1. **Manual**: Nodes are manually configured with known nodes
2. **Auto**: Nodes automatically discover other nodes on the network
3. **Registry**: Nodes register with a central registry

Nodes periodically send heartbeats to other nodes to maintain the network topology.

### Task Distribution

Tasks are distributed to nodes based on one of three load balancing strategies:

1. **Round-Robin**: Tasks are distributed evenly across nodes
2. **Least-Busy**: Tasks are assigned to the node with the fewest current tasks
3. **Capability-Based**: Tasks are assigned to nodes based on their capabilities

### Worker Management

Each node maintains a pool of worker threads for processing tasks. The number of workers is configurable and can be adjusted based on the node's capabilities.

### Health Monitoring

The system monitors the health of each node, including:

- CPU usage
- Memory usage
- Load average
- Heartbeat status

If a node's health metrics exceed configured thresholds, the node is marked as busy and will not receive new tasks until its health improves.

### Fault Tolerance

The system includes several fault tolerance mechanisms:

1. **Task Retries**: Failed tasks can be retried automatically
2. **Worker Recreation**: Failed workers are automatically recreated
3. **Node Failure Handling**: Tasks assigned to failed nodes are reassigned
4. **Task Timeouts**: Tasks that exceed their timeout are marked as failed and can be retried

## Configuration

The distributed processing system can be configured through the API or UI. Configuration options include:

- Enabling/disabling distributed processing
- Setting node role (master, worker, hybrid)
- Configuring node discovery method
- Setting heartbeat interval
- Configuring task timeout and retries
- Setting load balancing strategy
- Enabling/disabling fault tolerance

## Usage

### Starting a Node

To start a node, the application must be configured with the appropriate distributed processing settings. The node will automatically start when the application starts.

### Adding Tasks

Tasks can be added through the API or UI. Each task must specify:

- Task type
- Task input
- Task priority (optional)
- Task timeout (optional)
- Maximum retries (optional)
- Task metadata (optional)

### Monitoring

The distributed processing dashboard provides a comprehensive view of the system, including:

- Node status and health
- Task status and progress
- System configuration
- Performance metrics

## Implementation Details

### Node Discovery

The `NodeDiscoveryService` handles node discovery and registration. It maintains a list of known nodes and periodically sends heartbeats to other nodes.

### Task Distribution

The `TaskDistributionService` handles task distribution. It maintains a queue of pending tasks and assigns them to available nodes based on the configured load balancing strategy.

### Worker Management

The `DistributedWorkerPool` manages worker threads for processing tasks. It creates and manages worker threads, assigns tasks to workers, and handles worker failures.

### Health Monitoring

The `NodeHealthMonitorService` monitors node health and updates node status. It periodically checks CPU usage, memory usage, and load average, and updates node status accordingly.

## Future Improvements

1. **Security**: Add authentication and encryption for node communication
2. **Scalability**: Improve scalability by optimizing node discovery and task distribution
3. **Monitoring**: Add more detailed monitoring and alerting
4. **UI**: Enhance the UI with more detailed metrics and visualizations
5. **Task Types**: Add support for more task types and specialized workers
