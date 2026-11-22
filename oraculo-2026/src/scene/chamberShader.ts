export const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * vec2(.5,-.5) + .5;
  gl_Position = vec4(position,0.,1.);
}`;

export const fragment = `
precision highp float;
varying vec2 uv;
uniform sampler2D chamber, portrait, vapour;
uniform float t, presence, eyelight, blink, energy, angle, flash, boltSeed;
uniform vec2 gaze;
uniform float vortex;
const vec2 center = vec2(.49,.385);

// Two offset advection windows: a plume never has to snap back to its origin.
vec2 current(vec2 p) {
  vec2 v = vec2(.44*sin(12.*p.y+.38*t)+.19*cos(26.*p.x-.21*t),
                -.57 + .77*sin(12.*p.x-.26*t));
  vec2 eddy = p-vec2(.42+.06*sin(.22*t),.48+.05*cos(.27*t));
  return v + vec2(-eddy.y,eddy.x)*8.*exp(-32.*dot(eddy,eddy));
}
vec3 plume(vec2 p,float weight,vec2 curl) {
  float a=fract(t*.18+p.y*.4), b=fract(a+.5);
  vec2 drift=curl*weight*.080;
  return mix(texture2D(chamber,p-(a-.5)*drift).rgb,
             texture2D(chamber,p-(b-.5)*drift).rgb,abs(2.*a-1.));
}
vec3 skin(vec2 p) {
  return texture2D(portrait,(p*vec2(1312.,1199.)-vec2(320.,110.))/vec2(672.,600.)).rgb;
}
float jag(float x,float seed) {
  float i=floor(x);
  return mix(fract(sin(i+seed)*1345.32),fract(sin(i+1.+seed)*1345.32),fract(x))-.5;
}
void main() {
  vec2 p=uv;
  vec2 sphere=(p-center)*vec2(1.,1199./1312.);
  float r=length(sphere);
  float inside=(1.-smoothstep(.314,.355,r))*(1.-smoothstep(.68,.712,p.y));
  vec3 col=texture2D(chamber,p).rgb;
  if(inside>.0001) {
    // A nearer curtain travels against the rear current and scatters its light.
    vec2 advected=sphere, field=p;
    if(vortex>0. && vortex<1.) {
      // Backtrace the twisting vapour, never the portrait or the glass reflections.
      float spin=vortex*vortex*10.0*(1.18-.95*r);
      float c=cos(spin), s=sin(spin);
      advected=mat2(c,-s,s,c)*sphere;
      field=center+advected*vec2(1.,1312./1199.);
    }
    vec2 curl=current(field);
    vec3 back=plume(p,inside,curl);
    vec3 farFog=texture2D(vapour,field*1.39+.084*curl+vec2(t*.014,-t*.021)).rgb;
    vec2 sheet=mat2(.91,-.42,.42,.91)*advected*1.85+.11*curl+.15*farFog.rb;
    vec3 fog=texture2D(vapour,sheet+vec2(-.020,.034)*t).rgb;
    float density=smoothstep(.24,.82,fog.r*.67+farFog.r*.33);
    float light=.52*farFog.r+.42*fog.g+.35*back.b;
    vec3 mist=vec3(.43,.12,.60)*light+vec3(.20,.07,.24)*farFog.g;
    vec2 q=(p-vec2(.5,.35))/(1.+.093*presence)+vec2(.5,.35);
    q.x+=presence*(.014*angle+.005*sin(.65*t)+(q.y-.35)*angle*.13);
    q.y+=presence*.006*sin(.78*t+.4);
    float region=1.-smoothstep(.72,1.,length((q-vec2(.5,.347))/vec2(.250,.230)));
    float clearing=smoothstep(.04,.72,presence-.43*density);
    vec2 eye=q-vec2(q.x<.5?.416:.597,.355);
    float side=q.x<.5?1.:-1.;
    float slope=eye.x*side*.61;
    float ey=eye.y-slope;
    float socket=1.-smoothstep(.70,1.25,length(vec2(eye.x/.054,ey/.027)));
    float lamp=smoothstep(.02,.7,eyelight-.24*density);
    vec3 face=skin(q-gaze*vec2(.0028,.0019)*socket);
    // The upper lid sweeps across the slanted socket. Sample ridge skin,
    // not a squashed iris; the lower lid only rises at the end of closure.
    float arch=max(0.,1.-pow(clamp(abs(eye.x)/.054,0.,1.),2.));
    float upper=mix(-.030,.030,blink)*(.56+.44*arch);
    float cover=(1.-smoothstep(upper-.0018,upper+.0018,ey)) * smoothstep(0.,.12,blink);
    cover=max(cover,smoothstep(.033-.014*blink,.037-.014*blink,ey)*blink);
    vec3 lid=skin(q-vec2(0.,.042+.42*ey));
    face=mix(face,lid*.77,cover*socket);
    float appear=region*mix(clearing,lamp,socket);
    back=mix(back,face,appear);
    float veil=(.07+.74*density)*(1.-.78*appear);
    back=mix(back,mist*(.80+.13*energy),veil);
    float scatter=exp(-dot(eye*vec2(12.,17.),eye*vec2(12.,17.)));
    back+=vec3(.14,.023,.21)*scatter*mist.b*lamp*(1.-blink);
    if(vortex>0. && vortex<1.) {
      // Leave the low-density lanes dark behind the exterior filaments.
      float ridge=smoothstep(.48,.92,density)*smoothstep(.04,.56,vortex);
      back+=ridge*vec3(.12,.035,.20);
    }
    if(flash>.001) {
      float a=boltSeed*6.28318;
      vec2 axis=vec2(cos(a),sin(a));
      vec2 b=vec2(dot(sphere,axis),dot(sphere,vec2(-axis.y,axis.x)));
      float s=(.335-b.x)/(.16+.10*fract(boltSeed*31.));
      float path=.037*jag(s*7.,a)+.014*jag(s*19.,a+3.)+.043*s*s*sin(a*6.);
      float d=abs(b.y-path);
      float filament=exp(-650.*d)+.26*exp(-120.*d);
      float fork=abs(b.y-path-.12*(s-.42));
      filament+=.45*exp(-750.*fork)*smoothstep(.4,.45,s)*(1.-smoothstep(.7,.84,s));
      back+=flash*(vec3(.77,.38,1.)*filament*(1.-smoothstep(.74,1.,s))
             +vec3(.41,.13,.65)*mist.b*exp(-8.*length(b-vec2(.24,0.))));
    }
    col=mix(col,back,inside);
  }
  gl_FragColor=vec4(col,1.);
}`;
