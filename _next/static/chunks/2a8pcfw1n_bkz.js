(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,82202,e=>{"use strict";var i,o,t,n,r=e.i(43476),a=e.i(71645),s=e.i(75056),l=e.i(30297),c=e.i(31067),d=e.i(32009),m=e.i(30353),m=m,x=e.i(98903),f=d;let p=parseInt(d.REVISION.replace(/\D+/g,"")),u=(i={cellSize:.5,sectionSize:1,fadeDistance:100,fadeStrength:1,fadeFrom:1,cellThickness:.5,sectionThickness:1,cellColor:new d.Color,sectionColor:new d.Color,infiniteGrid:!1,followCamera:!1,worldCamProjPosition:new d.Vector3,worldPlanePosition:new d.Vector3},o=`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform vec3 worldPlanePosition;
    uniform float fadeDistance;
    uniform bool infiniteGrid;
    uniform bool followCamera;

    void main() {
      localPosition = position.xzy;
      if (infiniteGrid) localPosition *= 1.0 + fadeDistance;
      
      worldPosition = modelMatrix * vec4(localPosition, 1.0);
      if (followCamera) {
        worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
        localPosition = (inverse(modelMatrix) * worldPosition).xyz;
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,t=`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      vec3 from = worldCamProjPosition*vec3(fadeFrom);
      float dist = distance(from, worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <${p>=154?"colorspace_fragment":"encodings_fragment"}>
    }
  `,(n=class extends f.ShaderMaterial{constructor(e){for(let n in super({vertexShader:o,fragmentShader:t,...e}),i)this.uniforms[n]=new f.Uniform(i[n]),Object.defineProperty(this,n,{get(){return this.uniforms[n].value},set(e){this.uniforms[n].value=e}});this.uniforms=f.UniformsUtils.clone(this.uniforms)}}).key=f.MathUtils.generateUUID(),n),g=a.forwardRef(({args:e,cellColor:i="#000000",sectionColor:o="#2080ff",cellSize:t=.5,sectionSize:n=1,followCamera:r=!1,infiniteGrid:s=!1,fadeDistance:l=100,fadeStrength:f=1,fadeFrom:p=1,cellThickness:g=.5,sectionThickness:h=1,side:j=d.BackSide,...v},k)=>{(0,m.e)({GridMaterial:u});let P=a.useRef(null);a.useImperativeHandle(k,()=>P.current,[]);let b=new d.Plane,w=new d.Vector3(0,1,0),C=new d.Vector3(0,0,0);return(0,x.f)(e=>{b.setFromNormalAndCoplanarPoint(w,C).applyMatrix4(P.current.matrixWorld);let i=P.current.material,o=i.uniforms.worldCamProjPosition,t=i.uniforms.worldPlanePosition;b.projectPoint(e.camera.position,o.value),t.value.set(0,0,0).applyMatrix4(P.current.matrixWorld)}),a.createElement("mesh",(0,c.f)({ref:P,frustumCulled:!1},v),a.createElement("gridMaterial",(0,c.f)({transparent:!0,"extensions-derivatives":!0,side:j},{cellSize:t,sectionSize:n,cellColor:i,sectionColor:o,cellThickness:g,sectionThickness:h},{fadeDistance:l,fadeStrength:f,fadeFrom:p,infiniteGrid:s,followCamera:r})),a.createElement("planeGeometry",{args:e}))});var h=e.i(92899),j=e.i(65537),v=e.i(18763),k=e.i(79007);e.s(["default",0,function(){let[e,i]=(0,a.useState)(!0),[o,t]=(0,a.useState)(!1),[n,c]=(0,a.useState)(!1),d=(0,a.useMemo)(()=>n?h.n:h.n.filter(e=>"95"!==e.area),[n]),m=(0,a.useMemo)(()=>({lines:o,text:o}),[o]);return(0,r.jsx)(v.f,{label:"Overall 3D model",height:"70vh",children:(0,r.jsxs)("div",{className:"relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-xl border border-line bg-ink-900",children:[(0,r.jsxs)(s.f,{camera:{position:[150,110,160],fov:38},shadows:!0,dpr:[1,2],children:[(0,r.jsx)("color",{attach:"background",args:["#070d10"]}),(0,r.jsx)("fog",{attach:"fog",args:["#070d10",260,520]}),(0,r.jsx)("hemisphereLight",{args:["#8fb9c9","#0a1114",.85]}),(0,r.jsx)("directionalLight",{position:[120,180,90],intensity:1.35,castShadow:!0,"shadow-mapSize":[2048,2048],"shadow-camera-left":-140,"shadow-camera-right":140,"shadow-camera-top":140,"shadow-camera-bottom":-140}),(0,r.jsx)("directionalLight",{position:[-90,60,-80],intensity:.35,color:"#5d8ea3"}),(0,r.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,-.05,0],receiveShadow:!0,children:[(0,r.jsx)("planeGeometry",{args:[900,900]}),(0,r.jsx)("meshStandardMaterial",{color:"#0a1317"})]}),(0,r.jsx)(g,{args:[400,400],cellSize:5,cellThickness:.4,cellColor:"#15252c",sectionSize:25,sectionThickness:.9,sectionColor:"#1e3a44",fadeDistance:460,position:[0,0,0]}),(0,r.jsx)(j.l,{x:0,z:0,w:h.D.w,d:h.D.d}),o&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(j.W,{position:[0,.05,h.D.zMin-7],children:`${h.D.w.toFixed(1)} m overall`}),(0,r.jsx)(j.W,{position:[h.D.xMax+9,.05,0],children:`${h.D.d.toFixed(1)} m overall`})]}),(0,r.jsx)(j.d.Provider,{value:m,children:d.map(e=>(0,r.jsxs)("group",{position:[e.x,e.y0??0,e.z],children:["tank"===e.kind&&(0,r.jsx)(k.Tank,{p:e}),"basin"===e.kind&&(0,r.jsx)(k.Basin,{p:e}),"clarifier"===e.kind&&(0,r.jsx)(k.Clarifier,{p:e}),"rack"===e.kind&&(0,r.jsx)(k.Rack,{p:e}),"rack-frame"===e.kind&&(0,r.jsx)(k.RackFrame,{p:e}),"building"===e.kind&&(0,r.jsx)(k.Building,{p:e}),"pump"===e.kind&&(0,r.jsx)(k.Pump,{p:e}),"mixer"===e.kind&&(0,r.jsx)(k.Mixer,{p:e}),"heat-exchanger"===e.kind&&(0,r.jsx)(k.HeatExchanger,{p:e}),"electrical"===e.kind&&(0,r.jsx)(k.ElectricalPanel,{p:e}),"cable-tray"===e.kind&&(0,r.jsx)(k.CableTray,{p:e}),"lightning"===e.kind&&(0,r.jsx)(k.LightningTower,{p:e}),"control-panel"===e.kind&&(0,r.jsx)(k.ControlPanel,{p:e}),"local-control-panel"===e.kind&&(0,r.jsx)(k.LocalControlPanel,{p:e}),"instrument-panel"===e.kind&&(0,r.jsx)(k.InstrumentPanel,{p:e}),"pipe-rack"===e.kind&&(0,r.jsx)(k.PipeRack,{p:e}),"pipe-frame"===e.kind&&(0,r.jsx)(k.PipeFrame,{p:e}),"insulation"===e.kind&&(0,r.jsx)(k.Insulation,{p:e}),"painting"===e.kind&&(0,r.jsx)(k.Painting,{p:e}),"pipe"===e.kind&&(0,r.jsx)(k.PipeRun,{p:e}),"valve"===e.kind&&(0,r.jsx)(k.Valve,{p:e}),"instrument"===e.kind&&(0,r.jsx)(k.Instrument,{p:e}),"motor"===e.kind&&(0,r.jsx)(k.Motor,{p:e})]},e.id))}),(0,r.jsx)(l.f,{maxPolarAngle:Math.PI/2.05,minDistance:30,maxDistance:420,target:[0,6,0],enableDamping:!0})]}),e&&(0,r.jsxs)("div",{className:"pointer-events-none absolute left-3 top-3 space-y-1.5 rounded-lg border border-line bg-ink-950/85 p-3 text-[10px]",children:[(0,r.jsx)("div",{className:"font-semibold uppercase tracking-[0.14em] text-mist-400",children:"Zones"}),[["Zone 0","Zone 0 — hazardous"],["Zone 1","Zone 1 — hazardous"],["Zone 2","Zone 2 — hazardous"],["Unclassified","Unclassified / utilities"]].map(([e,i])=>(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[(0,r.jsx)("span",{className:"inline-block h-2 w-4 rounded-sm",style:{background:h.E[e]}}),(0,r.jsx)("span",{className:"text-mist-300",children:i})]},e))]}),(0,r.jsxs)("div",{className:"absolute right-3 top-3 flex flex-wrap justify-end gap-1.5",children:[(0,r.jsx)("button",{onClick:()=>i(e=>!e),className:`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${e?"border-teal-500 bg-teal-500/15 text-teal-300":"border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`,children:"Zone overlay"}),(0,r.jsx)("button",{onClick:()=>t(e=>!e),className:`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${o?"border-amber-l bg-amber-l/15 text-amber-l":"border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`,children:"Dimensions"}),(0,r.jsx)("button",{onClick:()=>c(e=>!e),className:`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${n?"border-rust bg-rust/15 text-rust":"border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`,children:"Option 3 ZLD"})]}),(0,r.jsx)("div",{className:"pointer-events-none absolute bottom-3 left-3 text-[10px] text-mist-400",children:"Drag to orbit · scroll to zoom · grid = 5 m, heavy grid = 25 m"}),(0,r.jsxs)("div",{className:"pointer-events-none absolute bottom-3 right-3 text-[10px] text-mist-400",children:["Plot ",h.D.w.toFixed(0)," × ",h.D.d.toFixed(0)," m (",h.r.toLocaleString("en-US")," m²) ·"," ",d.length," items"]})]})})}],82202)},25281,function(e){e.n(e.i(82202))}]);