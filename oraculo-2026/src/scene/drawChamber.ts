import { fragment, vertex } from './chamberShader';
import type { Presence } from './presence';

/** One triangle, two photographic plates and a periodic density map. */
export function drawChamber(gl: WebGLRenderingContext, images: HTMLImageElement[]) {
  const program = gl.createProgram()!;
  const buffer = gl.createBuffer();
  const textures: WebGLTexture[] = [];
  const dispose = () => {
    textures.forEach(texture => gl.deleteTexture(texture));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader) ?? 'shader');
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) ?? 'program');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    images.forEach((image, i) => {
      const texture = gl.createTexture()!;
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const wrap = i === 2 ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(uniform(['chamber','portrait','vapour'][i]), i);
    });
    const [t, presence, eyes, blink, energy, angle, flash, seed, gaze] =
      ['t','presence','eyelight','blink','energy','angle','flash','boltSeed','gaze'].map(uniform);
    const vortex = uniform('vortex');
    return {
      dispose,
      frame(s: Presence, progress: number) {
        gl.uniform1f(vortex, Math.abs(progress));
        gl.uniform1f(t, s.flow);
        gl.uniform1f(presence, s.face);
        gl.uniform1f(eyes, s.eyes);
        gl.uniform1f(blink, s.blink);
        gl.uniform1f(energy, s.energy);
        gl.uniform1f(angle, s.angle);
        gl.uniform1f(flash, s.flash);
        gl.uniform1f(seed, s.seed);
        gl.uniform2f(gaze, s.x, s.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
