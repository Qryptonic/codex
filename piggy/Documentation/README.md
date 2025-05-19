# Piggy Virtual Pet Game

## Architecture Documentation

This repository contains the source code for Piggy, an AR-enabled virtual pet guinea pig game with exceptional implementation quality across all systems.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Systems](#core-systems)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Developer Guidelines](#developer-guidelines)
- [Testing](#testing)
- [Performance](#performance)

## Overview

Piggy is a high-quality virtual pet game that allows players to care for, interact with, and form emotional bonds with their virtual guinea pig companion. The game features AR integration, sophisticated emotion systems, dynamic personality evolution, and numerous engagement features.

## Architecture

The architecture follows a component-based design with a focus on:

- **Dependency Injection** - All systems use interface-based design and constructor injection
- **Service Locator Pattern** - Core services are accessible through a service locator for controlled global access
- **Event-based Communication** - Cross-system communication is handled via a robust event system
- **Data Validation** - All system inputs and outputs are thoroughly validated
- **Resource Pooling** - Performance-optimized resource management
- **Atomic Operations** - Critical systems use atomic operations for data consistency

![Architecture Diagram](./images/architecture.png)

## Core Systems

### VirtualPetUnity

The core pet simulation system tracking pet stats and behaviors:

```csharp
public interface IVirtualPet
{
    float Hunger { get; set; }
    float Thirst { get; set; }
    float Happiness { get; set; }
    float Health { get; set; }
    
    void Feed(float amount = 25f);
    void Drink(float amount = 25f);
    void Play(float amount = 25f);
    
    event Action<string, float> OnStatsChanged;
    event Action<PetState> OnStateChanged;
}
```

### EmotionEngine

Manages pet emotions with intensity and transitions:

```csharp
public interface IEmotionEngine
{
    void SetEmotion(string emotionName, float intensity);
    string GetCurrentEmotion();
    float GetCurrentIntensity();
    event Action<string, float> OnEmotionChanged;
}
```

### SaveSystem

Handles game persistence with validation and migration:

```csharp
public interface IDataPersistence
{
    Task<bool> SaveGameAsync(GameData data);
    Task<GameData> LoadGameAsync();
    void DeleteAllSaves();
    GameData GetPetData();
}
```

### AR Integration

Augmented reality features with graceful fallbacks:

```csharp
public interface IARPlacement
{
    bool IsARAvailable();
    void UpdatePlacement(Vector3 position);
    void EnableAR(bool enable);
    event Action<bool> OnARAvailabilityChanged;
}
```

## Key Features

### Dynamic Personality System

The personality system evolves based on player interactions:

- **Trait Development** - Pet traits develop based on care patterns
- **Memory System** - Pet remembers and learns from past interactions
- **Variable Reactions** - Responses vary based on personality and mood

### Emotional Contagion

The pet responds to player emotions:

- **Facial Detection** - Optional camera-based emotion detection
- **Interaction Analysis** - Emotion inference from interaction patterns
- **Empathetic Responses** - Pet responds with matching or comforting emotions

### Progression Systems

Multiple interlocking progression systems keep players engaged:

- **Affection Meter** - Long-term bonding measurement
- **Evolution System** - Pet growth and development stages
- **Achievement System** - Accomplishment tracking and rewards

## Getting Started

### Prerequisites

- Unity 2021.3 or newer
- AR Foundation 4.2+
- iOS 14+ or Android 8.0+ (for AR features)
- .NET 6.0+

### Setup

1. Clone the repository
2. Open in Unity
3. Install required packages via Package Manager:
   - AR Foundation
   - ARKit XR Plugin (iOS) or ARCore XR Plugin (Android)
   - DOTween
   - TextMeshPro
   - Zenject (Dependency Injection)

### Configuration

The game is configured through ScriptableObjects:

- `GameConfig` - Main game balance settings
- `PersonalityConfig` - Personality trait configurations
- `EmotionConfig` - Emotion definitions and thresholds

## Developer Guidelines

### Adding New Features

1. Define interfaces for new systems
2. Implement against interfaces
3. Register with ServiceLocator or use DI
4. Add full validation and error handling
5. Implement resource pooling if needed
6. Add comprehensive unit tests

### Code Style

- Use C# 9.0+ features appropriately
- Prefer async/await for asynchronous operations
- Implement proper IDisposable pattern for resources
- Use nullable reference types with correct annotations
- Validate all inputs and handle all errors gracefully

## Testing

The project uses a comprehensive testing strategy:

### Unit Tests

- All core systems have unit tests
- Use NUnit for test framework
- Mock dependencies with NSubstitute

### Integration Tests

- Cross-system tests for dependency verification
- Event propagation validation
- Resource management verification

### Performance Tests

- CPU/GPU performance benchmarks
- Memory allocation tracking
- Load time measurements

## Performance

The game is optimized for mobile performance:

- **Object Pooling** - All frequently created objects use pooling
- **Asset Bundles** - Dynamic asset loading with memory management
- **LOD System** - Level of detail for pet models based on distance
- **Frame Budgeting** - Heavy operations are distributed across frames
- **Culling** - Appropriate use of occlusion culling
- **Shaders** - Mobile-optimized shader variants

## Accessibility

The game includes comprehensive accessibility features:

- **Text Size Options** - Adjustable UI text size
- **Color Blind Modes** - Alternative color schemes
- **Non-AR Mode** - Full functionality without AR requirements
- **Sound Design** - Audio cues to supplement visual information
- **Caption System** - Text captions for all audio content

## Internationalization

The game supports multiple languages with:

- **TextMeshPro Integration** - Full unicode support
- **Right-to-Left Support** - Proper RTL text rendering
- **Cultural Adaptation** - Region-specific content adjustments
- **Dynamic Font Switching** - Language-appropriate fonts

## Analytics

The game includes a robust analytics system:

- **Usage Metrics** - Interaction frequency and patterns
- **Progression Tracking** - Player advancement through features
- **Retention Analysis** - Session frequency and duration
- **Error Reporting** - Automatic error logging with context
- **Heat Maps** - Interaction location analysis

## Cloud Synchronization

Game data can be synchronized across devices:

- **Profile Management** - Multiple user profiles
- **Cross-Device Play** - Seamless transition between devices
- **Background Syncing** - Automatic data synchronization
- **Conflict Resolution** - Smart merging of conflicting data
- **Offline Mode** - Full functionality without internet access