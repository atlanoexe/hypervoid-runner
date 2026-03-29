import { lerp } from '../utils/math.js';

export function createPlayerRender(playerVisual) {
  let bank = 0;
  let pitch = 0.12;
  let yaw = 0;

  return {
    mesh: playerVisual.mesh,
    sync(player, world, speed, dt) {
      bank = lerp(bank, -player.motionX * 0.58, Math.min(1, dt * 8));
      pitch = lerp(
        pitch,
        0.12 + Math.min(0.18, (speed - 1) * 0.045) + player.motionY * 0.22,
        Math.min(1, dt * 4)
      );
      yaw = lerp(yaw, player.motionX * 0.14, Math.min(1, dt * 5));

      playerVisual.mesh.position.x = player.x;
      playerVisual.mesh.position.y = player.y + Math.sin(world.elapsed * 3.8) * 0.08;
      playerVisual.mesh.rotation.z = bank;
      playerVisual.mesh.rotation.y = yaw;
      playerVisual.mesh.rotation.x = pitch + Math.sin(world.elapsed * 5.2) * 0.025;

      playerVisual.shipVisual.scale.setScalar(1 + player.visualPulse * 0.05);
      playerVisual.glowCore.rotation.x = world.elapsed * 4;
      playerVisual.glowCore.rotation.y = world.elapsed * 3;
      playerVisual.glowMaterial.emissiveIntensity = 0.04 + player.visualPulse * 0.02;
      playerVisual.glowCore.scale.setScalar(0.75 + player.visualPulse * 0.08);

      for (const entry of playerVisual.emissiveMaterials) {
        entry.material.emissiveIntensity = Math.min(0.08, entry.baseIntensity + player.visualPulse * 0.015);
      }
    }
  };
}
