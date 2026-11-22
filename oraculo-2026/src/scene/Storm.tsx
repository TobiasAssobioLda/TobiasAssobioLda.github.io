import { useEffect, useRef, type RefObject } from 'react';
import atlasUrl from './storm-filaments.webp';

const vertex = `attribute vec2 position;
varying vec2 uv;
void main(){uv=position*vec2(.5,-.5)+.5;gl_Position=vec4(position,0.,1.);}`;

// The two photographic flow fields come from panels III and IV of ball.png.
// Trace each sheet backwards from screen space. Differential curl shears the
// core faster than the tips; the nearer sheet also spills forward over the foot.
const fragment = `precision mediump float;
varying vec2 uv;
uniform sampler2D atlas;
uniform vec2 size,origin;
uniform float diameter,p;
vec3 sheet(vec2 pos,float depth){
  float r=length(pos);
  float bloom=smoothstep(.12,.82,p);
  float scale=mix(.39,1.06,bloom)*(1.+.11*depth*bloom);
  vec2 q=pos/scale;
  q.y-=depth*.12*bloom;
  float at=mix(.50,.76,depth);
  float a=(p*p-at*at)*(5.6+depth*2.3)/(1.+1.65*r)
    +.16*sin(7.*q.y+p*8.+depth)*sin(3.14159*p);
  float c=cos(a),s=sin(a);
  q=mat2(c,-s,s,c)*q;
  q+=.021*sin(vec2(q.y*9.+p*12.,q.x*8.-p*9.)+depth*2.);
  vec2 st=vec2(.495,.52)+q*vec2(.62,.795);
  if(any(lessThan(st,vec2(0.)))||any(greaterThan(st,vec2(1.))))return vec3(0.);
  return texture2D(atlas,vec2(st.x,(clamp(st.y,.002,.998)+depth)*.5)).rgb;
}
void main(){
  vec2 pos=(uv*size-origin)/diameter;
  float front=smoothstep(.42,.81,p);
  // On narrow screens bend the escaping tips along the glass before they
  // reach the viewport edge. The fixed glass itself is never rescaled.
  pos.x*=mix(1.,max(1.,1.48*diameter/size.x),front*smoothstep(.16,.58,abs(pos.x)));
  vec3 rear=sheet(pos,0.);
  vec3 near=sheet(pos,1.);
  vec3 smoke=rear*(1.-front*.82)+near*front*1.1;
  float envelope=smoothstep(.02,.31,p)*(1.-smoothstep(.80,1.,p));
  float density=max(smoke.r,smoke.b);
  vec3 glow=min(vec3(1.),smoke*1.18);
  float alpha=max(max(glow.r,glow.b),smoothstep(.008,.7,density));
  float edge=smoothstep(0.,.095,min(uv.x,1.-uv.x))*smoothstep(0.,.045,min(uv.y,1.-uv.y));
  gl_FragColor=vec4(glow,alpha)*envelope*edge;
}`;

export type StormFrame = (progress: number) => void;

export default function Storm({frame}: {frame: RefObject<StormFrame | null>}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas=ref.current!, plate=canvas.closest('.orb-viewport')!.querySelector('.crystal-plate')!;
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true});
    if (!gl) return;
    const program=gl.createProgram()!, buffer=gl.createBuffer(), texture=gl.createTexture();
    for (const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const) {
      const shader=gl.createShader(kind)!;
      gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    let clean=false;
    const image=new Image();
    if (gl.getProgramParameter(program,gl.LINK_STATUS)) {
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const attr=gl.getAttribLocation(program,'position');
      gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      for (const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);
      for (const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,param,gl.LINEAR);
      const [size,origin,diameter,p]=['size','origin','diameter','p'].map(n=>gl.getUniformLocation(program,n));
      const draw: StormFrame = v=>{
        if (v===0 || v===1) {
          if (!clean) {gl.clear(gl.COLOR_BUFFER_BIT);canvas.style.visibility='hidden';clean=true;}
          return;
        }
        clean=false;
        const b=canvas.getBoundingClientRect(), o=plate.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const scale=Math.min(1.25,640/Math.max(b.width,b.height));
        const w=Math.round(b.width*scale),h=Math.round(b.height*scale);
        if (canvas.width!==w||canvas.height!==h) {canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        gl.uniform2f(size,b.width,b.height);
        gl.uniform2f(origin,o.x-b.x+o.width*.49,o.y-b.y+o.height*(.386+.09*v));
        gl.uniform1f(diameter,o.width*.73);gl.uniform1f(p,v);
        gl.drawArrays(gl.TRIANGLES,0,3);canvas.style.visibility='visible';
      };
      image.onload=()=>{
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        frame.current=draw;
      };
      image.src=atlasUrl;
    }
    return ()=>{
      image.onload=null;frame.current=null;
      gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);
      if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  },[frame]);
  return <canvas ref={ref} className="vision-mist" aria-hidden="true" />;
}
