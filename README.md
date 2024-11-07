# Barn Door Tracker Control System

A Node.js-based control system for a barn door tracker mount, designed for astrophotography. This system provides precise motor control to compensate for Earth's rotation during long exposure photographs of the night sky.

## Overview

The barn door tracker (also known as a Scotch mount) is a simple mechanical device that allows a camera to rotate at the same rate as Earth's rotation, enabling long-exposure astrophotography without star trails. This control system manages the precise movement required for accurate tracking.

## Features

- Precise stepper motor control with both full-step and half-step capabilities
- GPIO control for Raspberry Pi integration
- Zero-point calibration system
- Configurable exposure times
- Real-time status monitoring and logging
- Mock mode for testing without hardware
- Debug mode for development

## Hardware Requirements

- Raspberry Pi (or compatible single-board computer with GPIO)
- Stepper motor (200 or 2048 steps per revolution supported)
- Drive screw (4mm pitch)
- Limit switch for zero-point calibration
- Appropriate power supply
- Mechanical barn door mount assembly

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Configuration

Key configuration parameters can be found in various components:

- Drive screw pitch: 4mm (configured in `runstepprogram.js`)
- Motor steps: 200 or 2048 steps per revolution (configurable in `runstepprogram.js`)
- Barn door hinge offset: 150mm (configured in `runstepprogram.js`)
- GPIO pins (default configuration):
  - Input 1: GPIO 6
  - Input 2: GPIO 13
  - Input 3: GPIO 19
  - Input 4: GPIO 26
  - Zero switch: GPIO 17

## Usage

Run the program with an exposure time in minutes:

```bash
node runstepprogram.js <minutes>
```

Additional flags:

- `mock`: Run in mock mode without hardware
- `debug`: Enable debug logging

Example:

```bash
node runstepprogram.js 30      # Run for 30 minutes
node runstepprogram.js 0.5     # Run for 30 seconds
node runstepprogram.js 30 mock # Run in mock mode
```

## System Architecture

The system consists of several key components:

- **BarnDoor**: Main control interface for the barn door tracker
- **DriveScrew**: Manages the conversion between angular and linear motion
- **MotorController**: Handles motor movement and positioning
- **Stepper**: Low-level stepper motor control
- **GPIO**: Hardware interface layer
- **ZeroSwitch**: Manages position calibration
- **Programme**: Coordinates the tracking program execution

## Performance Testing

A performance testing utility is included (`testgpioperformance.js`) to evaluate:

- GPIO write speeds
- Stepper motor timing
- Sequencer efficiency
- Single vs. multi-pin operations

Run performance tests with:

```bash
node testgpioperformance.js
```

## Technical Details

### Movement Calculations

The system calculates the required movement based on:

- Earth's rotation (360° per day)
- Drive screw pitch (4mm)
- Barn door hinge offset (150mm)
- Motor step resolution (200 or 2048 steps/revolution)

### Timing Control

The system uses an adjusting interval mechanism to maintain precise timing and compensate for:

- System latency
- Processing overhead
- Motor step delays

## Development

### Mock Mode

Mock mode simulates GPIO operations for development and testing:

```bash
node runstepprogram.js <minutes> mock
```

### Debug Mode

Enable detailed logging with:

```bash
node runstepprogram.js <minutes> debug
```

## Error Handling

The system includes comprehensive error handling for:

- GPIO failures
- Motor positioning errors
- Timing drift
- Hardware communication issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License
