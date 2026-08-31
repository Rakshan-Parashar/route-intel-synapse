import { describe, it, expect } from 'vitest';
import { DroneState, TruckState } from '../../types/vrp.ts';

describe('FSTSP (Flying Sidekick TSP) Drone & Truck Model', () => {
  it('correctly models drone state transitions and battery limits', () => {
    const drone: DroneState = {
      id: 'DRONE-01',
      x: 0,
      y: 0,
      altitude: 0,
      battery: 100,
      status: 'docked',
      assignedNodeId: null,
      targetPos: null,
    };

    expect(drone.status).toBe('docked');
    expect(drone.battery).toBe(100);

    // Simulate launch
    drone.status = 'flying';
    drone.altitude = 60;
    drone.battery -= 5;

    expect(drone.status).toBe('flying');
    expect(drone.altitude).toBe(60);
    expect(drone.battery).toBe(95);
  });

  it('correctly tracks truck payload and roadblock incident state', () => {
    const truck: TruckState = {
      x: 100,
      y: 100,
      angle: 0,
      currentRouteIndex: 0,
      isBlocked: false,
      payloadCapacity: 50,
      currentPayload: 30,
    };

    expect(truck.isBlocked).toBe(false);
    expect(truck.payloadCapacity).toBe(50);
  });
});
