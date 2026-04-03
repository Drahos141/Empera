/* ============================================================
   EMPERA – game.js
   A real-time strategy game inspired by Warcraft / Age of Empires
   ============================================================ */

'use strict';

// ==================== CONSTANTS ====================
const TS = 48;           // tile size in pixels
const MW = 80;           // map width  (tiles)
const MH = 60;           // map height (tiles)
const CAM_SPEED = 6;
const EDGE_ZONE  = 20;   // px from edge to trigger edge-scroll

// Tile type IDs
const T_GRASS       = 0;
const T_TREE        = 1;
const T_GOLD        = 2;
const T_WATER       = 3;
const T_ROCK        = 4;
const T_STUMP       = 5;  // tree after chopped
const T_GOLD_EMPTY  = 6;  // mine after depleted

// Tile base colours
const TILE_COLOR = [
  '#3d6e2f', // GRASS
  '#1a4a0a', // TREE
  '#7a6010', // GOLD
  '#1a5276', // WATER
  '#6a6a6a', // ROCK
  '#5a3e28', // STUMP
  '#3a3a3a', // GOLD_EMPTY
];

// ==================== BUILDING DEFINITIONS ====================
const BDEF = {
  main_hall:   { name:'Main Hall',    size:3, maxHp:1200, cost:{gold:0,   wood:0},   buildTime:0,   popBonus:0, color:'#9b7a2a', border:'#6a4a10', trains:['worker'] },
  barracks:    { name:'Barracks',     size:2, maxHp:600,  cost:{gold:150, wood:100}, buildTime:360, popBonus:0, color:'#3a3a7a', border:'#1a1a5a', trains:['soldier','archer'] },
  farm:        { name:'Farm',         size:2, maxHp:250,  cost:{gold:80,  wood:60},  buildTime:150, popBonus:5, color:'#4a7a2a', border:'#2a5a0a', trains:[] },
  lumber_mill: { name:'Lumber Mill',  size:2, maxHp:300,  cost:{gold:100, wood:80},  buildTime:200, popBonus:0, color:'#7a4a1a', border:'#5a2a0a', trains:[] },
  tower:       { name:'Watch Tower',  size:1, maxHp:500,  cost:{gold:100, wood:80},  buildTime:200, popBonus:0, color:'#8a8a6a', border:'#5a5a3a', trains:[], range:7, damage:20, atkSpeed:60 },
};

// ==================== UNIT DEFINITIONS ====================
const UDEF = {
  worker:  { name:'Worker',  maxHp:70,  speed:2.5, cost:{gold:80,  wood:0},  trainTime:200, color:'#c8a050', size:11, damage:6,  range:1.2, atkSpeed:45, canGather:true, canBuild:true },
  soldier: { name:'Footman', maxHp:150, speed:2.0, cost:{gold:130, wood:0},  trainTime:280, color:'#4a7adf', size:12, damage:20, range:1.2, atkSpeed:40, canGather:false, canBuild:false },
  archer:  { name:'Archer',  maxHp:90,  speed:2.2, cost:{gold:100, wood:50}, trainTime:250, color:'#3aa060', size:10, damage:14, range:6.0, atkSpeed:50, canGather:false, canBuild:false },
};

// ==================== GAME STATE ====================
let canvas, ctx, mmCanvas, mmCtx;
let gameW, gameH;
let camera    = { x:0, y:0 };
let mouse     = { x:0, y:0, wx:0, wy:0, down:false, downX:0, downY:0 };
let selBox    = { active:false, x1:0, y1:0, x2:0, y2:0 };
let keys      = {};
let entities  = [];
let selectedIds = new Set();
let buildMode = null;   // null  or  { type:'barracks' }
let frame     = 0;
let resources = { gold:200, wood:150 };
let pop       = { cur:0, max:10 };
let map       = [];     // map[y][x] = tile-type
let tileHP    = {};     // "x,y" -> remaining resource amount
let notes     = [];     // floating notifications
let eid       = 0;      // entity id counter

// ==================== UTILITY ====================
const uid  = ()      => ++eid;
const tk   = (x,y)  => `${x},${y}`;
const d2   = (ax,ay,bx,by) => { const dx=ax-bx, dy=ay-by; return Math.sqrt(dx*dx+dy*dy); };
const dist = (a,b)  => d2(a.x, a.y, b.x, b.y);
const w2t  = (wx,wy) => ({ tx: Math.floor(wx/TS), ty: Math.floor(wy/TS) });
const t2w  = (tx,ty) => ({ x: tx*TS + TS/2, y: ty*TS + TS/2 });
const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));

function walkable(tx,ty) {
  if (tx<0||ty<0||tx>=MW||ty>=MH) return false;
  const t = map[ty][tx];
  return t===T_GRASS || t===T_STUMP || t===T_GOLD_EMPTY;
}

function tileOccupied(tx,ty) {
  for (const e of entities) {
    if (e.isUnit) continue;
    const s = BDEF[e.type].size;
    const ex = Math.floor(e.x/TS), ey = Math.floor(e.y/TS);
    if (tx>=ex && tx<ex+s && ty>=ey && ty<ey+s) return true;
  }
  return false;
}

function getEntity(id) { return entities.find(e=>e.id===id)||null; }

function addNote(text, wx, wy, color='#ffffff') {
  notes.push({ text, x:wx, y:wy, color, life:0, maxLife:80 });
}

// ==================== MAP GENERATION ====================
function generateMap() {
  map = Array.from({length:MH}, ()=>new Uint8Array(MW));

  // Lakes + short rivers
  const lakes = [[14,12],[50,40],[65,20],[28,50],[70,8]];
  for (const [cx,cy] of lakes) {
    const r = 3 + Math.floor(Math.random()*3);
    for (let dy=-r; dy<=r; dy++)
      for (let dx=-r; dx<=r; dx++) {
        if (dx*dx+dy*dy<=r*r) {
          const x=cx+dx, y=cy+dy;
          if (x>=0&&x<MW&&y>=0&&y<MH) map[y][x]=T_WATER;
        }
      }
    // river tail
    let rx=cx, ry=cy;
    const dir = Math.random()<0.5?1:-1;
    for (let i=0; i<8+Math.floor(Math.random()*10); i++) {
      rx += dir; ry += Math.random()<0.3?1:0;
      if (rx>=0&&rx<MW&&ry>=0&&ry<MH) {
        map[ry][rx]=T_WATER;
        if (rx+1<MW) map[ry][rx+1]=T_WATER;
      }
    }
  }

  // Forest clusters
  const forests = [[10,5],[22,8],[42,4],[60,10],[72,24],[14,42],[56,52],[34,56],[4,30],[72,46]];
  for (const [fx,fy] of forests) {
    const r = 4+Math.floor(Math.random()*5);
    for (let dy=-r; dy<=r; dy++)
      for (let dx=-r; dx<=r; dx++) {
        if (dx*dx+dy*dy<=r*r+Math.random()*4) {
          const x=fx+dx, y=fy+dy;
          if (x>=0&&x<MW&&y>=0&&y<MH && map[y][x]===T_GRASS && Math.random()<0.85)
            map[y][x]=T_TREE;
        }
      }
  }

  // Gold mines
  const golds = [[16,10],[56,14],[26,48],[68,42],[12,28],[44,7],[73,55]];
  for (const [gx,gy] of golds) {
    if (gx>=0&&gx<MW&&gy>=0&&gy<MH&&map[gy][gx]!==T_WATER) {
      // clear surrounding trees so mine is accessible
      for (let dy=-1;dy<=1;dy++)
        for (let dx=-1;dx<=1;dx++) {
          const x=gx+dx,y=gy+dy;
          if (x>=0&&x<MW&&y>=0&&y<MH&&map[y][x]===T_TREE) map[y][x]=T_GRASS;
        }
      map[gy][gx]=T_GOLD;
      tileHP[tk(gx,gy)]=800;
    }
  }

  // Scattered rocks
  for (let i=0;i<25;i++) {
    const rx=2+Math.floor(Math.random()*(MW-4));
    const ry=2+Math.floor(Math.random()*(MH-4));
    if (map[ry][rx]===T_GRASS) map[ry][rx]=T_ROCK;
  }

  // Tree HP
  for (let y=0;y<MH;y++)
    for (let x=0;x<MW;x++)
      if (map[y][x]===T_TREE) tileHP[tk(x,y)]=100+Math.floor(Math.random()*50);

  // Clear starting area (9..17, 9..17) and make sure a gold mine at (16,10)
  for (let y=7;y<18;y++)
    for (let x=7;x<18;x++)
      if (map[y][x]===T_TREE||map[y][x]===T_ROCK||map[y][x]===T_WATER)
        map[y][x]=T_GRASS;

  // Ensure start gold mine
  map[10][16]=T_GOLD;
  tileHP[tk(16,10)]=800;

  // Ensure starting forests nearby (east of start for wood)
  for (let y=8;y<16;y++)
    for (let x=20;x<25;x++)
      if (map[y][x]===T_GRASS && Math.random()<0.7) {
        map[y][x]=T_TREE;
        tileHP[tk(x,y)]=100+Math.floor(Math.random()*50);
      }
}

// ==================== A* PATHFINDING ====================
class MinHeap {
  constructor() { this.d=[]; }
  push(item,f) { this.d.push({item,f}); this._up(this.d.length-1); }
  pop() {
    const top=this.d[0].item;
    const last=this.d.pop();
    if (this.d.length) { this.d[0]=last; this._dn(0); }
    return top;
  }
  get size() { return this.d.length; }
  _up(i) {
    while (i>0) {
      const p=(i-1)>>1;
      if (this.d[p].f<=this.d[i].f) break;
      [this.d[i],this.d[p]]=[this.d[p],this.d[i]]; i=p;
    }
  }
  _dn(i) {
    const n=this.d.length;
    while(true) {
      let b=i; const l=2*i+1,r=2*i+2;
      if (l<n&&this.d[l].f<this.d[b].f) b=l;
      if (r<n&&this.d[r].f<this.d[b].f) b=r;
      if (b===i) break;
      [this.d[i],this.d[b]]=[this.d[b],this.d[i]]; i=b;
    }
  }
}

const DIRS8 = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
const COST8  = [1,1,1,1,1.414,1.414,1.414,1.414];

/**
 * A* on tile grid.
 * @param {boolean} nearTarget  – stop when adjacent to (ex,ey)
 * Returns array of world-coord waypoints (tile centres), or null.
 */
function findPath(sx,sy,ex,ey,nearTarget=false) {
  if (sx===ex && sy===ey) return [];
  const N = MW*MH;
  const gScore = new Float32Array(N).fill(Infinity);
  const fScore = new Float32Array(N).fill(Infinity);
  const parent = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);

  const ki = (x,y)=>y*MW+x;
  const h  = (x,y)=>Math.abs(x-ex)+Math.abs(y-ey);

  const startK = ki(sx,sy);
  gScore[startK]=0;
  fScore[startK]=h(sx,sy);

  const open = new MinHeap();
  open.push(startK, fScore[startK]);

  let iters=0;
  while (open.size>0 && iters++<3000) {
    const ck=open.pop();
    if (closed[ck]) continue;
    closed[ck]=1;

    const cx=ck%MW, cy=(ck/MW)|0;

    // Reached target?
    if (cx===ex && cy===ey) return reconstruct(parent,startK,ck);
    // Near enough?
    if (nearTarget && Math.abs(cx-ex)<=1 && Math.abs(cy-ey)<=1)
      return reconstruct(parent,startK,ck);

    for (let d=0;d<8;d++) {
      const nx=cx+DIRS8[d][0], ny=cy+DIRS8[d][1];
      if (nx<0||ny<0||nx>=MW||ny>=MH) continue;
      // Allow standing on target even if not walkable (for gathering)
      const passable = (nearTarget && nx===ex && ny===ey)
        ? true
        : (walkable(nx,ny) && !tileOccupied(nx,ny));
      if (!passable) continue;
      const nk=ki(nx,ny);
      if (closed[nk]) continue;
      const ng=gScore[ck]+COST8[d];
      if (ng<gScore[nk]) {
        parent[nk]=ck;
        gScore[nk]=ng;
        fScore[nk]=ng+h(nx,ny);
        open.push(nk,fScore[nk]);
      }
    }
  }
  return null;
}

function reconstruct(parent,startK,endK) {
  const path=[];
  let cur=endK;
  while (cur!==startK && parent[cur]!==-1) {
    const x=cur%MW, y=(cur/MW)|0;
    path.unshift(t2w(x,y));
    cur=parent[cur];
  }
  return path;
}

function adjWalkable(tx,ty) {
  for (const [dx,dy] of DIRS8) {
    const nx=tx+dx,ny=ty+dy;
    if (walkable(nx,ny)&&!tileOccupied(nx,ny)) return {tx:nx,ty:ny};
  }
  return null;
}

// ==================== ENTITY CREATION ====================
function makeBuilding(type,tx,ty,constructed=false) {
  const def=BDEF[type];
  const e={
    id:uid(), type, isUnit:false,
    x:tx*TS, y:ty*TS,
    hp:constructed?def.maxHp:1, maxHp:def.maxHp,
    state:constructed?'idle':'construction',
    buildProg:constructed?1:0,
    trainQueue:[], trainProg:0, lastAtk:0,
    popBonus:def.popBonus||0,
  };
  entities.push(e);
  if (e.popBonus) pop.max+=e.popBonus;
  return e;
}

function makeUnit(type,x,y) {
  const def=UDEF[type];
  const e={
    id:uid(), type, isUnit:true,
    x, y, vx:0, vy:0,
    hp:def.maxHp, maxHp:def.maxHp,
    speed:def.speed, size:def.size,
    damage:def.damage, range:def.range, atkSpeed:def.atkSpeed,
    canGather:def.canGather, canBuild:def.canBuild,
    state:'idle',
    path:[], targetTile:null, target:null, buildTarget:null,
    carryGold:0, carryWood:0,
    gatherTimer:0, atkTimer:0,
    lastResType:null,   // 'gold'|'wood' for auto-return
    angle:0,
  };
  entities.push(e);
  pop.cur++;
  return e;
}

function removeEntity(id) {
  const i=entities.findIndex(e=>e.id===id);
  if (i===-1) return;
  const e=entities[i];
  if (e.isUnit) pop.cur--;
  if (!e.isUnit&&e.popBonus) pop.max-=e.popBonus;
  entities.splice(i,1);
  selectedIds.delete(id);
}

// ==================== COMMANDS ====================
function cmdMove(unit,wx,wy) {
  const {tx,ty}=w2t(wx,wy);
  const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
  let gtx=tx, gty=ty;
  if (!walkable(gtx,gty)||tileOccupied(gtx,gty)) {
    const adj=adjWalkable(tx,ty);
    if (adj) { gtx=adj.tx; gty=adj.ty; } else { gtx=utx; gty=uty; }
  }
  const path=findPath(utx,uty,gtx,gty);
  unit.path=path||[]; unit.state=unit.path.length?'moving':'idle';
  unit.target=null; unit.targetTile=null; unit.buildTarget=null;
}

function cmdGather(worker,tx,ty) {
  const t=map[ty][tx];
  if (t!==T_TREE&&t!==T_GOLD) return;
  worker.targetTile={tx,ty};
  worker.lastResType=t===T_GOLD?'gold':'wood';
  const utx=Math.floor(worker.x/TS), uty=Math.floor(worker.y/TS);
  const path=findPath(utx,uty,tx,ty,true);
  if (path) { worker.path=path; worker.state='moving_gather'; }
  else worker.state='idle';
}

function cmdBuild(worker,bId) {
  const b=getEntity(bId); if (!b) return;
  worker.buildTarget=bId;
  const btx=Math.floor(b.x/TS), bty=Math.floor(b.y/TS);
  const adj=adjWalkable(btx,bty); if (!adj) return;
  const utx=Math.floor(worker.x/TS), uty=Math.floor(worker.y/TS);
  const path=findPath(utx,uty,adj.tx,adj.ty);
  if (path) { worker.path=path; worker.state='moving_build'; }
}

// ==================== NEAREST QUERIES ====================
function nearestHall(unit) {
  let best=null, bd=Infinity;
  for (const e of entities) {
    if (!e.isUnit&&e.type==='main_hall'&&e.state!=='construction') {
      const d=dist(unit,{x:e.x+TS*1.5, y:e.y+TS*1.5});
      if (d<bd) { bd=d; best=e; }
    }
  }
  return best;
}

function nearestResource(unit,type) {
  const tt=type==='gold'?T_GOLD:T_TREE;
  let best=null, bd=Infinity;
  for (let y=0;y<MH;y++)
    for (let x=0;x<MW;x++)
      if (map[y][x]===tt) {
        const d=d2(unit.x,unit.y,x*TS+TS/2,y*TS+TS/2);
        if (d<bd) { bd=d; best={tx:x,ty:y}; }
      }
  return best;
}

// ==================== UNIT UPDATE ====================
function followPath(unit) {
  if (!unit.path||unit.path.length===0) { unit.vx=0; unit.vy=0; return true; }
  const wp=unit.path[0];
  const dx=wp.x-unit.x, dy=wp.y-unit.y;
  const d=Math.sqrt(dx*dx+dy*dy);
  if (d<unit.speed+1) {
    unit.path.shift();
    if (!unit.path.length) { unit.vx=0; unit.vy=0; return true; }
  } else {
    unit.vx=(dx/d)*unit.speed;
    unit.vy=(dy/d)*unit.speed;
    unit.angle=Math.atan2(dy,dx);
  }
  return false;
}

function updateUnit(unit) {
  switch(unit.state) {
    case 'idle':
      unit.vx*=0.7; unit.vy*=0.7;
      break;

    case 'moving':
      if (followPath(unit)) unit.state='idle';
      break;

    case 'moving_gather': {
      const done=followPath(unit);
      if (done||!unit.path.length) {
        const tt=unit.targetTile;
        if (tt) {
          const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
          if (Math.abs(utx-tt.tx)<=1&&Math.abs(uty-tt.ty)<=1) {
            unit.state='gathering'; unit.gatherTimer=0;
          } else {
            const path=findPath(utx,uty,tt.tx,tt.ty,true);
            if (path) { unit.path=path; unit.state='moving_gather'; }
            else unit.state='idle';
          }
        } else unit.state='idle';
      }
      break;
    }

    case 'gathering': {
      unit.vx=0; unit.vy=0;
      const tt=unit.targetTile; if (!tt) { unit.state='idle'; break; }
      const tileT=map[tt.ty]&&map[tt.ty][tt.tx];
      const isGold=tileT===T_GOLD, isWood=tileT===T_TREE;
      if (!isGold&&!isWood) {
        if (unit.carryGold||unit.carryWood) { unit.state='returning'; break; }
        const nr=nearestResource(unit,unit.lastResType);
        if (nr) cmdGather(unit,nr.tx,nr.ty); else unit.state='idle';
        break;
      }
      unit.gatherTimer++;
      if (unit.gatherTimer>=40) {
        unit.gatherTimer=0;
        const key=tk(tt.tx,tt.ty);
        const rem=tileHP[key]||0;
        if (rem<=0) {
          map[tt.ty][tt.tx]=isGold?T_GOLD_EMPTY:T_STUMP;
          if (unit.carryGold||unit.carryWood) { unit.state='returning'; break; }
          const nr=nearestResource(unit,unit.lastResType);
          if (nr) cmdGather(unit,nr.tx,nr.ty); else unit.state='idle';
          break;
        }
        const g=Math.min(1,rem);
        tileHP[key]=rem-g;
        if (isGold) unit.carryGold=Math.min(10,unit.carryGold+g);
        else        unit.carryWood=Math.min(10,unit.carryWood+g);
        if ((isGold?unit.carryGold:unit.carryWood)>=10) unit.state='returning';
      }
      break;
    }

    case 'returning': {
      const hall=nearestHall(unit);
      if (!hall) { unit.state='idle'; break; }
      const hx=hall.x+TS*1.5, hy=hall.y+TS*1.5;
      if (dist(unit,{x:hx,y:hy})<TS*3) {
        resources.gold+=unit.carryGold;
        resources.wood+=unit.carryWood;
        if (unit.carryGold) addNote(`+${unit.carryGold}💰`,unit.x,unit.y,'#ffd700');
        if (unit.carryWood) addNote(`+${unit.carryWood}🪵`,unit.x,unit.y,'#c8a050');
        unit.carryGold=0; unit.carryWood=0;
        // Return to resource
        const tt=unit.targetTile;
        if (tt) {
          const t2=map[tt.ty][tt.tx];
          if (t2===T_GOLD||t2===T_TREE) cmdGather(unit,tt.tx,tt.ty);
          else {
            const nr=nearestResource(unit,unit.lastResType);
            if (nr) cmdGather(unit,nr.tx,nr.ty); else unit.state='idle';
          }
        } else unit.state='idle';
      } else {
        // Pathfind toward hall entry
        if (!unit.path||!unit.path.length) {
          const htx=Math.floor(hall.x/TS), hty=Math.floor(hall.y/TS);
          const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
          const adj=adjWalkable(htx,hty);
          if (adj) {
            const p=findPath(utx,uty,adj.tx,adj.ty);
            if (p) unit.path=p;
          }
        }
        followPath(unit);
      }
      break;
    }

    case 'moving_build': {
      if (followPath(unit)) {
        const b=getEntity(unit.buildTarget);
        unit.state=(b&&b.state==='construction')?'building':'idle';
        if (unit.state!=='building') unit.buildTarget=null;
      }
      break;
    }

    case 'building': {
      unit.vx=0; unit.vy=0;
      const b=getEntity(unit.buildTarget);
      if (!b||b.state!=='construction') { unit.state='idle'; unit.buildTarget=null; break; }
      const bx=b.x+BDEF[b.type].size*TS/2, by=b.y+BDEF[b.type].size*TS/2;
      unit.angle=Math.atan2(by-unit.y,bx-unit.x);
      break;
    }

    case 'attacking': {
      const tgt=getEntity(unit.target);
      if (!tgt||tgt.hp<=0) { unit.state='idle'; unit.target=null; break; }
      const tx2=tgt.x+(tgt.isUnit?0:BDEF[tgt.type]?BDEF[tgt.type].size*TS/2:TS/2);
      const ty2=tgt.y+(tgt.isUnit?0:BDEF[tgt.type]?BDEF[tgt.type].size*TS/2:TS/2);
      const dv=d2(unit.x,unit.y,tx2,ty2);
      const rng=unit.range*TS;
      if (dv>rng) {
        if (!unit.path||!unit.path.length) {
          const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
          const etx=Math.floor(tgt.x/TS), ety=Math.floor(tgt.y/TS);
          const p=findPath(utx,uty,etx,ety,true);
          if (p) unit.path=p;
        }
        followPath(unit);
      } else {
        unit.vx=0; unit.vy=0;
        unit.angle=Math.atan2(ty2-unit.y,tx2-unit.x);
        unit.atkTimer++;
        if (unit.atkTimer>=unit.atkSpeed) {
          unit.atkTimer=0;
          tgt.hp-=unit.damage;
          addNote(`-${unit.damage}`,tgt.x,tgt.y,'#ff6666');
          if (tgt.hp<=0) { removeEntity(tgt.id); unit.state='idle'; unit.target=null; }
        }
      }
      break;
    }
  }

  // Apply velocity
  unit.x+=unit.vx; unit.y+=unit.vy;
  unit.x=clamp(unit.x,0,MW*TS-1);
  unit.y=clamp(unit.y,0,MH*TS-1);

  // Light unit separation (avoid stacking)
  for (const o of entities) {
    if (!o.isUnit||o.id===unit.id) continue;
    const dx=unit.x-o.x, dy=unit.y-o.y;
    const dd=Math.sqrt(dx*dx+dy*dy);
    const minD=unit.size+o.size-2;
    if (dd<minD&&dd>0) {
      const push=(minD-dd)*0.3;
      unit.x+=dx/dd*push; unit.y+=dy/dd*push;
    }
  }
}

// ==================== BUILDING UPDATE ====================
function updateBuilding(b) {
  if (b.state==='construction') {
    const workers=entities.filter(e=>e.isUnit&&e.state==='building'&&e.buildTarget===b.id);
    if (workers.length) {
      b.buildProg+=workers.length/BDEF[b.type].buildTime;
      b.hp=Math.ceil(b.maxHp*b.buildProg);
    }
    if (b.buildProg>=1) {
      b.buildProg=1; b.hp=b.maxHp; b.state='idle';
      for (const w of workers) { w.state='idle'; w.buildTarget=null; }
      addNote(`${BDEF[b.type].name} complete!`,b.x+TS,b.y,'#aaffaa');
    }
    return;
  }

  // Training queue
  if (b.trainQueue.length) {
    b.state='training';
    const utype=b.trainQueue[0];
    const udef=UDEF[utype];
    b.trainProg++;
    if (b.trainProg>=udef.trainTime) {
      b.trainProg=0; b.trainQueue.shift();
      const def=BDEF[b.type];
      const spawnX=b.x+def.size*TS+TS*0.6;
      const spawnY=b.y+def.size*TS*0.5;
      const u=makeUnit(utype,spawnX,spawnY);
      addNote(`${UDEF[utype].name} ready!`,spawnX,spawnY,'#88ff88');
      if (!b.trainQueue.length) b.state='idle';
    }
  } else {
    b.state='idle';
  }

  // Tower auto-attack
  if (b.type==='tower') {
    const def=BDEF.tower;
    b.lastAtk++;
    if (b.lastAtk>=def.atkSpeed) {
      b.lastAtk=0;
      // (placeholder for enemy AI – tower does nothing without enemies)
    }
  }
}

// ==================== RENDERING ====================
const s2w = (sx,sy)=>({ x:sx+camera.x, y:sy+camera.y });
const w2s = (wx,wy)=>({ x:wx-camera.x, y:wy-camera.y });

function drawTile(tx,ty,sx,sy) {
  const t=map[ty][tx];
  ctx.fillStyle=TILE_COLOR[t]||'#3d6e2f';
  ctx.fillRect(sx,sy,TS,TS);

  switch(t) {
    case T_GRASS: {
      // subtle variation
      if ((tx+ty)%5===0) {
        ctx.fillStyle='#4a7a35';
        ctx.fillRect(sx+6,sy+6,3,3);
        ctx.fillRect(sx+18,sy+22,2,2);
      }
      break;
    }
    case T_TREE: {
      ctx.fillStyle='#3a2010';
      ctx.fillRect(sx+TS*0.38|0,sy+TS*0.52|0,TS*0.24|0,TS*0.44|0);
      ctx.fillStyle='#184808';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS*0.34,TS*0.36,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#2a6010';
      ctx.beginPath(); ctx.arc(sx+TS*0.33,sy+TS*0.38,TS*0.24,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+TS*0.67,sy+TS*0.36,TS*0.22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#38801a';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS*0.28,TS*0.2,0,Math.PI*2); ctx.fill();
      break;
    }
    case T_GOLD: {
      ctx.fillStyle='#5a4010';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#e8c030';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff088';
      for (let i=0;i<4;i++) {
        const a=i*Math.PI/2+(frame*0.015);
        ctx.beginPath();
        ctx.arc(sx+TS/2+Math.cos(a)*TS*0.16,sy+TS/2+Math.sin(a)*TS*0.16,TS*0.07,0,Math.PI*2);
        ctx.fill();
      }
      break;
    }
    case T_WATER: {
      ctx.fillStyle='#1a6b9a';
      ctx.fillRect(sx,sy,TS,TS);
      ctx.fillStyle='#2a8abf';
      const w=Math.sin((tx+ty*0.5+frame*0.018)*1.2)*3;
      ctx.fillRect(sx+5,sy+TS/2-3+w,TS-10,5);
      ctx.fillRect(sx+10,sy+TS*0.25+w,TS-20,3);
      break;
    }
    case T_ROCK: {
      ctx.fillStyle='#545454';
      ctx.beginPath(); ctx.arc(sx+TS*0.4,sy+TS*0.5,TS*0.28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#7a7a7a';
      ctx.beginPath(); ctx.arc(sx+TS*0.62,sy+TS*0.45,TS*0.22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#9a9a9a';
      ctx.beginPath(); ctx.arc(sx+TS*0.55,sy+TS*0.38,TS*0.12,0,Math.PI*2); ctx.fill();
      break;
    }
    case T_STUMP: {
      ctx.fillStyle='#5a3e20';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#3a2010'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.14,0,Math.PI*2); ctx.stroke();
      break;
    }
    case T_GOLD_EMPTY: {
      ctx.fillStyle='#2a2a2a';
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.36,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#4a4a4a'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS*0.24,0,Math.PI*2); ctx.stroke();
      break;
    }
  }
}

function drawBuilding(b) {
  const def=BDEF[b.type];
  const {x:sx,y:sy}=w2s(b.x,b.y);
  const sz=def.size*TS;
  const sel=selectedIds.has(b.id);

  if (b.state==='construction') {
    ctx.fillStyle='#22222288';
    ctx.fillRect(sx,sy,sz,sz);
    ctx.fillStyle=def.color+'88';
    ctx.fillRect(sx,sy,sz,sz*b.buildProg);
    ctx.strokeStyle='#ffee00'; ctx.lineWidth=2;
    ctx.setLineDash([5,4]);
    ctx.strokeRect(sx,sy,sz,sz);
    ctx.setLineDash([]);
    // Progress text
    ctx.fillStyle='#ffee00'; ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText(`${(b.buildProg*100)|0}%`,sx+sz/2,sy+sz/2+4);
    return;
  }

  // Body
  ctx.fillStyle=def.color;
  ctx.fillRect(sx+2,sy+2,sz-4,sz-4);
  ctx.strokeStyle=def.border||'#000'; ctx.lineWidth=2;
  ctx.strokeRect(sx+2,sy+2,sz-4,sz-4);

  // Per-type detail
  const h=sz; const w=sz;
  switch(b.type) {
    case 'main_hall': {
      // Roof triangle
      ctx.fillStyle='#c8a030';
      ctx.beginPath(); ctx.moveTo(sx+w/2,sy+4); ctx.lineTo(sx+w-4,sy+h*0.38); ctx.lineTo(sx+4,sy+h*0.38); ctx.closePath(); ctx.fill();
      // Door
      ctx.fillStyle='#3a1e08'; ctx.fillRect(sx+w*0.38,sy+h*0.52,w*0.24,h*0.44);
      // Windows
      ctx.fillStyle='#ffe87a';
      ctx.fillRect(sx+w*0.12,sy+h*0.48,w*0.16,h*0.16);
      ctx.fillRect(sx+w*0.72,sy+h*0.48,w*0.16,h*0.16);
      // Banner
      ctx.fillStyle='#cc2222';
      ctx.fillRect(sx+w*0.45,sy+2,w*0.1,h*0.3);
      break;
    }
    case 'barracks': {
      ctx.fillStyle='#2a2262';
      ctx.fillRect(sx+w*0.08,sy+h*0.08,w*0.84,h*0.42);
      ctx.fillStyle='#ffaa00';
      ctx.fillRect(sx+w*0.25,sy+h*0.12,w*0.5,h*0.06);
      ctx.fillStyle='#14143a';
      ctx.fillRect(sx+w*0.28,sy+h*0.52,w*0.44,h*0.44);
      // Weapon racks
      ctx.strokeStyle='#c0c0c0'; ctx.lineWidth=1.5;
      for (let i=0;i<3;i++) {
        const bx=sx+w*(0.15+i*0.3);
        ctx.beginPath(); ctx.moveTo(bx,sy+h*0.22); ctx.lineTo(bx+w*0.08,sy+h*0.48); ctx.stroke();
      }
      break;
    }
    case 'farm': {
      ctx.fillStyle='#8bc34a';
      ctx.fillRect(sx+w*0.04,sy+h*0.28,w*0.92,h*0.68);
      ctx.fillStyle='#4a8a0a';
      // Crop rows
      for (let i=0;i<3;i++) {
        const cy2=sy+h*(0.38+i*0.17);
        for (let j=0;j<4;j++) {
          ctx.fillRect(sx+w*(0.12+j*0.22),cy2,w*0.08,h*0.08);
        }
      }
      // Farmhouse
      ctx.fillStyle='#c8a050';
      ctx.fillRect(sx+w*0.6,sy+h*0.06,w*0.34,h*0.36);
      ctx.fillStyle='#8b2222';
      ctx.beginPath(); ctx.moveTo(sx+w*0.57,sy+h*0.06); ctx.lineTo(sx+w*0.77,sy+h*0.0); ctx.lineTo(sx+w*0.97,sy+h*0.06); ctx.closePath(); ctx.fill();
      break;
    }
    case 'lumber_mill': {
      ctx.fillStyle='#5a3810';
      ctx.fillRect(sx+w*0.08,sy+h*0.18,w*0.84,h*0.78);
      // Saw blade
      ctx.strokeStyle='#d0d0d0'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx+w*0.35,sy+h*0.5,h*0.24,0,Math.PI*2); ctx.stroke();
      // Teeth
      ctx.strokeStyle='#b0b0b0'; ctx.lineWidth=1;
      for (let i=0;i<8;i++) {
        const a=i*Math.PI/4+(frame*0.03);
        ctx.beginPath();
        ctx.moveTo(sx+w*0.35+Math.cos(a)*h*0.22,sy+h*0.5+Math.sin(a)*h*0.22);
        ctx.lineTo(sx+w*0.35+Math.cos(a)*h*0.29,sy+h*0.5+Math.sin(a)*h*0.29);
        ctx.stroke();
      }
      // Log pile
      ctx.fillStyle='#8b5a20';
      for (let i=0;i<3;i++) ctx.fillRect(sx+w*0.62,sy+h*(0.3+i*0.22),w*0.28,h*0.14);
      break;
    }
    case 'tower': {
      ctx.fillStyle='#707058'; ctx.fillRect(sx+w*0.22,sy,w*0.56,h);
      ctx.fillStyle='#505040'; ctx.fillRect(sx,sy+h*0.38,w,h*0.24);
      // Battlements
      ctx.fillStyle='#8a8a6a';
      for (let i=0;i<4;i++) ctx.fillRect(sx+w*(0.22+i*0.18),sy-h*0.09,w*0.12,h*0.14);
      // Arrow slit
      ctx.fillStyle='#1a1a1a'; ctx.fillRect(sx+w*0.42,sy+h*0.2,w*0.16,h*0.28);
      break;
    }
  }

  // Selection ring
  if (sel) {
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
    ctx.strokeRect(sx-1,sy-1,sz+2,sz+2);
  }

  // HP bar
  const hpf=b.hp/b.maxHp;
  ctx.fillStyle='#222'; ctx.fillRect(sx+2,sy-9,sz-4,5);
  ctx.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
  ctx.fillRect(sx+2,sy-9,(sz-4)*hpf,5);

  // Train progress bar
  if (b.state==='training'&&b.trainQueue.length) {
    const prog=b.trainProg/UDEF[b.trainQueue[0]].trainTime;
    ctx.fillStyle='#111'; ctx.fillRect(sx+2,sy+sz-6,sz-4,5);
    ctx.fillStyle='#4488ff'; ctx.fillRect(sx+2,sy+sz-6,(sz-4)*prog,5);
  }

  // Name label
  ctx.fillStyle='#ffffff88'; ctx.font='9px Courier New'; ctx.textAlign='center';
  ctx.fillText(def.name,sx+sz/2,sy+sz+11);
}

function drawUnit(u) {
  const {x:sx,y:sy}=w2s(u.x,u.y);
  const s=u.size;
  const sel=selectedIds.has(u.id);

  // Selection oval
  if (sel) {
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(sx,sy+2,s+5,s*0.55,0,0,Math.PI*2); ctx.stroke();
  }

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx,sy+3,s*0.7,s*0.32,0,0,Math.PI*2); ctx.fill();

  // Body
  ctx.fillStyle=UDEF[u.type].color;
  ctx.beginPath(); ctx.arc(sx,sy-s*0.25,s,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; ctx.stroke();

  // Direction dot
  ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(sx+Math.cos(u.angle)*s*0.58,sy-s*0.25+Math.sin(u.angle)*s*0.58,s*0.26,0,Math.PI*2);
  ctx.fill();

  // Carry indicators
  if (u.carryGold>0) {
    ctx.fillStyle='#ffd700';
    ctx.beginPath(); ctx.arc(sx+s*0.72,sy-s*0.85,4,0,Math.PI*2); ctx.fill();
  }
  if (u.carryWood>0) {
    ctx.fillStyle='#8b5a20';
    ctx.beginPath(); ctx.arc(sx+s*0.72,sy-s*0.52,4,0,Math.PI*2); ctx.fill();
  }

  // HP bar
  const hpf=u.hp/u.maxHp;
  if (sel||hpf<1) {
    ctx.fillStyle='#333'; ctx.fillRect(sx-s,sy-s*1.85,s*2,3);
    ctx.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
    ctx.fillRect(sx-s,sy-s*1.85,s*2*hpf,3);
  }
}

function drawArrow(x1,y1,x2,y2) {
  // Short attack arrow flash
  ctx.strokeStyle='rgba(255,120,50,0.5)'; ctx.lineWidth=1;
  ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.setLineDash([]);
}

function render() {
  ctx.clearRect(0,0,gameW,gameH);

  // Visible tile range
  const tx0=Math.max(0,Math.floor(camera.x/TS)-1);
  const ty0=Math.max(0,Math.floor(camera.y/TS)-1);
  const tx1=Math.min(MW,tx0+Math.ceil(gameW/TS)+2);
  const ty1=Math.min(MH,ty0+Math.ceil(gameH/TS)+2);

  // Background fill (for areas outside map)
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,0,gameW,gameH);

  for (let ty=ty0;ty<ty1;ty++)
    for (let tx=tx0;tx<tx1;tx++)
      drawTile(tx,ty,tx*TS-camera.x,ty*TS-camera.y);

  // Subtle grid
  ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.5;
  for (let tx=tx0;tx<=tx1;tx++) {
    const sx=tx*TS-camera.x;
    ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,gameH); ctx.stroke();
  }
  for (let ty=ty0;ty<=ty1;ty++) {
    const sy=ty*TS-camera.y;
    ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(gameW,sy); ctx.stroke();
  }

  // Buildings
  for (const e of entities) if (!e.isUnit) drawBuilding(e);

  // Units (sorted by Y for depth)
  const units=[...entities].filter(e=>e.isUnit).sort((a,b)=>a.y-b.y);
  for (const u of units) drawUnit(u);

  // Floating notifications
  for (const n of notes) {
    const {x:sx,y:sy}=w2s(n.x,n.y);
    const alpha=1-n.life/n.maxLife;
    ctx.globalAlpha=alpha;
    ctx.fillStyle=n.color; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
    ctx.fillText(n.text,sx,sy);
  }
  ctx.globalAlpha=1;

  // Build-mode preview
  if (buildMode) {
    const {tx,ty}=w2t(mouse.wx,mouse.wy);
    const def=BDEF[buildMode.type];
    const sz=def.size*TS;
    const bsx=tx*TS-camera.x, bsy=ty*TS-camera.y;
    let valid=true;
    for (let dy=0;dy<def.size&&valid;dy++)
      for (let dx=0;dx<def.size&&valid;dx++)
        if (!walkable(tx+dx,ty+dy)||tileOccupied(tx+dx,ty+dy)) valid=false;
    ctx.fillStyle=valid?'rgba(0,255,0,0.25)':'rgba(255,0,0,0.25)';
    ctx.fillRect(bsx,bsy,sz,sz);
    ctx.strokeStyle=valid?'#00ff44':'#ff4444'; ctx.lineWidth=2;
    ctx.strokeRect(bsx,bsy,sz,sz);
    ctx.fillStyle=valid?'#00ff44':'#ff4444';
    ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText(def.name,bsx+sz/2,bsy-5);
    ctx.fillText(`${def.cost.gold}💰 ${def.cost.wood}🪵`,bsx+sz/2,bsy+sz+14);
  }

  // Drag-selection box
  if (selBox.active) {
    const x=Math.min(selBox.x1,selBox.x2), y=Math.min(selBox.y1,selBox.y2);
    const w=Math.abs(selBox.x2-selBox.x1), h=Math.abs(selBox.y2-selBox.y1);
    ctx.fillStyle='rgba(0,255,136,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=1;
    ctx.setLineDash([4,4]); ctx.strokeRect(x,y,w,h); ctx.setLineDash([]);
  }

  // Map border
  const bx=-camera.x, by=-camera.y;
  ctx.strokeStyle='#000'; ctx.lineWidth=4;
  ctx.strokeRect(bx,by,MW*TS,MH*TS);

  // Minimap
  renderMinimap();
}

// ==================== MINIMAP ====================
function renderMinimap() {
  if (!mmCtx) return;
  const mw=mmCanvas.width, mh=mmCanvas.height;
  mmCtx.clearRect(0,0,mw,mh);

  // Tiles
  const scx=mw/MW, scy=mh/MH;
  for (let y=0;y<MH;y++)
    for (let x=0;x<MW;x++) {
      mmCtx.fillStyle=TILE_COLOR[map[y][x]]||'#3d6e2f';
      mmCtx.fillRect(x*scx,y*scy,scx+0.5,scy+0.5);
    }

  // Entities
  for (const e of entities) {
    if (e.isUnit) {
      mmCtx.fillStyle=UDEF[e.type].color;
      mmCtx.fillRect(e.x/TS*scx-1,e.y/TS*scy-1,3,3);
    } else {
      const def=BDEF[e.type];
      const tx=Math.floor(e.x/TS), ty=Math.floor(e.y/TS);
      mmCtx.fillStyle=def.color;
      mmCtx.fillRect(tx*scx,ty*scy,def.size*scx,def.size*scy);
    }
  }

  // Viewport rectangle
  const vpx=camera.x/TS*scx, vpy=camera.y/TS*scy;
  const vpw=gameW/TS*scx, vph=(gameH-44-130)/TS*scy;
  mmCtx.strokeStyle='#ffffff88'; mmCtx.lineWidth=1;
  mmCtx.strokeRect(vpx,vpy,vpw,vph);
}

// ==================== UI ====================
function updateUI() {
  document.getElementById('gold').textContent=Math.floor(resources.gold);
  document.getElementById('wood').textContent=Math.floor(resources.wood);
  document.getElementById('pop').textContent=`${pop.cur}/${pop.max}`;
  renderSelectionPanel();
}

function renderSelectionPanel() {
  const panel=document.getElementById('selectionPanel');
  const actions=document.getElementById('actionButtons');

  const sel=[...selectedIds].map(id=>getEntity(id)).filter(Boolean);
  if (!sel.length) {
    panel.innerHTML='<div class="no-selection">Select units or buildings<br><small>Left-click to select · Drag to box-select</small></div>';
    actions.innerHTML='';
    return;
  }

  if (sel.length===1) {
    const e=sel[0];
    if (e.isUnit) {
      const def=UDEF[e.type];
      const hpf=e.hp/e.maxHp;
      const hpColor=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
      panel.innerHTML=`
        <div class="entity-name">${def.name}</div>
        <div class="entity-hpbar"><div class="entity-hpbar-fill" style="width:${hpf*100}%;background:${hpColor}"></div></div>
        <div class="entity-stat">HP ${Math.ceil(e.hp)} / ${e.maxHp}</div>
        <div class="entity-stat">State: ${e.state.replace(/_/g,' ')}</div>
        ${e.carryGold?`<div class="entity-stat">Carrying: ${e.carryGold} 💰</div>`:''}
        ${e.carryWood?`<div class="entity-stat">Carrying: ${e.carryWood} 🪵</div>`:''}
      `;
      if (e.canBuild) {
        actions.innerHTML=buildButtons();
      } else {
        actions.innerHTML='';
      }
    } else {
      const def=BDEF[e.type];
      const hpf=e.hp/e.maxHp;
      const hpColor=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
      panel.innerHTML=`
        <div class="entity-name">${def.name}</div>
        <div class="entity-hpbar"><div class="entity-hpbar-fill" style="width:${hpf*100}%;background:${hpColor}"></div></div>
        <div class="entity-stat">HP ${Math.ceil(e.hp)} / ${e.maxHp}</div>
        <div class="entity-stat">${e.state==='construction'?`Building… ${(e.buildProg*100)|0}%`:e.state==='training'&&e.trainQueue.length?`Training: ${UDEF[e.trainQueue[0]].name}`:'Ready'}</div>
        ${e.trainQueue&&e.trainQueue.length>1?`<div class="entity-stat">Queue: ${e.trainQueue.length}</div>`:''}
      `;
      if (def.trains&&def.trains.length&&e.state!=='construction') {
        actions.innerHTML=trainButtons(e);
      } else {
        actions.innerHTML='';
      }
    }
  } else {
    const uCount=sel.filter(e=>e.isUnit).length;
    panel.innerHTML=`
      <div class="entity-name">${sel.length} selected</div>
      <div class="entity-stat">${uCount} unit${uCount!==1?'s':''}</div>
    `;
    const canBuildAny=sel.some(e=>e.isUnit&&e.canBuild);
    actions.innerHTML=canBuildAny?buildButtons():'';
  }
}

function buildButtons() {
  const defs=[
    {type:'barracks',    icon:'⚔️',  label:'Barracks'},
    {type:'farm',        icon:'🌾',  label:'Farm'},
    {type:'lumber_mill', icon:'🪵',  label:'Lumber Mill'},
    {type:'tower',       icon:'🗼',  label:'Watch Tower'},
  ];
  let html='<div class="action-group"><div class="action-label">Build:</div>';
  for (const d of defs) {
    const bdef=BDEF[d.type];
    const canAfford=resources.gold>=bdef.cost.gold&&resources.wood>=bdef.cost.wood;
    html+=`<button class="action-btn${canAfford?'':' disabled'}" onclick="clickBuildMode('${d.type}')" title="${bdef.name}: ${bdef.cost.gold}💰 ${bdef.cost.wood}🪵">
      ${d.icon} ${d.label}<small>${bdef.cost.gold}💰 ${bdef.cost.wood}🪵</small>
    </button>`;
  }
  html+='</div>';
  return html;
}

function trainButtons(building) {
  const def=BDEF[building.type];
  let html='<div class="action-group"><div class="action-label">Train:</div>';
  const icons={worker:'👷',soldier:'⚔️',archer:'🏹'};
  for (const utype of def.trains) {
    const udef=UDEF[utype];
    const canAfford=resources.gold>=udef.cost.gold&&resources.wood>=udef.cost.wood&&pop.cur<pop.max;
    html+=`<button class="action-btn${canAfford?'':' disabled'}" onclick="clickTrain(${building.id},'${utype}')" title="${udef.name}: ${udef.cost.gold}💰 ${udef.cost.wood}🪵">
      ${icons[utype]||'👤'} ${udef.name}<small>${udef.cost.gold}💰 ${udef.cost.wood}🪵</small>
    </button>`;
  }
  html+='</div>';
  return html;
}

// Called by UI buttons
function clickBuildMode(type) { buildMode={type}; }

function clickTrain(bId,utype) {
  const b=getEntity(bId); if (!b) return;
  const udef=UDEF[utype];
  if (resources.gold<udef.cost.gold||resources.wood<udef.cost.wood) {
    addNote('Not enough resources!',b.x+TS,b.y,'#ff6666'); return;
  }
  if (pop.cur>=pop.max) {
    addNote('Population cap! Build a Farm.',b.x+TS,b.y,'#ff6666'); return;
  }
  resources.gold-=udef.cost.gold;
  resources.wood-=udef.cost.wood;
  b.trainQueue.push(utype);
}

function toggleHelp() {
  document.getElementById('helpOverlay').classList.toggle('hidden');
}

// ==================== INPUT ====================
function onMouseDown(e) {
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  mouse.x=e.clientX-rect.left; mouse.y=e.clientY-rect.top;
  mouse.wx=mouse.x+camera.x;   mouse.wy=mouse.y+camera.y;

  if (e.button===0) {
    mouse.down=true; mouse.downX=mouse.x; mouse.downY=mouse.y;
    selBox.x1=mouse.x; selBox.y1=mouse.y; selBox.x2=mouse.x; selBox.y2=mouse.y;

    // Build placement
    if (buildMode) {
      const {tx,ty}=w2t(mouse.wx,mouse.wy);
      const def=BDEF[buildMode.type];
      if (resources.gold<def.cost.gold||resources.wood<def.cost.wood) {
        addNote('Not enough resources!',mouse.wx,mouse.wy,'#ff6666');
        return;
      }
      let valid=true;
      for (let dy=0;dy<def.size&&valid;dy++)
        for (let dx=0;dx<def.size&&valid;dx++)
          if (!walkable(tx+dx,ty+dy)||tileOccupied(tx+dx,ty+dy)) valid=false;
      if (!valid) { addNote('Cannot build here!',mouse.wx,mouse.wy,'#ff6666'); return; }
      resources.gold-=def.cost.gold; resources.wood-=def.cost.wood;
      const bld=makeBuilding(buildMode.type,tx,ty,false);
      // Send selected workers to build
      for (const id of selectedIds) {
        const u=getEntity(id);
        if (u&&u.isUnit&&u.canBuild) cmdBuild(u,bld.id);
      }
      buildMode=null;
      return;
    }
  } else if (e.button===2) {
    if (buildMode) { buildMode=null; return; }
    issueRightClick(mouse.wx,mouse.wy,e.shiftKey);
  }
}

function onMouseMove(e) {
  const rect=canvas.getBoundingClientRect();
  mouse.x=e.clientX-rect.left; mouse.y=e.clientY-rect.top;
  mouse.wx=mouse.x+camera.x;   mouse.wy=mouse.y+camera.y;
  if (mouse.down) {
    const dx=mouse.x-mouse.downX, dy=mouse.y-mouse.downY;
    if (Math.sqrt(dx*dx+dy*dy)>6) {
      selBox.active=true; selBox.x2=mouse.x; selBox.y2=mouse.y;
    }
  }
}

function onMouseUp(e) {
  if (e.button===0) {
    if (buildMode) { mouse.down=false; selBox.active=false; return; }
    if (selBox.active) {
      // Box-select units
      const wx1=Math.min(selBox.x1,selBox.x2)+camera.x;
      const wy1=Math.min(selBox.y1,selBox.y2)+camera.y;
      const wx2=Math.max(selBox.x1,selBox.x2)+camera.x;
      const wy2=Math.max(selBox.y1,selBox.y2)+camera.y;
      if (!e.shiftKey) selectedIds.clear();
      for (const en of entities)
        if (en.isUnit&&en.x>=wx1&&en.x<=wx2&&en.y>=wy1&&en.y<=wy2)
          selectedIds.add(en.id);
    } else {
      // Single click
      const wx=mouse.downX+camera.x, wy=mouse.downY+camera.y;
      if (!e.shiftKey) selectedIds.clear();
      let hit=null;
      // Units first
      for (const en of entities)
        if (en.isUnit&&d2(wx,wy,en.x,en.y)<=en.size+6) { hit=en; break; }
      // Buildings
      if (!hit)
        for (const en of entities) {
          if (en.isUnit) continue;
          const sz=BDEF[en.type].size*TS;
          if (wx>=en.x&&wx<=en.x+sz&&wy>=en.y&&wy<=en.y+sz) { hit=en; break; }
        }
      if (hit) {
        if (e.shiftKey&&selectedIds.has(hit.id)) selectedIds.delete(hit.id);
        else selectedIds.add(hit.id);
      }
    }
    mouse.down=false; selBox.active=false;
  }
}

function issueRightClick(wx,wy,shift) {
  const {tx,ty}=w2t(wx,wy);
  const tileT=map[ty]&&map[ty][tx];
  const units=[...selectedIds].map(id=>getEntity(id)).filter(e=>e&&e.isUnit);
  if (!units.length) return;

  // Check if right-clicked on an entity (attack target)
  let tgtEntity=null;
  for (const en of entities) {
    if (selectedIds.has(en.id)) continue;
    if (en.isUnit&&d2(wx,wy,en.x,en.y)<=en.size+6) { tgtEntity=en; break; }
    if (!en.isUnit) {
      const sz=BDEF[en.type].size*TS;
      if (wx>=en.x&&wx<=en.x+sz&&wy>=en.y&&wy<=en.y+sz) { tgtEntity=en; break; }
    }
  }

  for (const u of units) {
    if (tgtEntity) {
      u.target=tgtEntity.id; u.state='attacking'; u.path=[];
    } else if ((tileT===T_GOLD||tileT===T_TREE)&&u.canGather) {
      cmdGather(u,tx,ty);
    } else {
      // Spread units slightly
      const spread=units.length>1?30:0;
      cmdMove(u,wx+(Math.random()-0.5)*spread,wy+(Math.random()-0.5)*spread);
    }
  }
}

function onKeyDown(e) {
  keys[e.code]=true;
  if (e.code==='Escape') { buildMode=null; selectedIds.clear(); }
  if (e.code==='KeyA'&&!e.ctrlKey&&!e.metaKey) {
    // Select all visible units
    selectedIds.clear();
    for (const en of entities) {
      if (!en.isUnit) continue;
      const {x:sx,y:sy}=w2s(en.x,en.y);
      if (sx>=0&&sx<=gameW&&sy>=44&&sy<=gameH-130) selectedIds.add(en.id);
    }
  }
  if (e.code==='KeyH') {
    // Center camera on first hall
    const hall=entities.find(e=>!e.isUnit&&e.type==='main_hall');
    if (hall) { camera.x=hall.x-gameW/2+BDEF.main_hall.size*TS/2; camera.y=hall.y-(gameH-44-130)/2+BDEF.main_hall.size*TS/2; }
  }
}
function onKeyUp(e)   { delete keys[e.code]; }
function onCtxMenu(e) { e.preventDefault(); }

// Minimap click → scroll camera
function onMinimapClick(e) {
  const rect=mmCanvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  const tx=(mx/mmCanvas.width)*MW, ty=(my/mmCanvas.height)*MH;
  camera.x=clamp(tx*TS-gameW/2,0,MW*TS-gameW);
  camera.y=clamp(ty*TS-(gameH-44-130)/2,0,MH*TS-(gameH-44-130));
}

// ==================== CAMERA ====================
function updateCamera() {
  const s=CAM_SPEED;
  // Note: 'A' key selection is handled in onKeyDown; only arrow keys scroll camera here
  if (keys['ArrowLeft'])  camera.x-=s;
  if (keys['ArrowRight']) camera.x+=s;
  if (keys['ArrowUp'])    camera.y-=s;
  if (keys['ArrowDown'])  camera.y+=s;

  // Edge scrolling (only when not over UI)
  if (mouse.y>44&&mouse.y<gameH-130) {
    if (mouse.x<EDGE_ZONE)        camera.x-=s;
    if (mouse.x>gameW-EDGE_ZONE)  camera.x+=s;
    if (mouse.y<44+EDGE_ZONE)     camera.y-=s;
    if (mouse.y>gameH-130-EDGE_ZONE) camera.y+=s;
  }

  camera.x=clamp(camera.x,0,MW*TS-gameW);
  camera.y=clamp(camera.y,0,MH*TS-(gameH-44-130));
}

// ==================== GAME LOOP ====================
let lastUIUpdate=0;

function gameLoop(ts) {
  frame++;

  updateCamera();

  // Update entities
  for (const e of [...entities]) {
    if (!e) continue;
    if (e.isUnit) updateUnit(e);
    else          updateBuilding(e);
  }

  // Remove dead
  for (let i=entities.length-1;i>=0;i--) {
    const e=entities[i];
    if (e.hp<=0) {
      if (e.isUnit) pop.cur--;
      if (!e.isUnit&&e.popBonus) pop.max-=e.popBonus;
      selectedIds.delete(e.id);
      entities.splice(i,1);
    }
  }

  // Notifications
  for (let i=notes.length-1;i>=0;i--) {
    const n=notes[i];
    n.life++; n.y-=0.6;
    if (n.life>=n.maxLife) notes.splice(i,1);
  }

  render();

  // UI update at ~10 fps to avoid DOM thrashing
  if (ts-lastUIUpdate>100) { updateUI(); lastUIUpdate=ts; }

  requestAnimationFrame(gameLoop);
}

// ==================== INIT ====================
function init() {
  canvas=document.getElementById('gameCanvas');
  ctx=canvas.getContext('2d');
  mmCanvas=document.getElementById('minimap');
  mmCtx=mmCanvas.getContext('2d');

  gameW=window.innerWidth;
  gameH=window.innerHeight;
  canvas.width=gameW; canvas.height=gameH;

  generateMap();

  // Starting buildings & units
  const hall=makeBuilding('main_hall',9,9,true);

  makeUnit('worker',12*TS+TS/2,14*TS);
  makeUnit('worker',13*TS+TS/2,14*TS);
  makeUnit('worker',14*TS+TS/2,14*TS);

  // Center camera on main hall
  camera.x=clamp(9*TS - gameW/2 + BDEF.main_hall.size*TS/2,    0, MW*TS-gameW);
  camera.y=clamp(9*TS - (gameH-44-130)/2 + BDEF.main_hall.size*TS/2, 0, MH*TS-(gameH-44-130));

  // Event listeners
  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mousemove',  onMouseMove);
  canvas.addEventListener('mouseup',    onMouseUp);
  canvas.addEventListener('contextmenu',onCtxMenu);
  document.addEventListener('keydown',  onKeyDown);
  document.addEventListener('keyup',    onKeyUp);
  mmCanvas.addEventListener('click',    onMinimapClick);

  window.addEventListener('resize', ()=>{
    gameW=window.innerWidth; gameH=window.innerHeight;
    canvas.width=gameW; canvas.height=gameH;
  });

  // Show help on first load
  toggleHelp();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
