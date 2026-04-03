/* ============================================================
   EMPERA – game.js
   A real-time strategy game inspired by Warcraft / Age of Empires
   ============================================================ */

'use strict';

// ==================== CONSTANTS ====================
const TS = 48;
let MW = 80;
let MH = 60;
const CAM_SPEED = 6;
const EDGE_ZONE  = 20;

const T_GRASS      = 0;
const T_TREE       = 1;
const T_GOLD       = 2;
const T_WATER      = 3;
const T_ROCK       = 4;
const T_STUMP      = 5;
const T_GOLD_EMPTY = 6;

const TILE_COLOR = [
  '#3d6e2f','#1a4a0a','#7a6010','#1a5276','#6a6a6a','#5a3e28','#3a3a3a'
];

// ==================== DEFINITIONS ====================
const BDEF = {
  main_hall:      { name:'Main Hall',      size:3, maxHp:1200, cost:{gold:0,   wood:0},   buildTime:0,   popBonus:0,  color:'#9b7a2a', border:'#6a4a10', trains:['worker'] },
  barracks:       { name:'Barracks',       size:2, maxHp:600,  cost:{gold:150, wood:100}, buildTime:360, popBonus:0,  color:'#3a3a7a', border:'#1a1a5a', trains:['soldier','archer'] },
  farm:           { name:'Farm',           size:2, maxHp:250,  cost:{gold:80,  wood:60},  buildTime:150, popBonus:5,  color:'#4a7a2a', border:'#2a5a0a', trains:[] },
  lumber_mill:    { name:'Lumber Mill',    size:2, maxHp:300,  cost:{gold:100, wood:80},  buildTime:200, popBonus:0,  color:'#7a4a1a', border:'#5a2a0a', trains:[] },
  tower:          { name:'Watch Tower',    size:1, maxHp:500,  cost:{gold:100, wood:80},  buildTime:200, popBonus:0,  color:'#8a8a6a', border:'#5a5a3a', trains:[], range:7, damage:20, atkSpeed:60 },
  blacksmith:     { name:'Blacksmith',     size:2, maxHp:400,  cost:{gold:120, wood:80},  buildTime:240, popBonus:0,  color:'#4a3a2a', border:'#2a1a0a', trains:['knight'] },
  mage_tower:     { name:'Mage Tower',     size:2, maxHp:350,  cost:{gold:200, wood:50},  buildTime:300, popBonus:0,  color:'#4a2a6a', border:'#2a0a4a', trains:['mage'] },
  stable:         { name:'Stable',         size:2, maxHp:450,  cost:{gold:180, wood:120}, buildTime:280, popBonus:0,  color:'#7a5a30', border:'#5a3a10', trains:['cavalry'] },
  siege_workshop: { name:'Siege Workshop', size:2, maxHp:400,  cost:{gold:200, wood:150}, buildTime:320, popBonus:0,  color:'#5a5a40', border:'#3a3a20', trains:['catapult'] },
  temple:         { name:'Temple',         size:2, maxHp:380,  cost:{gold:150, wood:100}, buildTime:260, popBonus:0,  color:'#b0a060', border:'#8a7a30', trains:['priest'] },
  tavern:         { name:'Tavern',         size:2, maxHp:300,  cost:{gold:250, wood:100}, buildTime:300, popBonus:0,  color:'#8a4a2a', border:'#6a2a0a', trains:['hero'] },
};

const UDEF = {
  worker:   { name:'Worker',   maxHp:70,  speed:2.5, cost:{gold:80,  wood:0},   trainTime:200, color:'#c8a050', size:11, damage:6,  range:1.2, atkSpeed:45, armor:1, canGather:true,  canBuild:true  },
  soldier:  { name:'Footman',  maxHp:150, speed:2.0, cost:{gold:130, wood:0},   trainTime:280, color:'#4a7adf', size:12, damage:20, range:1.2, atkSpeed:40, armor:3, canGather:false, canBuild:false },
  archer:   { name:'Archer',   maxHp:90,  speed:2.2, cost:{gold:100, wood:50},  trainTime:250, color:'#3aa060', size:10, damage:14, range:6.0, atkSpeed:50, armor:1, canGather:false, canBuild:false },
  knight:   { name:'Knight',   maxHp:250, speed:1.8, cost:{gold:200, wood:0},   trainTime:350, color:'#9090c0', size:13, damage:35, range:1.2, atkSpeed:50, armor:8, canGather:false, canBuild:false },
  mage:     { name:'Mage',     maxHp:80,  speed:2.0, cost:{gold:150, wood:50},  trainTime:300, color:'#b060d0', size:10, damage:25, range:5.0, atkSpeed:60, armor:0, canGather:false, canBuild:false },
  cavalry:  { name:'Cavalry',  maxHp:220, speed:3.2, cost:{gold:180, wood:0},   trainTime:360, color:'#a08040', size:14, damage:30, range:1.2, atkSpeed:40, armor:4, canGather:false, canBuild:false },
  catapult: { name:'Catapult', maxHp:120, speed:0.9, cost:{gold:220, wood:80},  trainTime:450, color:'#707058', size:15, damage:65, range:8.0, atkSpeed:140,armor:0, canGather:false, canBuild:false },
  priest:   { name:'Priest',   maxHp:75,  speed:2.1, cost:{gold:140, wood:30},  trainTime:280, color:'#e8e8c0', size:10, damage:8,  range:4.5, atkSpeed:55, armor:0, canGather:false, canBuild:false },
  hero:     { name:'Hero',     maxHp:200, speed:2.3, cost:{gold:300, wood:50},  trainTime:500, color:'#ffd700', size:13, damage:30, range:1.5, atkSpeed:38, armor:5, canGather:false, canBuild:false, isHero:true },
  // Neutral creatures (no cost, spawned by map)
  wolf:     { name:'Wolf',     maxHp:60,  speed:2.8, cost:{gold:0,   wood:0},   trainTime:0,   color:'#909090', size:10, damage:12, range:1.1, atkSpeed:35, armor:0, canGather:false, canBuild:false },
  deer:     { name:'Deer',     maxHp:30,  speed:3.1, cost:{gold:0,   wood:0},   trainTime:0,   color:'#b08050', size:9,  damage:0,  range:0,   atkSpeed:999,armor:0, canGather:false, canBuild:false },
  treant:   { name:'Treant',   maxHp:400, speed:1.2, cost:{gold:0,   wood:0},   trainTime:0,   color:'#2a5a0a', size:17, damage:25, range:1.5, atkSpeed:70, armor:3, canGather:false, canBuild:false },
};

// XP thresholds for hero levels 1-10 (index = level-1)
const HERO_XP_THRESH = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2400, 3000];
// XP awarded per enemy kill by type
const XP_REWARD = {
  worker:20, soldier:40, archer:35, knight:70, mage:60,
  cavalry:65, catapult:80, priest:35, hero:150,
  wolf:15, deer:8, treant:100,
};

// ==================== GAME STATE ====================
let canvas, ctx, mmCanvas, mmCtx, portraitCanvas, portraitCtx;
let gameW, gameH;
let camera    = { x:0, y:0 };
let mouse     = { x:0, y:0, wx:0, wy:0, down:false, downX:0, downY:0 };
let selBox    = { active:false, x1:0, y1:0, x2:0, y2:0 };
let keys      = {};
let entities  = [];
let selectedIds = new Set();
let buildMode = null;
let rallyMode = null;   // building id currently having its rally set
let frame     = 0;
let resources = { gold:200, wood:150 };
let pop       = { cur:0, max:10 };
let map       = [];
let tileHP    = {};
let notes     = [];
let projectiles = []; // { x, y, tx, ty, speed, color, damage, owner, targetId, aoe }
let eid       = 0;
let loopRunning = false;

// UI state (used to prevent unnecessary DOM rebuilds)
let lastBuildPanelHash = '';
let lastSelPanelHash   = '';

// AI state
let aiResources      = { gold:300, wood:200 };
let aiPop            = { cur:0, max:10 };
let aiState          = 'gathering';
let aiFrame          = 0;
let aiBuildAttempted = false;

// Game phase
let gamePhase  = 'menu';
let lastConfig = null;

// Options
let showGrid     = false;
let soundEnabled = true;
let musicVolume  = 50;

// ==================== UTILITY ====================
const uid   = ()      => ++eid;
const tk    = (x,y)   => `${x},${y}`;
const d2    = (ax,ay,bx,by) => { const dx=ax-bx,dy=ay-by; return Math.sqrt(dx*dx+dy*dy); };
const dist  = (a,b)   => d2(a.x,a.y,b.x,b.y);
const w2t   = (wx,wy) => ({ tx:Math.floor(wx/TS), ty:Math.floor(wy/TS) });
const t2w   = (tx,ty) => ({ x:tx*TS+TS/2, y:ty*TS+TS/2 });
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

function walkable(tx,ty) {
  if (tx<0||ty<0||tx>=MW||ty>=MH) return false;
  const t=map[ty][tx];
  return t===T_GRASS||t===T_STUMP||t===T_GOLD_EMPTY;
}

function tileOccupied(tx,ty) {
  for (const e of entities) {
    if (e.isUnit) continue;
    const s=BDEF[e.type].size;
    const ex=Math.floor(e.x/TS), ey=Math.floor(e.y/TS);
    if (tx>=ex&&tx<ex+s&&ty>=ey&&ty<ey+s) return true;
  }
  return false;
}

function getEntity(id) { return entities.find(e=>e.id===id)||null; }

function addNote(text,wx,wy,color='#ffffff') {
  notes.push({ text, x:wx, y:wy, color, life:0, maxLife:80 });
}

// ==================== MAP GENERATION ====================
function generateMap(theme='random') {
  map   = Array.from({length:MH}, ()=>new Uint8Array(MW));
  tileHP = {};

  const isForest  = theme==='forest';
  const isIslands = theme==='islands';

  // Water bodies
  const lakeCount = isIslands ? 14 : isForest ? 3 : 5;
  for (let li=0; li<lakeCount; li++) {
    const cx = 3+Math.floor(Math.random()*(MW-6));
    const cy = 3+Math.floor(Math.random()*(MH-6));
    const r  = isIslands ? 4+Math.floor(Math.random()*5) : 3+Math.floor(Math.random()*3);
    for (let dy=-r;dy<=r;dy++)
      for (let dx=-r;dx<=r;dx++) {
        if (dx*dx+dy*dy<=r*r) {
          const x=cx+dx, y=cy+dy;
          if (x>=0&&x<MW&&y>=0&&y<MH) map[y][x]=T_WATER;
        }
      }
    // River tail
    let rx=cx, ry=cy;
    const dir=Math.random()<0.5?1:-1;
    for (let i=0;i<6+Math.floor(Math.random()*8);i++) {
      rx+=dir; ry+=Math.random()<0.3?1:0;
      if (rx>=0&&rx<MW&&ry>=0&&ry<MH) {
        map[ry][rx]=T_WATER;
        if (rx+1<MW) map[ry][rx+1]=T_WATER;
      }
    }
  }

  // Forests
  const treeDens = isForest ? 0.92 : theme==='meadows' ? 0.28 : 0.82;
  const fCount   = isForest ? 14 : theme==='meadows' ? 4 : 10;
  for (let fi=0;fi<fCount;fi++) {
    const fx=3+Math.floor(Math.random()*(MW-6));
    const fy=3+Math.floor(Math.random()*(MH-6));
    const r =4+Math.floor(Math.random()*5);
    for (let dy=-r;dy<=r;dy++)
      for (let dx=-r;dx<=r;dx++) {
        if (dx*dx+dy*dy<=r*r+Math.random()*4) {
          const x=fx+dx, y=fy+dy;
          if (x>=0&&x<MW&&y>=0&&y<MH&&map[y][x]===T_GRASS&&Math.random()<treeDens)
            map[y][x]=T_TREE;
        }
      }
  }

  // Gold mines
  const mineCount = isForest ? 4 : 7;
  let placed=0, attempts=0;
  while (placed<mineCount&&attempts<300) {
    attempts++;
    const gx=4+Math.floor(Math.random()*(MW-8));
    const gy=4+Math.floor(Math.random()*(MH-8));
    if (map[gy][gx]===T_WATER) continue;
    for (let dy=-1;dy<=1;dy++)
      for (let dx=-1;dx<=1;dx++) {
        const x=gx+dx, y=gy+dy;
        if (x>=0&&x<MW&&y>=0&&y<MH&&map[y][x]===T_TREE) map[y][x]=T_GRASS;
      }
    map[gy][gx]=T_GOLD;
    tileHP[tk(gx,gy)]=800;
    placed++;
  }

  // Rocks
  for (let i=0;i<Math.floor(MW*MH*0.004);i++) {
    const rx=2+Math.floor(Math.random()*(MW-4));
    const ry=2+Math.floor(Math.random()*(MH-4));
    if (map[ry][rx]===T_GRASS) map[ry][rx]=T_ROCK;
  }

  // Tree HP
  for (let y=0;y<MH;y++)
    for (let x=0;x<MW;x++)
      if (map[y][x]===T_TREE) tileHP[tk(x,y)]=100+Math.floor(Math.random()*50);

  // ── Player start area (top-left) ──
  const psx=7, psy=7;
  for (let y=psy;y<psy+13;y++)
    for (let x=psx;x<psx+13;x++)
      if (y<MH&&x<MW&&(map[y][x]===T_TREE||map[y][x]===T_ROCK||map[y][x]===T_WATER))
        map[y][x]=T_GRASS;
  // Player gold mine
  map[psy+3][psx+9]=T_GOLD; tileHP[tk(psx+9,psy+3)]=800;
  // Forest east of start
  for (let y=psy+1;y<psy+9;y++)
    for (let x=psx+14;x<psx+19;x++)
      if (x<MW&&y<MH&&map[y][x]===T_GRASS&&Math.random()<0.7) {
        map[y][x]=T_TREE; tileHP[tk(x,y)]=100+Math.floor(Math.random()*50);
      }

  // ── AI start area (bottom-right) ──
  const aisx=Math.max(5,MW-22), aisy=Math.max(5,MH-22);
  for (let y=aisy;y<aisy+14&&y<MH;y++)
    for (let x=aisx;x<aisx+14&&x<MW;x++)
      if (map[y][x]===T_TREE||map[y][x]===T_ROCK||map[y][x]===T_WATER)
        map[y][x]=T_GRASS;
  const aigx=Math.min(aisx+9,MW-2), aigy=Math.min(aisy+3,MH-2);
  map[aigy][aigx]=T_GOLD; tileHP[tk(aigx,aigy)]=800;
  // Forest near AI
  for (let y=aisy-2;y<aisy+6;y++)
    for (let x=aisx-6;x<aisx-1;x++)
      if (x>=0&&y>=0&&x<MW&&y<MH&&map[y][x]===T_GRASS&&Math.random()<0.7) {
        map[y][x]=T_TREE; tileHP[tk(x,y)]=100+Math.floor(Math.random()*50);
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
    while (true) {
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

function findPath(sx,sy,ex,ey,nearTarget=false) {
  if (sx===ex&&sy===ey) return [];
  const N=MW*MH;
  const gScore=new Float32Array(N).fill(Infinity);
  const fScore=new Float32Array(N).fill(Infinity);
  const parent=new Int32Array(N).fill(-1);
  const closed=new Uint8Array(N);

  const ki=(x,y)=>y*MW+x;
  const h =(x,y)=>Math.abs(x-ex)+Math.abs(y-ey);

  const startK=ki(sx,sy);
  gScore[startK]=0;
  fScore[startK]=h(sx,sy);

  const open=new MinHeap();
  open.push(startK,fScore[startK]);

  let iters=0;
  while (open.size>0&&iters++<5000) {
    const ck=open.pop();
    if (closed[ck]) continue;
    closed[ck]=1;
    const cx=ck%MW, cy=(ck/MW)|0;
    if (cx===ex&&cy===ey)                                     return smoothPath(reconstruct(parent,startK,ck));
    if (nearTarget&&Math.abs(cx-ex)<=1&&Math.abs(cy-ey)<=1)  return smoothPath(reconstruct(parent,startK,ck));

    for (let d=0;d<8;d++) {
      const nx=cx+DIRS8[d][0], ny=cy+DIRS8[d][1];
      if (nx<0||ny<0||nx>=MW||ny>=MH) continue;
      const passable=(nearTarget&&nx===ex&&ny===ey)?true:(walkable(nx,ny)&&!tileOccupied(nx,ny));
      if (!passable) continue;
      const nk=ki(nx,ny);
      if (closed[nk]) continue;
      const ng=gScore[ck]+COST8[d];
      if (ng<gScore[nk]) {
        parent[nk]=ck; gScore[nk]=ng; fScore[nk]=ng+h(nx,ny);
        open.push(nk,fScore[nk]);
      }
    }
  }
  return null;
}

function reconstruct(parent,startK,endK) {
  const path=[];
  let cur=endK;
  while (cur!==startK&&parent[cur]!==-1) {
    const x=cur%MW, y=(cur/MW)|0;
    path.unshift(t2w(x,y));
    cur=parent[cur];
  }
  return path;
}

function smoothPath(path) {
  if (!path||path.length<3) return path;
  const out=[path[0]];
  for (let i=1;i<path.length-1;i++) {
    const prev=out[out.length-1];
    const cur=path[i], next=path[i+1];
    const dx1=cur.x-prev.x, dy1=cur.y-prev.y;
    const dx2=next.x-cur.x, dy2=next.y-cur.y;
    if (Math.abs(dx1*dy2-dy1*dx2)>18) out.push(cur);
  }
  out.push(path[path.length-1]);
  return out;
}

function adjWalkable(tx,ty) {
  for (const [dx,dy] of DIRS8) {
    const nx=tx+dx, ny=ty+dy;
    if (walkable(nx,ny)&&!tileOccupied(nx,ny)) return {tx:nx,ty:ny};
  }
  return null;
}

// ==================== ENTITY CREATION ====================
function makeBuilding(type,tx,ty,constructed=false,owner='player') {
  const def=BDEF[type];
  const e={
    id:uid(), type, isUnit:false, owner,
    x:tx*TS, y:ty*TS,
    hp:constructed?def.maxHp:1, maxHp:def.maxHp,
    state:constructed?'idle':'construction',
    buildProg:constructed?1:0,
    trainQueue:[], trainProg:0, lastAtk:0,
    popBonus:def.popBonus||0,
    rallyX:null, rallyY:null,  // rally point (world coords)
  };
  entities.push(e);
  if (e.popBonus) {
    if (owner==='ai') aiPop.max+=e.popBonus;
    else pop.max+=e.popBonus;
  }
  return e;
}

function makeUnit(type,x,y,owner='player') {
  const def=UDEF[type];
  const e={
    id:uid(), type, isUnit:true, owner,
    x, y, vx:0, vy:0,
    hp:def.maxHp, maxHp:def.maxHp,
    speed:def.speed, size:def.size,
    damage:def.damage, range:def.range, atkSpeed:def.atkSpeed,
    armor:def.armor||0,
    canGather:def.canGather, canBuild:def.canBuild,
    state:'idle',
    path:[], targetTile:null, target:null, buildTarget:null,
    carryGold:0, carryWood:0,
    gatherTimer:0, atkTimer:0, healTimer:0,
    lastResType:null, angle:0,
    stuckTimer:0, lastX:x, lastY:y,
    // Hero fields
    isHero: def.isHero||false,
    xp: 0, level: 1,
    skillCooldowns:{},
  };
  entities.push(e);
  if (owner==='ai') aiPop.cur++;
  else if (owner==='player') pop.cur++;
  // neutrals don't count against any pop
  return e;
}

function removeEntity(id, killerUnit) {
  const i=entities.findIndex(e=>e.id===id);
  if (i===-1) return;
  const e=entities[i];
  if (e.isUnit) {
    if (e.owner==='ai') aiPop.cur=Math.max(0,aiPop.cur-1);
    else if (e.owner==='player') pop.cur=Math.max(0,pop.cur-1);
    // Award XP to killer hero (only player/AI heroes earn XP, not neutral creatures)
    if (killerUnit && killerUnit.isHero && killerUnit.owner!==e.owner && killerUnit.owner!=='neutral') {
      const xpGain = XP_REWARD[e.type] || 20;
      grantHeroXP(killerUnit, xpGain);
    }
  }
  if (!e.isUnit&&e.popBonus) {
    if (e.owner==='ai') aiPop.max=Math.max(0,aiPop.max-e.popBonus);
    else pop.max=Math.max(0,pop.max-e.popBonus);
  }
  entities.splice(i,1);
  selectedIds.delete(id);
}

function grantHeroXP(hero, amount) {
  hero.xp += amount;
  const maxLevel = HERO_XP_THRESH.length;
  while (hero.level < maxLevel) {
    const needed = HERO_XP_THRESH[hero.level]; // next level threshold
    if (hero.xp >= needed) {
      hero.level++;
      // Stat gains per level
      const bonusHp   = 20;
      const bonusDmg  = 3;
      const bonusArmor= 1;
      hero.maxHp   += bonusHp;
      hero.hp      = Math.min(hero.hp + bonusHp, hero.maxHp);
      hero.damage  += bonusDmg;
      hero.armor   += bonusArmor;
      addNote(`⬆ Hero Lv${hero.level}!`, hero.x, hero.y, '#ffd700');
      // Skill at levels 3, 5, 7, 10
      const skills = {3:'Battle Cry', 5:'Regeneration', 7:'Thunder Bolt', 10:'Divine Shield'};
      if (skills[hero.level]) addNote(`Skill: ${skills[hero.level]}`, hero.x, hero.y-24, '#ffaaff');
    } else break;
  }
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
  const owner=unit.owner||'player';
  let best=null, bd=Infinity;
  for (const e of entities) {
    if (!e.isUnit&&e.type==='main_hall'&&e.state!=='construction'&&(e.owner||'player')===owner) {
      const d=dist(unit,{x:e.x+TS*1.5,y:e.y+TS*1.5});
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

function dealDamage(attacker, target, dmg) {
  // Armor reduces damage; minimum 1 ensures even heavy armor can be overcome
  const actual = Math.max(1, dmg - (target.armor||0));
  target.hp -= actual;
  addNote(`-${actual}`, target.x, target.y, '#ff6666');
}

function spawnProjectile(fromX, fromY, target, speed, color, damage, attacker, aoe) {
  const tx = target.isUnit ? target.x : target.x + (BDEF[target.type]?.size||1)*TS/2;
  const ty = target.isUnit ? target.y : target.y + (BDEF[target.type]?.size||1)*TS/2;
  projectiles.push({ x:fromX, y:fromY, tx, ty, speed, color, damage,
    attacker, sourceOwner: attacker.owner||'player',
    targetId:target.id, aoe:aoe||0, life:0 });
}

function updateUnit(unit) {
  // Stuck detection
  if (unit.path&&unit.path.length>0) {
    if (Math.abs(unit.x-unit.lastX)<0.5&&Math.abs(unit.y-unit.lastY)<0.5) {
      unit.stuckTimer++;
      if (unit.stuckTimer>60) { unit.stuckTimer=0; unit.path=[]; }
    } else {
      unit.stuckTimer=0; unit.lastX=unit.x; unit.lastY=unit.y;
    }
  } else {
    unit.lastX=unit.x; unit.lastY=unit.y; unit.stuckTimer=0;
  }

  const isAI=unit.owner==='ai';
  const isNeutral=unit.owner==='neutral';

  // ── Neutral creature AI ──────────────────────────────
  if (isNeutral) {
    if (unit.type==='wolf' || unit.type==='treant') {
      if (unit.state==='idle') {
        // Wolves and treants attack nearby units of any faction
        let nearest=null, nearestD=(unit.type==='treant'?5:8)*TS;
        for (const e of entities) {
          if (e.owner==='neutral') continue;
          const ex=e.isUnit?e.x:e.x+(BDEF[e.type]?.size||1)*TS/2;
          const ey=e.isUnit?e.y:e.y+(BDEF[e.type]?.size||1)*TS/2;
          const d=d2(unit.x,unit.y,ex,ey);
          if (d<nearestD) { nearestD=d; nearest=e; }
        }
        if (nearest) { unit.target=nearest.id; unit.state='attacking'; unit.path=[]; }
      }
    } else if (unit.type==='deer') {
      if (unit.state==='idle') {
        // Deer flee from nearby units
        let nearestD=5*TS;
        let fleeDir=null;
        for (const e of entities) {
          if (e.owner==='neutral') continue;
          const d=d2(unit.x,unit.y,e.x,e.y);
          if (d<nearestD) { nearestD=d; fleeDir={dx:unit.x-e.x, dy:unit.y-e.y}; }
        }
        if (fleeDir) {
          const len=Math.sqrt(fleeDir.dx**2+fleeDir.dy**2)||1;
          const fx=unit.x+(fleeDir.dx/len)*8*TS;
          const fy=unit.y+(fleeDir.dy/len)*8*TS;
          const tx2=clamp(Math.floor(fx/TS),0,MW-1);
          const ty2=clamp(Math.floor(fy/TS),0,MH-1);
          cmdMove(unit, clamp(fx,0,MW*TS-1), clamp(fy,0,MH*TS-1));
        }
      }
    }
  }

  // ── AI military: auto-attack nearby player entities within 8 tiles ──
  if (isAI&&unit.state==='idle'&&unit.type!=='worker') {
    let nearest=null, nearestD=8*TS;
    for (const e of entities) {
      if ((e.owner||'player')==='ai') continue;
      if (e.owner==='neutral') continue;
      const cx=e.isUnit?e.x:e.x+(BDEF[e.type]?.size||1)*TS/2;
      const cy=e.isUnit?e.y:e.y+(BDEF[e.type]?.size||1)*TS/2;
      const d=d2(unit.x,unit.y,cx,cy);
      if (d<nearestD) { nearestD=d; nearest=e; }
    }
    if (nearest) { unit.target=nearest.id; unit.state='attacking'; unit.path=[]; }
  }

  // ── Priest healing ─────────────────────────────────────
  if (!isNeutral && unit.type==='priest' && unit.state==='idle') {
    unit.healTimer=(unit.healTimer||0)+1;
    if (unit.healTimer>=80) {
      unit.healTimer=0;
      let worstAlly=null, worstHp=0.95;
      for (const e of entities) {
        if (!e.isUnit||e.owner!==unit.owner) continue;
        const hpf=e.hp/e.maxHp;
        if (hpf<worstHp && d2(unit.x,unit.y,e.x,e.y)<5*TS) { worstHp=hpf; worstAlly=e; }
      }
      if (worstAlly) {
        const heal=Math.min(15, worstAlly.maxHp-worstAlly.hp);
        worstAlly.hp+=heal;
        addNote(`+${heal}`, worstAlly.x, worstAlly.y, '#88ff88');
      }
    }
  }

  // ── Hero passive skills ─────────────────────────────────
  if (unit.isHero) {
    const cd=unit.skillCooldowns;
    // L5: Regeneration – heal 1 HP/sec
    if (unit.level>=5) {
      cd.regen=(cd.regen||0)+1;
      if (cd.regen>=60 && unit.hp<unit.maxHp) { unit.hp=Math.min(unit.maxHp,unit.hp+1); cd.regen=0; }
    }
    // L3: Battle Cry – every 600 frames boost nearby allies for 1 frame (visual note)
    if (unit.level>=3) {
      cd.cry=(cd.cry||0)+1;
      if (cd.cry>=600) {
        cd.cry=0;
        addNote('⚔ Battle Cry!', unit.x, unit.y-16, '#ff8800');
        for (const e of entities) {
          if (!e.isUnit||e.owner!==unit.owner) continue;
          if (d2(unit.x,unit.y,e.x,e.y)<6*TS) {
            // Temporary +8 damage (applied as bonus here, just visual)
            addNote('↑ATK', e.x, e.y, '#ffaa44');
          }
        }
      }
    }
    // L10: Divine Shield – once per 1800 frames, when HP < 30%, become invulnerable for 180 frames
    if (unit.level>=10) {
      if (!cd.shieldActive) {
        cd.shieldCd=(cd.shieldCd||0)+1;
        if (unit.hp/unit.maxHp<0.3 && cd.shieldCd>1800) {
          cd.shieldCd=0; cd.shieldActive=180;
          addNote('🛡 Divine Shield!', unit.x, unit.y-16, '#aaddff');
        }
      } else {
        cd.shieldActive--;
        if (cd.shieldActive<=0) delete cd.shieldActive;
      }
    }
  }

  switch (unit.state) {
    case 'idle':
      unit.vx*=0.7; unit.vy*=0.7;
      break;

    case 'moving':
      if (followPath(unit)) unit.state='idle';
      break;

    case 'patrolling': {
      if (!unit.patrolA||!unit.patrolB) { unit.state='idle'; break; }
      const dest=unit.patrolTarget===1?unit.patrolB:unit.patrolA;
      if (!unit.path||!unit.path.length) {
        const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
        const dtx=Math.floor(dest.x/TS), dty=Math.floor(dest.y/TS);
        const p=findPath(utx,uty,dtx,dty);
        if (p) unit.path=p; else { unit.state='idle'; break; }
      }
      if (followPath(unit)) { unit.patrolTarget = unit.patrolTarget===1?2:1; }
      // Attack enemies on patrol
      let nearestEnemy=null, nearestD=4*TS;
      for (const e of entities) {
        if (!isNeutral && e.owner===unit.owner) continue;
        if (isNeutral && e.owner==='neutral') continue;
        const ex=e.isUnit?e.x:e.x+(BDEF[e.type]?.size||1)*TS/2;
        const ey=e.isUnit?e.y:e.y+(BDEF[e.type]?.size||1)*TS/2;
        const d=d2(unit.x,unit.y,ex,ey);
        if (d<nearestD) { nearestD=d; nearestEnemy=e; }
      }
      if (nearestEnemy) { unit.patrolInterrupt={x:unit.x,y:unit.y}; unit.target=nearestEnemy.id; unit.state='attacking'; }
      break;
    }

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
            if (path) { unit.path=path; unit.state='moving_gather'; } else unit.state='idle';
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
        if (isAI) {
          aiResources.gold+=unit.carryGold;
          aiResources.wood+=unit.carryWood;
        } else {
          resources.gold+=unit.carryGold;
          resources.wood+=unit.carryWood;
          if (unit.carryGold) addNote(`+${unit.carryGold}\u{1F4B0}`,unit.x,unit.y,'#ffd700');
          if (unit.carryWood) addNote(`+${unit.carryWood}\u{1FAB5}`,unit.x,unit.y,'#c8a050');
        }
        unit.carryGold=0; unit.carryWood=0;
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
        if (!unit.path||!unit.path.length) {
          const htx=Math.floor(hall.x/TS), hty=Math.floor(hall.y/TS);
          const utx=Math.floor(unit.x/TS), uty=Math.floor(unit.y/TS);
          const adj=adjWalkable(htx,hty);
          if (adj) { const p=findPath(utx,uty,adj.tx,adj.ty); if (p) unit.path=p; }
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
      // Divine Shield: immune to damage
      if (unit.isHero && unit.skillCooldowns?.shieldActive>0) {
        unit.state='idle'; unit.target=null; break;
      }
      const tgt=getEntity(unit.target);
      if (!tgt||tgt.hp<=0) {
        unit.state='idle'; unit.target=null;
        // Return to patrol if interrupted
        if (unit.patrolInterrupt) { cmdMove(unit,unit.patrolInterrupt.x,unit.patrolInterrupt.y); unit.state='patrolling'; unit.patrolInterrupt=null; }
        break;
      }
      const tx2=tgt.x+(tgt.isUnit?0:(BDEF[tgt.type]?.size||1)*TS/2);
      const ty2=tgt.y+(tgt.isUnit?0:(BDEF[tgt.type]?.size||1)*TS/2);
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
          // Ranged units (archer, mage, priest, catapult) spawn projectile
          const useProjectile = unit.range>2.5;
          if (useProjectile) {
            const pColor = unit.type==='archer'?'#c8b080':unit.type==='mage'?'#cc66ff':unit.type==='priest'?'#ffffff':'#ff8800';
            const aoe = unit.type==='catapult'?2.0:0;
            spawnProjectile(unit.x, unit.y-unit.size*0.3, tgt, 6, pColor, unit.damage, unit, aoe);
          } else {
            // Shield check for target hero
            if (!(tgt.isHero && tgt.skillCooldowns?.shieldActive>0)) {
              dealDamage(unit, tgt, unit.damage);
              if (tgt.hp<=0) { removeEntity(tgt.id, unit); unit.state='idle'; unit.target=null; }
            }
          }
        }
      }
      break;
    }
  }

  unit.x+=unit.vx; unit.y+=unit.vy;
  unit.x=clamp(unit.x,0,MW*TS-1);
  unit.y=clamp(unit.y,0,MH*TS-1);

  // Unit separation
  for (const o of entities) {
    if (!o.isUnit||o.id===unit.id) continue;
    const dx=unit.x-o.x, dy=unit.y-o.y;
    const dd=Math.sqrt(dx*dx+dy*dy);
    const minD=unit.size+o.size-2;
    if (dd<minD&&dd>0) { const push=(minD-dd)*0.3; unit.x+=dx/dd*push; unit.y+=dy/dd*push; }
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
      const owner=b.owner||'player';
      // Check pop cap
      const curPop=owner==='ai'?aiPop.cur:pop.cur;
      const maxPop=owner==='ai'?aiPop.max:pop.max;
      if (curPop<maxPop) {
        const u=makeUnit(utype,spawnX,spawnY,owner);
        if (owner==='player') addNote(`${UDEF[utype].name} ready!`,spawnX,spawnY,'#88ff88');
        // Send to rally point if set
        if (b.rallyX!==null && u) {
          cmdMove(u, b.rallyX, b.rallyY);
        }
      }
      if (!b.trainQueue.length) b.state='idle';
    }
  } else {
    b.state='idle';
  }

  // Tower auto-attack enemies (shoots projectile)
  if (b.type==='tower') {
    const def=BDEF.tower;
    b.lastAtk++;
    if (b.lastAtk>=def.atkSpeed) {
      b.lastAtk=0;
      const bOwner=b.owner||'player';
      const range=def.range*TS;
      const cx=b.x+TS/2, cy=b.y+TS/2;
      let nearest=null, nearestD=range;
      for (const e of entities) {
        if ((e.owner||'player')===bOwner) continue;
        if (e.owner==='neutral') continue;
        const ex=e.isUnit?e.x:e.x+(BDEF[e.type]?.size||1)*TS/2;
        const ey=e.isUnit?e.y:e.y+(BDEF[e.type]?.size||1)*TS/2;
        const d=d2(cx,cy,ex,ey);
        if (d<nearestD) { nearestD=d; nearest=e; }
      }
      if (nearest) {
        // Tower fires an arrow projectile
        spawnProjectile(cx, cy, nearest, 7, '#ffd700', def.damage, {owner:bOwner, damage:def.damage, isHero:false}, 0);
      }
    }
  }
}

// ==================== PROJECTILE UPDATE ====================
function updateProjectiles() {
  for (let i=projectiles.length-1;i>=0;i--) {
    const p=projectiles[i];
    const dx=p.tx-p.x, dy=p.ty-p.y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if (d<p.speed+2) {
      // Hit!
      if (p.aoe>0) {
        // AOE splash (catapult)
        const aoePx = p.aoe*TS;
        for (const e of [...entities]) {
          if (!e.isUnit) continue;
          if (e.owner===p.sourceOwner) continue;
          if (d2(p.tx,p.ty,e.x,e.y)<aoePx) {
            if (!(e.isHero && e.skillCooldowns?.shieldActive>0)) {
              dealDamage(p.attacker, e, Math.round(p.damage*(0.5+0.5*(1-d2(p.tx,p.ty,e.x,e.y)/aoePx))));
              if (e.hp<=0) removeEntity(e.id, p.attacker);
            }
          }
        }
      } else {
        // Single target
        const tgt=getEntity(p.targetId);
        if (tgt && tgt.hp>0) {
          if (!(tgt.isHero && tgt.skillCooldowns?.shieldActive>0)) {
            dealDamage(p.attacker, tgt, p.damage);
            if (tgt.hp<=0) removeEntity(tgt.id, p.attacker);
          }
        }
      }
      projectiles.splice(i,1);
      continue;
    }
    p.x+=dx/d*p.speed;
    p.y+=dy/d*p.speed;
    p.life++;
    // Remove stale projectiles
    if (p.life>300) { projectiles.splice(i,1); continue; }
    // Update target position (tracking)
    const tgt2=getEntity(p.targetId);
    if (tgt2 && tgt2.isUnit) { p.tx=tgt2.x; p.ty=tgt2.y; }
  }
}

// ==================== AI SYSTEM ====================
function updateAI() {
  if (gamePhase!=='playing') return;
  aiFrame++;

  const aiWorkers  = entities.filter(e=>e.isUnit&&e.owner==='ai'&&e.type==='worker');
  const aiMilitary = entities.filter(e=>e.isUnit&&e.owner==='ai'&&e.type!=='worker');
  const aiHall     = entities.find(e=>!e.isUnit&&e.owner==='ai'&&e.type==='main_hall');
  const aiBarracks = entities.find(e=>!e.isUnit&&e.owner==='ai'&&e.type==='barracks'&&e.state!=='construction');

  // Keep workers gathering
  for (const w of aiWorkers) {
    if (w.state==='idle') {
      if (aiResources.gold<600) {
        const g=nearestResource(w,'gold');
        if (g) { cmdGather(w,g.tx,g.ty); continue; }
      }
      const t=nearestResource(w,'wood');
      if (t) cmdGather(w,t.tx,t.ty);
    }
  }

  // AI tries to build barracks + farm when able
  function aiBuildNear(btype, cost) {
    if (!aiHall) return false;
    const hallTx=Math.floor(aiHall.x/TS), hallTy=Math.floor(aiHall.y/TS);
    for (let r=4;r<=12;r++) {
      for (let dy=-r;dy<=r;dy++) {
        for (let dx=-r;dx<=r;dx++) {
          const tx=hallTx+dx, ty=hallTy+dy;
          if (tx<1||ty<1||tx>=MW-3||ty>=MH-3) continue;
          let valid=true;
          const sz=BDEF[btype].size;
          for (let oy=0;oy<sz&&valid;oy++)
            for (let ox=0;ox<sz&&valid;ox++)
              if (!walkable(tx+ox,ty+oy)||tileOccupied(tx+ox,ty+oy)) valid=false;
          if (valid) {
            aiResources.gold-=cost.gold; aiResources.wood-=cost.wood;
            const bld=makeBuilding(btype,tx,ty,false,'ai');
            if (aiWorkers.length>0) cmdBuild(aiWorkers[0],bld.id);
            return true;
          }
        }
      }
    }
    return false;
  }

  // Build barracks once
  const hasBarracks=entities.some(e=>!e.isUnit&&e.owner==='ai'&&e.type==='barracks');
  if (!hasBarracks&&!aiBuildAttempted&&aiResources.gold>=150&&aiResources.wood>=100) {
    if (aiBuildNear('barracks',{gold:150,wood:100})) aiBuildAttempted=true;
    else aiBuildAttempted=true;
  }

  // Build farm when pop is near cap
  const hasFarm=entities.some(e=>!e.isUnit&&e.owner==='ai'&&e.type==='farm');
  if (!hasFarm&&aiPop.cur>=aiPop.max-2&&aiResources.gold>=80&&aiResources.wood>=60) {
    aiBuildNear('farm',{gold:80,wood:60});
  }

  // Train units every 600 frames at barracks
  if (aiBarracks&&aiFrame%600===0&&aiResources.gold>=130&&aiPop.cur<aiPop.max) {
    aiResources.gold-=130;
    aiBarracks.trainQueue.push('soldier');
  }

  // Attack when strong enough (5+ units and 1800+ frames)
  if (aiMilitary.length>=5&&aiFrame>=1800) {
    const playerHall=entities.find(e=>!e.isUnit&&e.type==='main_hall'&&(e.owner||'player')==='player');
    if (playerHall) {
      for (const u of aiMilitary) {
        if (u.state==='idle') {
          u.target=playerHall.id; u.state='attacking'; u.path=[];
        }
      }
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
      // Pixel clusters for variation
      if ((tx*3+ty*7)%11===0) {
        ctx.fillStyle='#4a7a35';
        ctx.fillRect(sx+5,sy+7,3,3);
        ctx.fillRect(sx+22,sy+20,2,2);
        ctx.fillRect(sx+35,sy+10,2,2);
      }
      if ((tx*5+ty*3)%13===0) {
        ctx.fillStyle='#2d5c24';
        ctx.fillRect(sx+14,sy+30,3,2);
        ctx.fillRect(sx+38,sy+36,2,2);
      }
      // Tiny flowers
      if ((tx*7+ty*11)%17===0) {
        ctx.fillStyle='#ffe070';
        ctx.fillRect(sx+10,sy+14,2,2);
      }
      if ((tx*11+ty*5)%19===0) {
        ctx.fillStyle='#ff80a0';
        ctx.fillRect(sx+30,sy+28,2,2);
      }
      break;
    }
    case T_TREE: {
      // Trunk
      ctx.fillStyle='#3a2010';
      ctx.fillRect(sx+TS*0.38|0, sy+TS*0.54|0, TS*0.24|0, TS*0.44|0);
      // Foliage layers
      ctx.fillStyle='#184808';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS*0.34, TS*0.36, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#236010';
      ctx.beginPath(); ctx.arc(sx+TS*0.32, sy+TS*0.40, TS*0.23, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+TS*0.68, sy+TS*0.37, TS*0.21, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#307818';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS*0.24, TS*0.22, 0, Math.PI*2); ctx.fill();
      // Highlight top
      ctx.fillStyle='#48941e';
      ctx.beginPath(); ctx.arc(sx+TS*0.46, sy+TS*0.18, TS*0.1, 0, Math.PI*2); ctx.fill();
      break;
    }
    case T_GOLD: {
      // Rock base
      ctx.fillStyle='#5a4010';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.4, 0, Math.PI*2); ctx.fill();
      // Gold nugget
      ctx.fillStyle='#d4a820';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.28, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffe840';
      ctx.beginPath(); ctx.arc(sx+TS*0.44, sy+TS*0.42, TS*0.12, 0, Math.PI*2); ctx.fill();
      // Sparkling star points
      ctx.fillStyle='#fff8a0';
      const sa=frame*0.022;
      for (let i=0;i<4;i++) {
        const a=i*Math.PI/2+sa;
        const r1=TS*0.32, r2=TS*0.14;
        ctx.beginPath();
        ctx.arc(sx+TS/2+Math.cos(a)*r1, sy+TS/2+Math.sin(a)*r1, TS*0.06, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx+TS/2+Math.cos(a+Math.PI/4)*r2, sy+TS/2+Math.sin(a+Math.PI/4)*r2, TS*0.04, 0, Math.PI*2);
        ctx.fill();
      }
      break;
    }
    case T_WATER: {
      ctx.fillStyle='#1a6b9a';
      ctx.fillRect(sx,sy,TS,TS);
      // Animated wave highlights
      const wt=(tx*1.3+ty*0.7+frame*0.018);
      const w1=Math.sin(wt*1.2)*3;
      const w2=Math.sin(wt*0.8+1)*2;
      ctx.fillStyle='rgba(60,160,220,0.45)';
      ctx.fillRect(sx+4, sy+TS/2-3+w1, TS-8, 4);
      ctx.fillStyle='rgba(100,190,240,0.3)';
      ctx.fillRect(sx+9, sy+TS*0.25+w2, TS-18, 3);
      ctx.fillRect(sx+6, sy+TS*0.72+w1*0.5, TS-12, 2);
      break;
    }
    case T_ROCK: {
      // Irregular polygon rock
      ctx.fillStyle='#505050';
      ctx.beginPath();
      ctx.moveTo(sx+TS*0.22, sy+TS*0.62);
      ctx.lineTo(sx+TS*0.12, sy+TS*0.44);
      ctx.lineTo(sx+TS*0.28, sy+TS*0.26);
      ctx.lineTo(sx+TS*0.52, sy+TS*0.22);
      ctx.lineTo(sx+TS*0.74, sy+TS*0.32);
      ctx.lineTo(sx+TS*0.82, sy+TS*0.54);
      ctx.lineTo(sx+TS*0.68, sy+TS*0.70);
      ctx.lineTo(sx+TS*0.38, sy+TS*0.76);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='#787878';
      ctx.beginPath(); ctx.arc(sx+TS*0.48, sy+TS*0.38, TS*0.14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#929292';
      ctx.beginPath(); ctx.arc(sx+TS*0.42, sy+TS*0.32, TS*0.07, 0, Math.PI*2); ctx.fill();
      break;
    }
    case T_STUMP: {
      ctx.fillStyle='#5a3e20';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#3a2010'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.14, 0, Math.PI*2); ctx.stroke();
      // Ring lines
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.08, 0, Math.PI*2); ctx.stroke();
      break;
    }
    case T_GOLD_EMPTY: {
      ctx.fillStyle='#2a2a2a';
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.36, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#4a4a4a'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx+TS/2, sy+TS/2, TS*0.24, 0, Math.PI*2); ctx.stroke();
      break;
    }
  }
}

function drawBuilding(b) {
  const def=BDEF[b.type];
  const {x:sx,y:sy}=w2s(b.x,b.y);
  const sz=def.size*TS;
  const sel=selectedIds.has(b.id);
  const isAI=b.owner==='ai';

  if (b.state==='construction') {
    ctx.fillStyle='#22222288';
    ctx.fillRect(sx,sy,sz,sz);
    ctx.fillStyle=def.color+'88';
    ctx.fillRect(sx,sy,sz,sz*b.buildProg);
    ctx.strokeStyle=isAI?'#ff6644':'#ffee00'; ctx.lineWidth=2;
    ctx.setLineDash([5,4]); ctx.strokeRect(sx,sy,sz,sz); ctx.setLineDash([]);
    ctx.fillStyle=isAI?'#ff8866':'#ffee00'; ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText(`${(b.buildProg*100)|0}%`,sx+sz/2,sy+sz/2+4);
    return;
  }

  ctx.fillStyle=def.color;
  ctx.fillRect(sx+2,sy+2,sz-4,sz-4);
  ctx.strokeStyle=isAI?'#cc2222':def.border||'#000'; ctx.lineWidth=isAI?3:2;
  ctx.strokeRect(sx+2,sy+2,sz-4,sz-4);

  const h=sz, w=sz;
  switch(b.type) {
    case 'main_hall': {
      ctx.fillStyle=isAI?'#8a1010':'#c8a030';
      ctx.beginPath(); ctx.moveTo(sx+w/2,sy+4); ctx.lineTo(sx+w-4,sy+h*0.38); ctx.lineTo(sx+4,sy+h*0.38); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#3a1e08'; ctx.fillRect(sx+w*0.38,sy+h*0.52,w*0.24,h*0.44);
      ctx.fillStyle='#ffe87a';
      ctx.fillRect(sx+w*0.12,sy+h*0.48,w*0.16,h*0.16);
      ctx.fillRect(sx+w*0.72,sy+h*0.48,w*0.16,h*0.16);
      ctx.fillStyle=isAI?'#ff2222':'#cc2222';
      ctx.fillRect(sx+w*0.45,sy+2,w*0.1,h*0.3);
      break;
    }
    case 'barracks': {
      ctx.fillStyle=isAI?'#621a1a':'#2a2262';
      ctx.fillRect(sx+w*0.08,sy+h*0.08,w*0.84,h*0.42);
      ctx.fillStyle=isAI?'#ff6600':'#ffaa00';
      ctx.fillRect(sx+w*0.25,sy+h*0.12,w*0.5,h*0.06);
      ctx.fillStyle='#14143a';
      ctx.fillRect(sx+w*0.28,sy+h*0.52,w*0.44,h*0.44);
      ctx.strokeStyle='#c0c0c0'; ctx.lineWidth=1.5;
      for (let i=0;i<3;i++) {
        const bx=sx+w*(0.15+i*0.3);
        ctx.beginPath(); ctx.moveTo(bx,sy+h*0.22); ctx.lineTo(bx+w*0.08,sy+h*0.48); ctx.stroke();
      }
      break;
    }
    case 'farm': {
      ctx.fillStyle='#8bc34a'; ctx.fillRect(sx+w*0.04,sy+h*0.28,w*0.92,h*0.68);
      ctx.fillStyle='#4a8a0a';
      for (let i=0;i<3;i++) {
        const cy2=sy+h*(0.38+i*0.17);
        for (let j=0;j<4;j++) ctx.fillRect(sx+w*(0.12+j*0.22),cy2,w*0.08,h*0.08);
      }
      ctx.fillStyle='#c8a050'; ctx.fillRect(sx+w*0.6,sy+h*0.06,w*0.34,h*0.36);
      ctx.fillStyle='#8b2222';
      ctx.beginPath(); ctx.moveTo(sx+w*0.57,sy+h*0.06); ctx.lineTo(sx+w*0.77,sy+h*0.0); ctx.lineTo(sx+w*0.97,sy+h*0.06); ctx.closePath(); ctx.fill();
      break;
    }
    case 'lumber_mill': {
      ctx.fillStyle='#5a3810'; ctx.fillRect(sx+w*0.08,sy+h*0.18,w*0.84,h*0.78);
      ctx.strokeStyle='#d0d0d0'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx+w*0.35,sy+h*0.5,h*0.24,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle='#b0b0b0'; ctx.lineWidth=1;
      for (let i=0;i<8;i++) {
        const a=i*Math.PI/4+(frame*0.03);
        ctx.beginPath();
        ctx.moveTo(sx+w*0.35+Math.cos(a)*h*0.22,sy+h*0.5+Math.sin(a)*h*0.22);
        ctx.lineTo(sx+w*0.35+Math.cos(a)*h*0.30,sy+h*0.5+Math.sin(a)*h*0.30);
        ctx.stroke();
      }
      ctx.fillStyle='#8b5a20';
      for (let i=0;i<3;i++) ctx.fillRect(sx+w*0.62,sy+h*(0.3+i*0.22),w*0.28,h*0.14);
      break;
    }
    case 'tower': {
      ctx.fillStyle='#707058'; ctx.fillRect(sx+w*0.22,sy,w*0.56,h);
      ctx.fillStyle='#505040'; ctx.fillRect(sx,sy+h*0.38,w,h*0.24);
      ctx.fillStyle='#8a8a6a';
      for (let i=0;i<4;i++) ctx.fillRect(sx+w*(0.22+i*0.18),sy-h*0.09,w*0.12,h*0.14);
      ctx.fillStyle='#1a1a1a'; ctx.fillRect(sx+w*0.42,sy+h*0.2,w*0.16,h*0.28);
      break;
    }
    case 'blacksmith': {
      ctx.fillStyle='#2a1e10'; ctx.fillRect(sx+w*0.06,sy+h*0.14,w*0.88,h*0.82);
      // Chimney
      ctx.fillStyle='#3a2a18'; ctx.fillRect(sx+w*0.65,sy-h*0.06,w*0.2,h*0.28);
      // Smoke
      ctx.fillStyle='rgba(120,120,120,0.4)';
      const sm=(frame*0.04)%1;
      ctx.beginPath(); ctx.arc(sx+w*0.75,sy-h*(0.08+sm*0.15),TS*(0.08+sm*0.05),0,Math.PI*2); ctx.fill();
      // Anvil
      ctx.fillStyle='#666'; ctx.fillRect(sx+w*0.2,sy+h*0.52,w*0.35,h*0.1);
      ctx.fillRect(sx+w*0.25,sy+h*0.44,w*0.25,h*0.1);
      // Door
      ctx.fillStyle='#1a0e06'; ctx.fillRect(sx+w*0.38,sy+h*0.55,w*0.24,h*0.41);
      break;
    }
    case 'mage_tower': {
      ctx.fillStyle='#2a1040'; ctx.fillRect(sx+w*0.22,sy+h*0.08,w*0.56,h*0.88);
      ctx.fillStyle='#3a1858';
      ctx.beginPath(); ctx.arc(sx+w/2,sy+h*0.08,w*0.3,Math.PI,0); ctx.fill();
      // Conical roof
      ctx.fillStyle='#4a2070';
      ctx.beginPath(); ctx.moveTo(sx+w/2,sy-h*0.05); ctx.lineTo(sx+w*0.22,sy+h*0.1); ctx.lineTo(sx+w*0.78,sy+h*0.1); ctx.closePath(); ctx.fill();
      // Magic orb
      ctx.fillStyle='rgba(180,60,255,0.7)';
      ctx.beginPath(); ctx.arc(sx+w/2,sy+h*0.38,w*0.13,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(230,160,255,0.5)';
      ctx.beginPath(); ctx.arc(sx+w*0.46,sy+h*0.34,w*0.06,0,Math.PI*2); ctx.fill();
      // Window slits
      ctx.fillStyle='#c080ff';
      ctx.fillRect(sx+w*0.44,sy+h*0.58,w*0.12,h*0.18);
      break;
    }
    case 'stable': {
      // Stable: brown building with hay and horse stall
      ctx.fillStyle='#5a3808'; ctx.fillRect(sx+w*0.06,sy+h*0.16,w*0.88,h*0.80);
      // Roof
      ctx.fillStyle='#7a5020';
      ctx.beginPath(); ctx.moveTo(sx+w*0.0,sy+h*0.18); ctx.lineTo(sx+w*0.5,sy+h*0.0); ctx.lineTo(sx+w,sy+h*0.18); ctx.closePath(); ctx.fill();
      // Stall dividers
      ctx.strokeStyle='#8b5a20'; ctx.lineWidth=2;
      for (let i=0;i<2;i++) ctx.strokeRect(sx+w*(0.12+i*0.38),sy+h*0.42,w*0.3,h*0.5);
      // Hay
      ctx.fillStyle='#e8c84a'; ctx.fillRect(sx+w*0.15,sy+h*0.62,w*0.2,h*0.08);
      ctx.fillRect(sx+w*0.55,sy+h*0.62,w*0.2,h*0.08);
      break;
    }
    case 'siege_workshop': {
      // Workshop: stone building with catapult arm visible
      ctx.fillStyle='#3a3830'; ctx.fillRect(sx+w*0.06,sy+h*0.14,w*0.88,h*0.82);
      ctx.fillStyle='#505048';
      ctx.beginPath(); ctx.moveTo(sx,sy+h*0.16); ctx.lineTo(sx+w*0.5,sy); ctx.lineTo(sx+w,sy+h*0.16); ctx.closePath(); ctx.fill();
      // Catapult arm outline
      ctx.strokeStyle='#8b6020'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(sx+w*0.5,sy+h*0.7); ctx.lineTo(sx+w*0.3,sy+h*0.32); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx+w*0.5,sy+h*0.7,w*0.06,0,Math.PI*2); ctx.fillStyle='#606048'; ctx.fill();
      // Stone pile
      ctx.fillStyle='#707068';
      for (let i=0;i<3;i++) { ctx.beginPath(); ctx.arc(sx+w*(0.65+i*0.1),sy+h*0.72,w*0.06,0,Math.PI*2); ctx.fill(); }
      break;
    }
    case 'temple': {
      // Temple: white/gold columns
      ctx.fillStyle='#c8c090'; ctx.fillRect(sx+w*0.1,sy+h*0.22,w*0.8,h*0.74);
      ctx.fillStyle='#e8e0b0';
      ctx.beginPath(); ctx.moveTo(sx+w*0.08,sy+h*0.24); ctx.lineTo(sx+w*0.5,sy+h*0.02); ctx.lineTo(sx+w*0.92,sy+h*0.24); ctx.closePath(); ctx.fill();
      // Columns
      ctx.fillStyle='#d8d0a0';
      for (let i=0;i<3;i++) ctx.fillRect(sx+w*(0.16+i*0.28),sy+h*0.24,w*0.1,h*0.72);
      // Divine glow
      ctx.fillStyle='rgba(255,240,100,0.25)';
      ctx.beginPath(); ctx.arc(sx+w/2,sy+h*0.4,w*0.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f8e050'; ctx.fillRect(sx+w*0.46,sy+h*0.28,w*0.08,h*0.12);
      ctx.fillRect(sx+w*0.42,sy+h*0.32,w*0.16,h*0.04);
      break;
    }
    case 'tavern': {
      // Tavern: cozy wooden building with sign
      ctx.fillStyle='#6a3a1a'; ctx.fillRect(sx+w*0.06,sy+h*0.18,w*0.88,h*0.78);
      ctx.fillStyle='#8b5a28';
      ctx.beginPath(); ctx.moveTo(sx,sy+h*0.2); ctx.lineTo(sx+w*0.5,sy+h*0.0); ctx.lineTo(sx+w,sy+h*0.2); ctx.closePath(); ctx.fill();
      // Windows with warm glow
      ctx.fillStyle='#ffe080'; ctx.fillRect(sx+w*0.12,sy+h*0.36,w*0.22,h*0.22);
      ctx.fillRect(sx+w*0.66,sy+h*0.36,w*0.22,h*0.22);
      // Door
      ctx.fillStyle='#3a1e0a'; ctx.fillRect(sx+w*0.38,sy+h*0.54,w*0.24,h*0.42);
      ctx.fillStyle='#c8a050'; ctx.fillRect(sx+w*0.44,sy+h*0.58,w*0.04,h*0.04); // knob
      // Hanging sign
      ctx.strokeStyle='#8b5a20'; ctx.lineWidth=1;
      ctx.strokeRect(sx+w*0.58,sy+h*0.14,w*0.22,h*0.12);
      ctx.fillStyle='#e8c84a'; ctx.font='7px Courier New'; ctx.textAlign='center';
      ctx.fillText('⚔',sx+w*0.69,sy+h*0.22);
      break;
    }
  } // end switch(b.type)

  if (sel) {
    ctx.strokeStyle=isAI?'#ff4444':'#00ff88'; ctx.lineWidth=2;
    ctx.strokeRect(sx-1,sy-1,sz+2,sz+2);
  }

  const hpf=b.hp/b.maxHp;
  ctx.fillStyle='#222'; ctx.fillRect(sx+2,sy-9,sz-4,5);
  ctx.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
  ctx.fillRect(sx+2,sy-9,(sz-4)*hpf,5);

  if (b.state==='training'&&b.trainQueue.length) {
    const prog=b.trainProg/UDEF[b.trainQueue[0]].trainTime;
    ctx.fillStyle='#111'; ctx.fillRect(sx+2,sy+sz-6,sz-4,5);
    ctx.fillStyle='#4488ff'; ctx.fillRect(sx+2,sy+sz-6,(sz-4)*prog,5);
  }

  ctx.fillStyle='#ffffff88'; ctx.font='9px Courier New'; ctx.textAlign='center';
  ctx.fillText(def.name,sx+sz/2,sy+sz+11);

  // Draw rally point line and flag
  if (b.rallyX!==null && b.owner==='player') {
    const rx=b.rallyX-camera.x, ry=b.rallyY-camera.y;
    ctx.strokeStyle='rgba(0,255,136,0.4)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(sx+sz/2,sy+sz/2); ctx.lineTo(rx,ry); ctx.stroke();
    ctx.setLineDash([]);
    // Flag pole
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx,ry-14); ctx.stroke();
    ctx.fillStyle='#00ff88';
    ctx.beginPath(); ctx.moveTo(rx,ry-14); ctx.lineTo(rx+8,ry-10); ctx.lineTo(rx,ry-6); ctx.closePath(); ctx.fill();
  }
}

function drawUnit(u) {
  const {x:sx,y:sy}=w2s(u.x,u.y);
  const s=u.size;
  const sel=selectedIds.has(u.id);
  const isAI=u.owner==='ai';
  const isNeutral=u.owner==='neutral';

  if (sel) {
    ctx.strokeStyle=isNeutral?'#ff8800':isAI?'#ff4444':'#00ff88'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(sx,sy+2,s+5,s*0.55,0,0,Math.PI*2); ctx.stroke();
  }

  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx,sy+3,s*0.7,s*0.32,0,0,Math.PI*2); ctx.fill();

  // Divine shield glow
  if (u.isHero && u.skillCooldowns?.shieldActive>0) {
    ctx.strokeStyle='rgba(150,210,255,0.7)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(sx,sy-s*0.3,s*1.5,0,Math.PI*2); ctx.stroke();
  }

  drawUnitSprite(ctx,u,sx,sy,s,isAI,isNeutral);

  if (u.carryGold>0) {
    ctx.fillStyle='#ffd700';
    ctx.beginPath(); ctx.arc(sx+s*0.72,sy-s*0.85,4,0,Math.PI*2); ctx.fill();
  }
  if (u.carryWood>0) {
    ctx.fillStyle='#8b5a20';
    ctx.beginPath(); ctx.arc(sx+s*0.72,sy-s*0.52,4,0,Math.PI*2); ctx.fill();
  }

  const hpf=u.hp/u.maxHp;
  if (sel||hpf<1) {
    ctx.fillStyle='#333'; ctx.fillRect(sx-s,sy-s*1.9,s*2,3);
    ctx.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
    ctx.fillRect(sx-s,sy-s*1.9,s*2*hpf,3);
  }

  // Hero XP bar and level indicator
  if (u.isHero) {
    const xpBarY=sy-s*2.2;
    ctx.fillStyle='#222'; ctx.fillRect(sx-s,xpBarY,s*2,3);
    const curLvlXp = HERO_XP_THRESH[u.level-1]||0;
    const nextLvlXp = u.level<HERO_XP_THRESH.length ? HERO_XP_THRESH[u.level] : HERO_XP_THRESH[HERO_XP_THRESH.length-1];
    const xpPct = nextLvlXp>curLvlXp ? (u.xp-curLvlXp)/(nextLvlXp-curLvlXp) : 1;
    ctx.fillStyle='#8844ff'; ctx.fillRect(sx-s,xpBarY,s*2*Math.min(1,xpPct),3);
    ctx.fillStyle='#ffd700'; ctx.font='bold 8px Courier New'; ctx.textAlign='center';
    ctx.fillText(`L${u.level}`,sx,sy-s*1.6);
  }
}

function drawUnitSprite(dc,u,sx,sy,s,isAI,isNeutral) {
  const udef=UDEF[u.type];
  const color=isAI?tintRed(udef.color):udef.color;
  switch(u.type) {
    case 'worker': {
      // Body
      dc.fillStyle=isAI?'#a03030':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.3,s*0.8,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(0,0,0,0.4)'; dc.lineWidth=1; dc.stroke();
      // Head
      dc.fillStyle=isAI?'#c04040':'#e0b870';
      dc.beginPath(); dc.arc(sx,sy-s*1.0,s*0.5,0,Math.PI*2); dc.fill();
      // Hat (brown)
      dc.fillStyle=isAI?'#7a1a1a':'#6a3a10';
      dc.fillRect(sx-s*0.5,sy-s*1.45,s*1.0,s*0.28);
      dc.fillRect(sx-s*0.3,sy-s*1.7,s*0.6,s*0.28);
      // Tool (arm)
      dc.strokeStyle=isAI?'#cc4444':'#c8a050'; dc.lineWidth=2;
      const ta=u.angle+0.3;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(ta)*s*0.5,sy-s*0.3+Math.sin(ta)*s*0.5);
      dc.lineTo(sx+Math.cos(ta)*s*1.2,sy-s*0.3+Math.sin(ta)*s*1.2);
      dc.stroke();
      break;
    }
    case 'soldier': {
      // Armored body
      dc.fillStyle=isAI?'#8a2020':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#8090a0'; dc.lineWidth=1.5; dc.stroke();
      // Helmet
      dc.fillStyle=isAI?'#6a1818':'#6070a0';
      dc.beginPath(); dc.arc(sx,sy-s*0.8,s*0.55,Math.PI,0); dc.fill();
      dc.fillStyle='#9090c0'; dc.fillRect(sx-s*0.5,sy-s*0.88,s,s*0.16);
      // Shield
      dc.fillStyle=isAI?'#aa2222':'#3050c0';
      const shA=u.angle+Math.PI*0.5;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(shA)*s*0.7,sy-s*0.25+Math.sin(shA)*s*0.7);
      dc.lineTo(sx+Math.cos(shA)*s*1.3,sy-s*0.25+Math.sin(shA)*s);
      dc.lineTo(sx+Math.cos(shA)*s*1.3,sy-s*0.25+Math.sin(shA)*s*0.3);
      dc.closePath(); dc.fill();
      // Direction dot
      dc.fillStyle='rgba(255,255,255,0.6)';
      dc.beginPath(); dc.arc(sx+Math.cos(u.angle)*s*0.55,sy-s*0.25+Math.sin(u.angle)*s*0.55,s*0.22,0,Math.PI*2); dc.fill();
      break;
    }
    case 'archer': {
      dc.fillStyle=isAI?'#1a5a1a':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(0,0,0,0.4)'; dc.lineWidth=1; dc.stroke();
      // Hood
      dc.fillStyle=isAI?'#204820':'#1e6030';
      dc.beginPath(); dc.arc(sx,sy-s*0.7,s*0.5,Math.PI,0); dc.fill();
      // Bow
      dc.strokeStyle=isAI?'#a04020':'#a07040'; dc.lineWidth=2;
      const ba=u.angle+Math.PI*0.5;
      dc.beginPath(); dc.arc(sx+Math.cos(u.angle)*s*0.8,sy-s*0.25+Math.sin(u.angle)*s*0.8,s*0.7,ba-0.8,ba+0.8); dc.stroke();
      // Arrow
      dc.strokeStyle='#c8b080'; dc.lineWidth=1;
      const ax=sx+Math.cos(u.angle)*s*0.3, ay=sy-s*0.25+Math.sin(u.angle)*s*0.3;
      dc.beginPath(); dc.moveTo(ax,ay); dc.lineTo(ax+Math.cos(u.angle)*s*1.2,ay+Math.sin(u.angle)*s*1.2); dc.stroke();
      break;
    }
    case 'knight': {
      // Heavy armored body
      dc.fillStyle=isAI?'#6a1a1a':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s*1.05,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#c0c8d8'; dc.lineWidth=2; dc.stroke();
      // Visor helmet
      dc.fillStyle=isAI?'#8a2020':'#7080b0';
      dc.beginPath(); dc.arc(sx,sy-s*0.85,s*0.58,Math.PI,0); dc.fill();
      dc.fillStyle=isAI?'#5a1010':'#5060a0';
      dc.fillRect(sx-s*0.52,sy-s*1.0,s*1.04,s*0.18);
      // Visor slit
      dc.fillStyle='#1a1a1a'; dc.fillRect(sx-s*0.28,sy-s*0.92,s*0.56,s*0.1);
      // Sword
      dc.strokeStyle='#d0d8e8'; dc.lineWidth=2;
      const kax=u.angle;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(kax)*s*0.5,sy-s*0.25+Math.sin(kax)*s*0.5);
      dc.lineTo(sx+Math.cos(kax)*s*1.6,sy-s*0.25+Math.sin(kax)*s*1.6);
      dc.stroke();
      dc.strokeStyle='#a0a040'; dc.lineWidth=3;
      const crossA=kax+Math.PI*0.5;
      const hiltX=sx+Math.cos(kax)*s*0.9, hiltY=sy-s*0.25+Math.sin(kax)*s*0.9;
      dc.beginPath();
      dc.moveTo(hiltX+Math.cos(crossA)*s*0.5,hiltY+Math.sin(crossA)*s*0.5);
      dc.lineTo(hiltX-Math.cos(crossA)*s*0.5,hiltY-Math.sin(crossA)*s*0.5);
      dc.stroke();
      break;
    }
    case 'mage': {
      // Robe
      dc.fillStyle=isAI?'#5a1060':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#8030b0'; dc.lineWidth=1; dc.stroke();
      // Pointed hat
      dc.fillStyle=isAI?'#3a0840':'#3a0880';
      dc.beginPath();
      dc.moveTo(sx,sy-s*1.8);
      dc.lineTo(sx-s*0.5,sy-s*0.85);
      dc.lineTo(sx+s*0.5,sy-s*0.85);
      dc.closePath(); dc.fill();
      dc.fillStyle=isAI?'#5a1060':'#4a10a0';
      dc.beginPath(); dc.arc(sx,sy-s*0.9,s*0.5,0,Math.PI*2); dc.fill();
      // Staff
      dc.strokeStyle='#8b5a20'; dc.lineWidth=2;
      const ma=u.angle;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(ma+0.4)*s*0.6,sy-s*0.25+Math.sin(ma+0.4)*s*0.6);
      dc.lineTo(sx+Math.cos(ma+0.4)*s*1.8,sy-s*0.25+Math.sin(ma+0.4)*s*1.8);
      dc.stroke();
      // Orb on staff
      dc.fillStyle='rgba(200,100,255,0.9)';
      dc.beginPath(); dc.arc(
        sx+Math.cos(ma+0.4)*s*1.8,
        sy-s*0.25+Math.sin(ma+0.4)*s*1.8,
        s*0.3,0,Math.PI*2); dc.fill();
      break;
    }
    case 'cavalry': {
      // Horse + rider
      dc.fillStyle=isAI?'#7a2a10':'#8b6030';
      dc.beginPath(); dc.ellipse(sx,sy-s*0.3,s*1.2,s*0.8,u.angle,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(0,0,0,0.4)'; dc.lineWidth=1; dc.stroke();
      // Rider body
      dc.fillStyle=color;
      dc.beginPath(); dc.arc(sx+Math.cos(u.angle)*s*0.3,sy-s*0.9,s*0.7,0,Math.PI*2); dc.fill();
      // Helmet
      dc.fillStyle=isAI?'#8a2020':'#5060c0';
      dc.beginPath(); dc.arc(sx+Math.cos(u.angle)*s*0.3,sy-s*1.35,s*0.42,Math.PI,0); dc.fill();
      // Lance
      dc.strokeStyle=isAI?'#aa2222':'#c8c8e8'; dc.lineWidth=2;
      const la=u.angle;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(la)*s*0.8,sy-s*0.9+Math.sin(la)*s*0.8);
      dc.lineTo(sx+Math.cos(la)*s*2.2,sy-s*0.9+Math.sin(la)*s*2.2);
      dc.stroke();
      break;
    }
    case 'catapult': {
      // Wooden frame
      dc.fillStyle=isAI?'#4a2010':'#5a4020';
      dc.fillRect(sx-s*1.1,sy-s*0.4,s*2.2,s*0.7);
      // Wheels
      dc.fillStyle='#3a2808';
      dc.beginPath(); dc.arc(sx-s*0.8,sy+s*0.1,s*0.45,0,Math.PI*2); dc.fill();
      dc.beginPath(); dc.arc(sx+s*0.8,sy+s*0.1,s*0.45,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#8b6020'; dc.lineWidth=2;
      dc.beginPath(); dc.arc(sx-s*0.8,sy+s*0.1,s*0.45,0,Math.PI*2); dc.stroke();
      dc.beginPath(); dc.arc(sx+s*0.8,sy+s*0.1,s*0.45,0,Math.PI*2); dc.stroke();
      // Arm
      const catAngle=u.angle-Math.PI*0.4;
      dc.strokeStyle=isAI?'#7a2010':'#6a4010'; dc.lineWidth=3;
      dc.beginPath();
      dc.moveTo(sx,sy-s*0.1);
      dc.lineTo(sx+Math.cos(catAngle)*s*1.4,sy-s*0.1+Math.sin(catAngle)*s*1.4);
      dc.stroke();
      // Boulder
      dc.fillStyle='#707068';
      dc.beginPath(); dc.arc(sx+Math.cos(catAngle)*s*1.4,sy-s*0.1+Math.sin(catAngle)*s*1.4,s*0.32,0,Math.PI*2); dc.fill();
      break;
    }
    case 'priest': {
      // White robes
      dc.fillStyle=isAI?'#884444':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(200,200,200,0.4)'; dc.lineWidth=1; dc.stroke();
      // Hood
      dc.fillStyle=isAI?'#aa5555':'#d8d8b0';
      dc.beginPath(); dc.arc(sx,sy-s*0.8,s*0.5,Math.PI,0); dc.fill();
      // Holy symbol (cross)
      dc.fillStyle=isAI?'#ffaaaa':'#ffd700';
      dc.fillRect(sx-s*0.08,sy-s*0.7,s*0.16,s*0.48);
      dc.fillRect(sx-s*0.24,sy-s*0.55,s*0.48,s*0.16);
      // Staff
      dc.strokeStyle=isAI?'#884444':'#c8c890'; dc.lineWidth=2;
      const pa=u.angle;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(pa+0.5)*s*0.6,sy-s*0.25+Math.sin(pa+0.5)*s*0.6);
      dc.lineTo(sx+Math.cos(pa+0.5)*s*1.7,sy-s*0.25+Math.sin(pa+0.5)*s*1.7);
      dc.stroke();
      break;
    }
    case 'hero': {
      // Glowing armored hero
      dc.fillStyle=isAI?'#9a2020':color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s*1.1,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#ffd700'; dc.lineWidth=2; dc.stroke();
      // Golden helmet with wings
      dc.fillStyle=isAI?'#8a2020':'#c8a020';
      dc.beginPath(); dc.arc(sx,sy-s*0.9,s*0.6,Math.PI,0); dc.fill();
      dc.fillStyle=isAI?'#cc4444':'#ffd700';
      dc.fillRect(sx-s*0.55,sy-s*1.08,s*1.1,s*0.2);
      // Wing marks
      dc.fillStyle=isAI?'#ff8888':'#ffe88a';
      dc.beginPath(); dc.moveTo(sx-s*0.5,sy-s*0.88); dc.lineTo(sx-s*0.95,sy-s*1.1); dc.lineTo(sx-s*0.55,sy-s*0.72); dc.closePath(); dc.fill();
      dc.beginPath(); dc.moveTo(sx+s*0.5,sy-s*0.88); dc.lineTo(sx+s*0.95,sy-s*1.1); dc.lineTo(sx+s*0.55,sy-s*0.72); dc.closePath(); dc.fill();
      // Glowing sword
      dc.strokeStyle='rgba(255,215,0,0.9)'; dc.lineWidth=2.5;
      const ha=u.angle;
      dc.beginPath();
      dc.moveTo(sx+Math.cos(ha)*s*0.6,sy-s*0.25+Math.sin(ha)*s*0.6);
      dc.lineTo(sx+Math.cos(ha)*s*1.8,sy-s*0.25+Math.sin(ha)*s*1.8);
      dc.stroke();
      // Golden glow
      const glow=ctx.createRadialGradient(sx,sy-s*0.4,s*0.3,sx,sy-s*0.4,s*1.3);
      glow.addColorStop(0,'rgba(255,215,0,0.12)');
      glow.addColorStop(1,'rgba(255,215,0,0)');
      dc.fillStyle=glow; dc.beginPath(); dc.arc(sx,sy-s*0.4,s*1.3,0,Math.PI*2); dc.fill();
      break;
    }
    case 'wolf': {
      // Wolf body
      dc.fillStyle='#707070';
      dc.beginPath(); dc.ellipse(sx,sy-s*0.2,s*1.1,s*0.65,u.angle,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#404040'; dc.lineWidth=1; dc.stroke();
      // Head
      dc.fillStyle='#888';
      const wx2=sx+Math.cos(u.angle)*s*0.9, wy2=sy-s*0.2+Math.sin(u.angle)*s*0.9;
      dc.beginPath(); dc.arc(wx2,wy2,s*0.5,0,Math.PI*2); dc.fill();
      // Ears
      dc.fillStyle='#555';
      dc.beginPath(); dc.moveTo(wx2+Math.cos(u.angle-0.6)*s*0.4,wy2+Math.sin(u.angle-0.6)*s*0.4);
      dc.lineTo(wx2+Math.cos(u.angle-0.3)*s*0.72,wy2+Math.sin(u.angle-0.3)*s*0.72);
      dc.lineTo(wx2+Math.cos(u.angle-0.1)*s*0.4,wy2+Math.sin(u.angle-0.1)*s*0.4);
      dc.closePath(); dc.fill();
      // Eyes (red glow)
      dc.fillStyle='#ff4422';
      dc.beginPath(); dc.arc(wx2+Math.cos(u.angle+0.22)*s*0.28,wy2+Math.sin(u.angle+0.22)*s*0.28,s*0.1,0,Math.PI*2); dc.fill();
      dc.beginPath(); dc.arc(wx2+Math.cos(u.angle-0.22)*s*0.28,wy2+Math.sin(u.angle-0.22)*s*0.28,s*0.1,0,Math.PI*2); dc.fill();
      break;
    }
    case 'deer': {
      // Deer body
      dc.fillStyle='#b08050';
      dc.beginPath(); dc.ellipse(sx,sy-s*0.2,s*0.9,s*0.55,u.angle,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(0,0,0,0.2)'; dc.lineWidth=1; dc.stroke();
      // Head
      dc.fillStyle='#c09060';
      const dhx=sx+Math.cos(u.angle)*s*0.8, dhy=sy-s*0.2+Math.sin(u.angle)*s*0.8;
      dc.beginPath(); dc.arc(dhx,dhy,s*0.38,0,Math.PI*2); dc.fill();
      // Antlers (lines)
      dc.strokeStyle='#7a5030'; dc.lineWidth=1.5;
      dc.beginPath(); dc.moveTo(dhx,dhy-s*0.38); dc.lineTo(dhx-s*0.3,dhy-s*0.8); dc.lineTo(dhx-s*0.5,dhy-s*0.55); dc.stroke();
      dc.beginPath(); dc.moveTo(dhx,dhy-s*0.38); dc.lineTo(dhx+s*0.3,dhy-s*0.8); dc.lineTo(dhx+s*0.5,dhy-s*0.55); dc.stroke();
      break;
    }
    case 'treant': {
      // Bark textured body
      dc.fillStyle='#3a5020';
      dc.beginPath(); dc.arc(sx,sy-s*0.3,s*1.05,0,Math.PI*2); dc.fill();
      dc.strokeStyle='#2a3010'; dc.lineWidth=2; dc.stroke();
      // Branch arms
      dc.strokeStyle='#4a6020'; dc.lineWidth=3;
      dc.beginPath();
      dc.moveTo(sx-s*0.7,sy-s*0.4); dc.lineTo(sx-s*1.4,sy-s*0.9); dc.stroke();
      dc.moveTo(sx+s*0.7,sy-s*0.4); dc.lineTo(sx+s*1.4,sy-s*0.9); dc.stroke();
      // Leaves clusters
      dc.fillStyle='rgba(56,100,16,0.85)';
      for (let i=0;i<5;i++) {
        const la2=i*Math.PI*0.4;
        dc.beginPath(); dc.arc(sx+Math.cos(la2)*s*0.75,sy-s*0.3+Math.sin(la2)*s*0.75,s*0.5,0,Math.PI*2); dc.fill();
      }
      // Eyes (bark cracks)
      dc.fillStyle='#ffe870';
      dc.beginPath(); dc.arc(sx-s*0.28,sy-s*0.5,s*0.14,0,Math.PI*2); dc.fill();
      dc.beginPath(); dc.arc(sx+s*0.28,sy-s*0.5,s*0.14,0,Math.PI*2); dc.fill();
      dc.fillStyle='#2a1a00';
      dc.beginPath(); dc.arc(sx-s*0.28,sy-s*0.5,s*0.07,0,Math.PI*2); dc.fill();
      dc.beginPath(); dc.arc(sx+s*0.28,sy-s*0.5,s*0.07,0,Math.PI*2); dc.fill();
      break;
    }
    default: {
      dc.fillStyle=color;
      dc.beginPath(); dc.arc(sx,sy-s*0.25,s,0,Math.PI*2); dc.fill();
      dc.strokeStyle='rgba(0,0,0,0.5)'; dc.lineWidth=1; dc.stroke();
      dc.fillStyle='rgba(255,255,255,0.6)';
      dc.beginPath(); dc.arc(sx+Math.cos(u.angle)*s*0.58,sy-s*0.25+Math.sin(u.angle)*s*0.58,s*0.26,0,Math.PI*2); dc.fill();
    }
  }
}

function tintRed(hex) {
  // Mix hex color toward red
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  const nr=Math.min(255,r+80);
  const ng=Math.max(0,g-40);
  const nb=Math.max(0,b-40);
  return `rgb(${nr},${ng},${nb})`;
}

function render() {
  ctx.clearRect(0,0,gameW,gameH);

  const tx0=Math.max(0,Math.floor(camera.x/TS)-1);
  const ty0=Math.max(0,Math.floor(camera.y/TS)-1);
  const tx1=Math.min(MW,tx0+Math.ceil(gameW/TS)+2);
  const ty1=Math.min(MH,ty0+Math.ceil(gameH/TS)+2);

  ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,0,gameW,gameH);

  for (let ty=ty0;ty<ty1;ty++)
    for (let tx2=tx0;tx2<tx1;tx2++)
      drawTile(tx2,ty,tx2*TS-camera.x,ty*TS-camera.y);

  // Optional grid
  if (showGrid) {
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
    for (let tx2=tx0;tx2<=tx1;tx2++) {
      const sx=tx2*TS-camera.x;
      ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,gameH); ctx.stroke();
    }
    for (let ty=ty0;ty<=ty1;ty++) {
      const sy=ty*TS-camera.y;
      ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(gameW,sy); ctx.stroke();
    }
  }

  for (const e of entities) if (!e.isUnit) drawBuilding(e);

  const units=[...entities].filter(e=>e.isUnit).sort((a,b)=>a.y-b.y);
  for (const u of units) drawUnit(u);

  // Draw projectiles
  for (const p of projectiles) {
    const sx=p.x-camera.x, sy=p.y-camera.y;
    const tx2=p.tx-camera.x, ty2=p.ty-camera.y;
    // Trail
    ctx.strokeStyle=p.color; ctx.lineWidth=2; ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.moveTo(sx,sy);
    const tdx=tx2-sx, tdy=ty2-sy, tlen=Math.sqrt(tdx*tdx+tdy*tdy)||1;
    ctx.lineTo(sx-tdx/tlen*8,sy-tdy/tlen*8);
    ctx.stroke();
    ctx.globalAlpha=1;
    // Projectile dot
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(sx,sy, p.aoe>0 ? 5 : 3, 0,Math.PI*2); ctx.fill();
    // AOE glow
    if (p.aoe>0) {
      ctx.fillStyle='rgba(255,100,0,0.15)';
      ctx.beginPath(); ctx.arc(sx,sy,p.aoe*TS*0.4,0,Math.PI*2); ctx.fill();
    }
  }

  // Rally mode cursor
  if (rallyMode) {
    const mx=mouse.x, my=mouse.y;
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(mx,my-12); ctx.lineTo(mx,my+12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx-12,my); ctx.lineTo(mx+12,my); ctx.stroke();
    ctx.fillStyle='#00ff88'; ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText('Set Rally Point',mx,my-16);
  }

  for (const n of notes) {
    const {x:sx,y:sy}=w2s(n.x,n.y);
    ctx.globalAlpha=1-n.life/n.maxLife;
    ctx.fillStyle=n.color; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
    ctx.fillText(n.text,sx,sy);
  }
  ctx.globalAlpha=1;

  if (buildMode) {
    const {tx,ty}=w2t(mouse.wx,mouse.wy);
    const def=BDEF[buildMode.type];
    const sz=def.size*TS;
    const bsx=tx*TS-camera.x, bsy=ty*TS-camera.y;
    let valid=true;
    for (let dy=0;dy<def.size&&valid;dy++)
      for (let dx=0;dx<def.size&&valid;dx++)
        if (!walkable(tx+dx,ty+dy)||tileOccupied(tx+dx,ty+dy)) valid=false;
    ctx.fillStyle=valid?'rgba(0,255,0,0.22)':'rgba(255,0,0,0.22)';
    ctx.fillRect(bsx,bsy,sz,sz);
    ctx.strokeStyle=valid?'#00ff44':'#ff4444'; ctx.lineWidth=2;
    ctx.strokeRect(bsx,bsy,sz,sz);
    ctx.fillStyle=valid?'#00ff44':'#ff4444';
    ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText(def.name,bsx+sz/2,bsy-5);
    ctx.fillText(`${def.cost.gold}\u{1F4B0} ${def.cost.wood}\u{1FAB5}`,bsx+sz/2,bsy+sz+14);
  }

  if (selBox.active) {
    const x=Math.min(selBox.x1,selBox.x2), y=Math.min(selBox.y1,selBox.y2);
    const bw=Math.abs(selBox.x2-selBox.x1), bh=Math.abs(selBox.y2-selBox.y1);
    ctx.fillStyle='rgba(0,255,136,0.04)'; ctx.fillRect(x,y,bw,bh);
    ctx.strokeStyle='#00ff88'; ctx.lineWidth=1;
    ctx.setLineDash([4,4]); ctx.strokeRect(x,y,bw,bh); ctx.setLineDash([]);
  }

  const bx=-camera.x, by=-camera.y;
  ctx.strokeStyle='#000'; ctx.lineWidth=4;
  ctx.strokeRect(bx,by,MW*TS,MH*TS);

  renderMinimap();
}

// ==================== MINIMAP ====================
function renderMinimap() {
  if (!mmCtx) return;
  const mw=mmCanvas.width, mh=mmCanvas.height;
  mmCtx.clearRect(0,0,mw,mh);
  const scx=mw/MW, scy=mh/MH;
  for (let y=0;y<MH;y++)
    for (let x=0;x<MW;x++) {
      mmCtx.fillStyle=TILE_COLOR[map[y][x]]||'#3d6e2f';
      mmCtx.fillRect(x*scx,y*scy,scx+0.5,scy+0.5);
    }
  for (const e of entities) {
    if (e.isUnit) {
      mmCtx.fillStyle=(e.owner==='ai')?'#ff4444':UDEF[e.type].color;
      mmCtx.fillRect(e.x/TS*scx-1,e.y/TS*scy-1,3,3);
    } else {
      const def=BDEF[e.type];
      const tx=Math.floor(e.x/TS), ty=Math.floor(e.y/TS);
      mmCtx.fillStyle=(e.owner==='ai')?'#cc2222':def.color;
      mmCtx.fillRect(tx*scx,ty*scy,def.size*scx,def.size*scy);
    }
  }
  const vpx=camera.x/TS*scx, vpy=camera.y/TS*scy;
  const vpw=gameW/TS*scx, vph=(gameH-44-130)/TS*scy;
  mmCtx.strokeStyle='#ffffff88'; mmCtx.lineWidth=1;
  mmCtx.strokeRect(vpx,vpy,vpw,vph);
}

// ==================== PORTRAIT ====================
function drawPortrait(entity) {
  if (!portraitCtx) return;
  const pc=portraitCtx;
  pc.clearRect(0,0,60,60);
  pc.fillStyle='#0a0a1e';
  pc.fillRect(0,0,60,60);
  if (!entity) return;

  const cx=30, cy=36;
  if (entity.isUnit) {
    const isAI=entity.owner==='ai';
    const s=14;
    // Shadow
    pc.fillStyle='rgba(0,0,0,0.3)';
    pc.beginPath(); pc.ellipse(cx,cy+4,s*0.9,s*0.35,0,0,Math.PI*2); pc.fill();
    // Draw sprite
    const fakeUnit={...entity, angle:Math.PI*0.25};
    drawUnitSprite(pc,fakeUnit,cx,cy,s,isAI);
    // HP bar
    const hpf=entity.hp/entity.maxHp;
    pc.fillStyle='#333'; pc.fillRect(3,54,54,4);
    pc.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
    pc.fillRect(3,54,54*hpf,4);
  } else {
    const def=BDEF[entity.type];
    pc.fillStyle=entity.owner==='ai'?'#3a1010':def.color;
    pc.fillRect(8,10,44,36);
    pc.strokeStyle=entity.owner==='ai'?'#cc2222':def.border; pc.lineWidth=2;
    pc.strokeRect(8,10,44,36);
    // HP bar
    const hpf=entity.hp/entity.maxHp;
    pc.fillStyle='#333'; pc.fillRect(3,54,54,4);
    pc.fillStyle=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
    pc.fillRect(3,54,54*hpf,4);
  }
  // Name at top
  pc.fillStyle='#d4c89a'; pc.font='bold 7px Courier New'; pc.textAlign='center';
  const def2=entity.isUnit?UDEF[entity.type]:BDEF[entity.type];
  pc.fillText(def2.name,30,9);
}

// ==================== UI ====================
function updateUI() {
  document.getElementById('gold').textContent=Math.floor(resources.gold);
  document.getElementById('wood').textContent=Math.floor(resources.wood);
  document.getElementById('pop').textContent=`${pop.cur}/${pop.max}`;
  renderSelectionPanel();
  renderBuildPanel();
}

function renderBuildPanel() {
  const sel=[...selectedIds].map(id=>getEntity(id)).filter(Boolean);
  const canBuild=sel.some(e=>e&&e.isUnit&&e.canBuild&&e.owner==='player');
  const panel=document.getElementById('buildPanel');
  if (!panel) return;

  if (!canBuild) {
    panel.classList.add('hidden');
    lastBuildPanelHash='';
    return;
  }
  panel.classList.remove('hidden');

  // Only rebuild if affordability changed (gold/wood changes)
  const newHash=`${resources.gold}|${resources.wood}`;
  if (newHash===lastBuildPanelHash) return;
  lastBuildPanelHash=newHash;

  const defs=[
    {type:'barracks',       icon:'⚔️',  label:'Barracks'},
    {type:'farm',           icon:'🌾',  label:'Farm'},
    {type:'lumber_mill',    icon:'🪵',  label:'Lumber'},
    {type:'tower',          icon:'🗼',  label:'Tower'},
    {type:'blacksmith',     icon:'🔨',  label:'Blacksmith'},
    {type:'mage_tower',     icon:'✨',  label:'Mage Twr'},
    {type:'stable',         icon:'🐴',  label:'Stable'},
    {type:'siege_workshop', icon:'🪨',  label:'Siege Wksp'},
    {type:'temple',         icon:'⛩️', label:'Temple'},
    {type:'tavern',         icon:'🍺',  label:'Tavern'},
  ];
  const btns=document.getElementById('buildPanelButtons');
  if (!btns) return;
  let html='';
  for (const d of defs) {
    const bdef=BDEF[d.type];
    const canAfford=resources.gold>=bdef.cost.gold&&resources.wood>=bdef.cost.wood;
    html+=`<button class="build-panel-btn${canAfford?'':' disabled'}" onclick="clickBuildMode('${d.type}')" title="${bdef.name}: ${bdef.cost.gold}💰 ${bdef.cost.wood}🪵">
      <span class="bpb-icon">${d.icon}</span>
      <span class="bpb-label">${d.label}</span>
      <span class="bpb-cost">${bdef.cost.gold}💰 ${bdef.cost.wood}🪵</span>
    </button>`;
  }
  btns.innerHTML=html;
}

function renderSelectionPanel() {
  const info=document.getElementById('selectionInfo');
  const actions=document.getElementById('actionButtons');
  const sel=[...selectedIds].map(id=>getEntity(id)).filter(Boolean);

  if (!sel.length) {
    const newHash='empty';
    if (newHash===lastSelPanelHash) return;
    lastSelPanelHash=newHash;
    info.innerHTML='<div class="no-selection">Select units or buildings<br><small>Left-click to select · Drag to box-select</small></div>';
    actions.innerHTML='';
    drawPortrait(null);
    return;
  }

  if (sel.length===1) {
    const e=sel[0];
    drawPortrait(e);
    if (e.isUnit) {
      const def=UDEF[e.type];
      const hpf=e.hp/e.maxHp;
      const hpColor=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
      const newHash=`${e.id}|${Math.ceil(e.hp)}|${e.state}|${e.carryGold}|${e.carryWood}|${e.isHero?e.level+':'+e.xp:''}`;
      if (newHash!==lastSelPanelHash) {
        lastSelPanelHash=newHash;
        info.innerHTML=`
          <div class="entity-name">${def.name}${e.owner==='ai'?' [AI]':e.owner==='neutral'?' [Neutral]':''}</div>
          <div class="entity-hpbar"><div class="entity-hpbar-fill" style="width:${hpf*100}%;background:${hpColor}"></div></div>
          <div class="entity-stat">HP ${Math.ceil(e.hp)}/${e.maxHp} | Armor: ${e.armor||0}</div>
          ${e.isHero?`<div class="entity-stat">Lv ${e.level} · XP ${e.xp} | ATK ${e.damage}</div>`:''}
          <div class="entity-stat">State: ${e.state.replace(/_/g,' ')}</div>
          ${e.carryGold?`<div class="entity-stat">Carrying: ${e.carryGold} 💰</div>`:''}
          ${e.carryWood?`<div class="entity-stat">Carrying: ${e.carryWood} 🪵</div>`:''}
        `;
        // Only show train buttons (not build – that's in the side panel now)
        actions.innerHTML='';
      }
    } else {
      const def=BDEF[e.type];
      const hpf=e.hp/e.maxHp;
      const hpColor=hpf>0.5?'#4caf50':hpf>0.25?'#ff9800':'#f44336';
      const trainName=e.state==='training'&&e.trainQueue.length?UDEF[e.trainQueue[0]].name:'';
      const newHash=`${e.id}|${Math.ceil(e.hp)}|${e.state}|${trainName}|${e.trainQueue.length}|${resources.gold}|${pop.cur}`;
      if (newHash!==lastSelPanelHash) {
        lastSelPanelHash=newHash;
        info.innerHTML=`
          <div class="entity-name">${def.name}${e.owner==='ai'?' [AI]':''}</div>
          <div class="entity-hpbar"><div class="entity-hpbar-fill" style="width:${hpf*100}%;background:${hpColor}"></div></div>
          <div class="entity-stat">HP ${Math.ceil(e.hp)}/${e.maxHp}</div>
          <div class="entity-stat">${e.state==='construction'?`Building… ${(e.buildProg*100)|0}%`:trainName?`Training: ${trainName}`:'Ready'}</div>
          ${e.trainQueue&&e.trainQueue.length>1?`<div class="entity-stat">Queue: ${e.trainQueue.length}</div>`:''}
        `;
        if (e.owner==='player'&&def.trains&&def.trains.length&&e.state!=='construction') {
          actions.innerHTML=trainButtons(e);
        } else {
          actions.innerHTML='';
        }
      }
    }
  } else {
    drawPortrait(null);
    const uCount=sel.filter(e=>e.isUnit).length;
    const newHash=`multi:${sel.length}`;
    if (newHash!==lastSelPanelHash) {
      lastSelPanelHash=newHash;
      info.innerHTML=`<div class="entity-name">${sel.length} selected</div><div class="entity-stat">${uCount} unit${uCount!==1?'s':''}</div>`;
      actions.innerHTML='';
    }
  }
}

function trainButtons(building) {
  const def=BDEF[building.type];
  const icons={worker:'👷',soldier:'⚔️',archer:'🏹',knight:'🛡️',mage:'🧙',cavalry:'🐴',catapult:'🪨',priest:'✝️',hero:'⭐'};
  let html='<div class="action-group"><div class="action-label">Train:</div>';
  for (const utype of def.trains) {
    const udef=UDEF[utype];
    const canAfford=resources.gold>=udef.cost.gold&&resources.wood>=udef.cost.wood&&pop.cur<pop.max;
    html+=`<button class="action-btn${canAfford?'':' disabled'}" onclick="clickTrain(${building.id},'${utype}')" title="${udef.name}: ${udef.cost.gold}💰 ${udef.cost.wood}🪵">
      ${icons[utype]||'👤'} ${udef.name}<small>${udef.cost.gold}💰 ${udef.cost.wood}🪵</small>
    </button>`;
  }
  // Rally point button for training buildings
  html+=`<button class="action-btn" onclick="clickSetRally(${building.id})" title="Set rally point for newly trained units">📍 Set Rally</button>`;
  return html+'</div>';
}

function clickBuildMode(type) { buildMode={type}; rallyMode=null; }

function clickSetRally(bId) { rallyMode=bId; buildMode=null; }

function clickTrain(bId,utype) {
  const b=getEntity(bId); if (!b) return;
  const udef=UDEF[utype];
  if (resources.gold<udef.cost.gold||resources.wood<udef.cost.wood) {
    addNote('Not enough resources!',b.x+TS,b.y,'#ff6666'); return;
  }
  if (pop.cur>=pop.max) {
    addNote('Population cap! Build a Farm.',b.x+TS,b.y,'#ff6666'); return;
  }
  resources.gold-=udef.cost.gold; resources.wood-=udef.cost.wood;
  b.trainQueue.push(utype);
}

function toggleHelp() {
  document.getElementById('helpOverlay').classList.toggle('hidden');
}

// ==================== SAVE / LOAD ====================
function saveGame() {
  const saveData={
    resources, pop, aiResources, aiPop,
    camera, frame,
    aiState, aiFrame, aiBuildAttempted,
    MW, MH,
    mapRows: Array.from({length:MH},(_,y)=>Array.from(map[y])),
    tileHP:{...tileHP},
    entities:entities.map(e=>({...e,path:[],vx:0,vy:0,stuckTimer:0})),
    eid,
  };
  localStorage.setItem('empera_save',JSON.stringify(saveData));
  addNote('Game Saved!',camera.x+gameW/2,camera.y+(gameH-44-130)/2,'#88ff88');
}

function loadGame() {
  const raw=localStorage.getItem('empera_save');
  if (!raw) {
    addNote('No save found!',camera.x+gameW/2,camera.y+(gameH-44-130)/2,'#ff8888');
    return;
  }
  try {
    const d=JSON.parse(raw);
    MW=d.MW||80; MH=d.MH||60;
    resources=d.resources; pop=d.pop;
    aiResources=d.aiResources; aiPop=d.aiPop;
    camera=d.camera; frame=d.frame;
    aiState=d.aiState; aiFrame=d.aiFrame; aiBuildAttempted=d.aiBuildAttempted||false;
    map=d.mapRows.map(row=>new Uint8Array(row));
    tileHP=d.tileHP;
    entities=d.entities.map(e=>({...e,path:[],vx:0,vy:0,stuckTimer:0,lastX:e.x,lastY:e.y}));
    eid=d.eid;
    selectedIds.clear();
    buildMode=null;
    addNote('Game Loaded!',camera.x+gameW/2,camera.y+(gameH-44-130)/2,'#88ff88');
  } catch(err) {
    addNote('Load failed!',camera.x+gameW/2,camera.y+(gameH-44-130)/2,'#ff8888');
  }
}

function saveOptions() {
  localStorage.setItem('empera_options',JSON.stringify({showGrid,soundEnabled,musicVolume}));
}

function loadOptions() {
  const raw=localStorage.getItem('empera_options');
  if (!raw) return;
  try {
    const o=JSON.parse(raw);
    showGrid=o.showGrid||false;
    soundEnabled=o.soundEnabled!==undefined?o.soundEnabled:true;
    musicVolume=o.musicVolume||50;
    const gc=document.getElementById('optShowGrid');
    const sc=document.getElementById('optSoundEnabled');
    const mv=document.getElementById('optMusicVolume');
    const mvv=document.getElementById('musicVolumeVal');
    if (gc) gc.checked=showGrid;
    if (sc) sc.checked=soundEnabled;
    if (mv) mv.value=musicVolume;
    if (mvv) mvv.textContent=musicVolume;
  } catch(e) {}
}

// ==================== VICTORY / DEFEAT ====================
function checkWinCondition() {
  const playerHall=entities.find(e=>!e.isUnit&&e.type==='main_hall'&&(e.owner||'player')==='player');
  const aiHall=entities.find(e=>!e.isUnit&&e.type==='main_hall'&&e.owner==='ai');
  if (!playerHall&&gamePhase==='playing') showDefeat();
  if (!aiHall&&gamePhase==='playing')    showVictory();
}

function showVictory() {
  gamePhase='victory';
  const el=document.getElementById('victoryOverlay');
  el.classList.remove('hidden');
  const score=document.getElementById('victoryScore');
  score.textContent=`Time: ${Math.floor(frame/60)}s · Gold earned: ${Math.floor(resources.gold)}`;
}

function showDefeat() {
  gamePhase='defeat';
  document.getElementById('defeatOverlay').classList.remove('hidden');
}

function restartGame() {
  document.getElementById('victoryOverlay').classList.add('hidden');
  document.getElementById('defeatOverlay').classList.add('hidden');
  if (lastConfig) startGame(lastConfig);
  else backToMenu();
}

function backToMenu() {
  gamePhase='menu';
  document.getElementById('victoryOverlay').classList.add('hidden');
  document.getElementById('defeatOverlay').classList.add('hidden');
  document.getElementById('helpOverlay').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  buildMode=null;
  selectedIds.clear();
}

// ==================== INPUT ====================
function onMouseDown(e) {
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  mouse.x=e.clientX-rect.left; mouse.y=e.clientY-rect.top;
  mouse.wx=mouse.x+camera.x;   mouse.wy=mouse.y+camera.y;

  // Ignore clicks in the bottom panel area
  if (e.clientY>window.innerHeight-130) return;
  // Ignore clicks in top HUD
  if (e.clientY<44) return;
  // Ignore clicks in build panel (right side)
  const bp=document.getElementById('buildPanel');
  if (bp&&!bp.classList.contains('hidden')&&e.clientX>window.innerWidth-150) return;

  if (e.button===0) {
    // Rally mode: left-click sets rally
    if (rallyMode) {
      const b=getEntity(rallyMode);
      if (b) { b.rallyX=mouse.wx; b.rallyY=mouse.wy; addNote('📍 Rally set!',mouse.wx,mouse.wy,'#00ff88'); }
      rallyMode=null;
      return;
    }

    mouse.down=true; mouse.downX=mouse.x; mouse.downY=mouse.y;
    selBox.x1=mouse.x; selBox.y1=mouse.y; selBox.x2=mouse.x; selBox.y2=mouse.y;

    if (buildMode) {
      const {tx,ty}=w2t(mouse.wx,mouse.wy);
      const def=BDEF[buildMode.type];
      if (resources.gold<def.cost.gold||resources.wood<def.cost.wood) {
        addNote('Not enough resources!',mouse.wx,mouse.wy,'#ff6666'); return;
      }
      let valid=true;
      for (let dy=0;dy<def.size&&valid;dy++)
        for (let dx=0;dx<def.size&&valid;dx++)
          if (!walkable(tx+dx,ty+dy)||tileOccupied(tx+dx,ty+dy)) valid=false;
      if (!valid) { addNote('Cannot build here!',mouse.wx,mouse.wy,'#ff6666'); return; }
      resources.gold-=def.cost.gold; resources.wood-=def.cost.wood;
      const bld=makeBuilding(buildMode.type,tx,ty,false,'player');
      for (const id of selectedIds) {
        const u=getEntity(id);
        if (u&&u.isUnit&&u.canBuild) cmdBuild(u,bld.id);
      }
      buildMode=null;
      lastBuildPanelHash=''; // force rebuild to update afford state
      return;
    }
  } else if (e.button===2) {
    if (rallyMode) { rallyMode=null; return; }
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
    if (buildMode||rallyMode) { mouse.down=false; selBox.active=false; return; }
    if (selBox.active) {
      const wx1=Math.min(selBox.x1,selBox.x2)+camera.x;
      const wy1=Math.min(selBox.y1,selBox.y2)+camera.y;
      const wx2=Math.max(selBox.x1,selBox.x2)+camera.x;
      const wy2=Math.max(selBox.y1,selBox.y2)+camera.y;
      if (!e.shiftKey) selectedIds.clear();
      for (const en of entities)
        if (en.isUnit&&en.owner==='player'&&en.x>=wx1&&en.x<=wx2&&en.y>=wy1&&en.y<=wy2)
          selectedIds.add(en.id);
    } else {
      const wx=mouse.downX+camera.x, wy=mouse.downY+camera.y;
      // Only select if not in panel areas
      if (mouse.downY>window.innerHeight-130||mouse.downY<44) {
        mouse.down=false; selBox.active=false; return;
      }
      const bp=document.getElementById('buildPanel');
      if (bp&&!bp.classList.contains('hidden')&&mouse.downX>window.innerWidth-150) {
        mouse.down=false; selBox.active=false; return;
      }
      if (!e.shiftKey) selectedIds.clear();
      let hit=null;
      for (const en of entities)
        if (en.isUnit&&d2(wx,wy,en.x,en.y)<=en.size+6) { hit=en; break; }
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
      lastSelPanelHash=''; // force UI update on click
    }
    mouse.down=false; selBox.active=false;
  }
}

function issueRightClick(wx,wy,shift) {
  const {tx,ty}=w2t(wx,wy);
  const tileT=map[ty]&&map[ty][tx];
  const units=[...selectedIds].map(id=>getEntity(id)).filter(e=>e&&e.isUnit&&e.owner==='player');
  if (!units.length) return;

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
      if (tgtEntity.owner===u.owner) {
        // Right-click own building = send to repair (build)
        if (!tgtEntity.isUnit && tgtEntity.hp<tgtEntity.maxHp && u.canBuild) { cmdBuild(u,tgtEntity.id); }
      } else {
        u.target=tgtEntity.id; u.state='attacking'; u.path=[];
      }
    } else if ((tileT===T_GOLD||tileT===T_TREE)&&u.canGather) {
      cmdGather(u,tx,ty);
    } else {
      const spread=units.length>1?30:0;
      cmdMove(u,wx+(Math.random()-0.5)*spread,wy+(Math.random()-0.5)*spread);
    }
  }
}

function onKeyDown(e) {
  keys[e.code]=true;
  if (gamePhase!=='playing') return;
  if (e.code==='Escape') { buildMode=null; rallyMode=null; selectedIds.clear(); lastSelPanelHash=''; }
  if (e.code==='KeyA'&&!e.ctrlKey&&!e.metaKey) {
    selectedIds.clear();
    for (const en of entities) {
      if (!en.isUnit||en.owner!=='player') continue;
      const {x:sx,y:sy}=w2s(en.x,en.y);
      if (sx>=0&&sx<=gameW&&sy>=44&&sy<=gameH-130) selectedIds.add(en.id);
    }
    lastSelPanelHash='';
  }
  if (e.code==='KeyH') {
    const hall=entities.find(e=>!e.isUnit&&e.type==='main_hall'&&(e.owner||'player')==='player');
    if (hall) {
      camera.x=hall.x-gameW/2+BDEF.main_hall.size*TS/2;
      camera.y=hall.y-(gameH-44-130)/2+BDEF.main_hall.size*TS/2;
    }
  }
  // P = set patrol for selected units
  if (e.code==='KeyP') {
    const units=[...selectedIds].map(id=>getEntity(id)).filter(e=>e&&e.isUnit&&e.owner==='player');
    for (const u of units) {
      if (u.state==='patrolling') { u.state='idle'; u.patrolA=null; u.patrolB=null; }
      else if (!u.patrolA) {
        u.patrolA={x:u.x,y:u.y};
        addNote('Patrol A set',u.x,u.y,'#88aaff');
      } else {
        u.patrolB={x:u.x,y:u.y};
        u.state='patrolling'; u.patrolTarget=1;
        addNote('Patrolling!',u.x,u.y,'#88aaff');
      }
    }
  }
}
function onKeyUp(e)   { delete keys[e.code]; }
function onCtxMenu(e) { e.preventDefault(); }

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
  if (keys['ArrowLeft'])  camera.x-=s;
  if (keys['ArrowRight']) camera.x+=s;
  if (keys['ArrowUp'])    camera.y-=s;
  if (keys['ArrowDown'])  camera.y+=s;

  if (mouse.y>44&&mouse.y<gameH-130) {
    if (mouse.x<EDGE_ZONE)            camera.x-=s;
    if (mouse.x>gameW-EDGE_ZONE)      camera.x+=s;
    if (mouse.y<44+EDGE_ZONE)         camera.y-=s;
    if (mouse.y>gameH-130-EDGE_ZONE)  camera.y+=s;
  }

  camera.x=clamp(camera.x,0,Math.max(0,MW*TS-gameW));
  camera.y=clamp(camera.y,0,Math.max(0,MH*TS-(gameH-44-130)));
}

// ==================== MENU LOGIC ====================
function showMenuSection(section) {
  document.getElementById('menuMain').classList.add('hidden');
  const sections=['skirmish','campaign','options','credits','exitConfirm'];
  for (const s of sections) {
    const el=document.getElementById('menu'+s.charAt(0).toUpperCase()+s.slice(1));
    if (el) el.classList.add('hidden');
  }
  const target=document.getElementById('menu'+section.charAt(0).toUpperCase()+section.slice(1));
  if (target) target.classList.remove('hidden');
}

function showMenuMain() {
  const sections=['skirmish','campaign','options','credits','exitConfirm'];
  for (const s of sections) {
    const el=document.getElementById('menu'+s.charAt(0).toUpperCase()+s.slice(1));
    if (el) el.classList.add('hidden');
  }
  document.getElementById('menuMain').classList.remove('hidden');
}

function startGameFromMenu() {
  const mapSizeEl=document.querySelector('input[name="mapSize"]:checked');
  const aiPlayersEl=document.querySelector('input[name="aiPlayers"]:checked');
  const mapThemeEl=document.querySelector('input[name="mapTheme"]:checked');
  const startArmyEl=document.querySelector('input[name="startArmy"]:checked');
  const config={
    mapSize:  mapSizeEl  ? mapSizeEl.value  : 'medium',
    aiCount:  aiPlayersEl? parseInt(aiPlayersEl.value) : 1,
    mapTheme: mapThemeEl ? mapThemeEl.value : 'random',
    startArmy:startArmyEl? startArmyEl.value : 'none',
  };
  startGame(config);
}

function spawnNeutrals() {
  // Find forest areas (away from both bases) to place packs
  const minDist=15; // tiles away from corners
  const spawnPoints=[];
  for (let attempts=0;attempts<200;attempts++) {
    const tx=5+Math.floor(Math.random()*(MW-10));
    const ty=5+Math.floor(Math.random()*(MH-10));
    if (!walkable(tx,ty)) continue;
    // Keep away from player start (9,9) and AI corner
    const aisx=Math.max(5,MW-22), aisy=Math.max(5,MH-22);
    if (d2(tx*TS,ty*TS,9*TS,9*TS)<minDist*TS) continue;
    if (d2(tx*TS,ty*TS,aisx*TS,aisy*TS)<minDist*TS) continue;
    spawnPoints.push({tx,ty});
    if (spawnPoints.length>=8) break;
  }

  // Wolf packs (2-4 wolves each, near forests)
  const wolfSpawns=Math.min(3,Math.floor(spawnPoints.length/2));
  for (let i=0;i<wolfSpawns;i++) {
    const sp=spawnPoints[i];
    const count=2+Math.floor(Math.random()*3);
    for (let j=0;j<count;j++) {
      makeUnit('wolf',(sp.tx+j-1)*TS+TS/2,(sp.ty+(j%2))*TS+TS/2,'neutral');
    }
  }

  // Deer (1-3 each, in open areas)
  const deerSpawns=Math.min(2,spawnPoints.length-wolfSpawns);
  for (let i=wolfSpawns;i<wolfSpawns+deerSpawns;i++) {
    const sp=spawnPoints[i];
    const count=1+Math.floor(Math.random()*3);
    for (let j=0;j<count;j++) {
      makeUnit('deer',(sp.tx+j)*TS+TS/2,(sp.ty)*TS+TS/2,'neutral');
    }
  }

  // Treant (rare, 1-2 total, in dense forests)
  if (spawnPoints.length>wolfSpawns+deerSpawns) {
    const sp=spawnPoints[wolfSpawns+deerSpawns];
    // Find a tree tile nearby
    for (let r=0;r<5;r++) {
      const ftx=sp.tx+Math.round((Math.random()-0.5)*4);
      const fty=sp.ty+Math.round((Math.random()-0.5)*4);
      if (ftx>=0&&fty>=0&&ftx<MW&&fty<MH&&walkable(ftx,fty)) {
        makeUnit('treant',ftx*TS+TS/2,fty*TS+TS/2,'neutral');
        break;
      }
    }
  }
}

function startGame(config) {
  lastConfig=config;

  // Set map dimensions
  if (config.mapSize==='small')       { MW=40; MH=30; }
  else if (config.mapSize==='large')  { MW=120; MH=90; }
  else                                 { MW=80; MH=60; }

  // Reset state
  entities=[];
  selectedIds.clear();
  buildMode=null;
  rallyMode=null;
  frame=0;
  resources={ gold:200, wood:150 };
  pop={ cur:0, max:10 };
  notes=[];
  projectiles=[];
  eid=0;
  aiResources={ gold:300, wood:200 };
  aiPop={ cur:0, max:10 };
  aiState='gathering';
  aiFrame=0;
  aiBuildAttempted=false;
  lastBuildPanelHash='';
  lastSelPanelHash='';
  gamePhase='playing';

  generateMap(config.mapTheme);

  // Player start
  const hall=makeBuilding('main_hall',9,9,true,'player');
  makeUnit('worker',12*TS+TS/2,14*TS,  'player');
  makeUnit('worker',13*TS+TS/2,14*TS,  'player');
  makeUnit('worker',14*TS+TS/2,14*TS,  'player');

  // Starting army option
  const army=config.startArmy||'none';
  if (army==='small') {
    makeUnit('soldier',15*TS,12*TS,'player');
    makeUnit('soldier',16*TS,12*TS,'player');
    makeUnit('archer', 17*TS,12*TS,'player');
  } else if (army==='large') {
    for (let i=0;i<3;i++) makeUnit('knight',(15+i)*TS,11*TS,'player');
    for (let i=0;i<3;i++) makeUnit('soldier',(15+i)*TS,13*TS,'player');
    makeUnit('archer',18*TS,11*TS,'player');
    makeUnit('archer',18*TS,13*TS,'player');
  }

  // AI start (bottom-right corner)
  const aisx=Math.max(5,MW-22), aisy=Math.max(5,MH-22);
  makeBuilding('main_hall',aisx,aisy,true,'ai');
  makeUnit('worker',(aisx+4)*TS,(aisy+3)*TS,'ai');
  makeUnit('worker',(aisx+5)*TS,(aisy+3)*TS,'ai');

  // Spawn neutral creatures in wilderness
  spawnNeutrals();

  // Center camera on player hall
  camera.x=clamp(9*TS-gameW/2+BDEF.main_hall.size*TS/2, 0, Math.max(0,MW*TS-gameW));
  camera.y=clamp(9*TS-(gameH-44-130)/2+BDEF.main_hall.size*TS/2, 0, Math.max(0,MH*TS-(gameH-44-130)));

  // Hide menu and overlays
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('victoryOverlay').classList.add('hidden');
  document.getElementById('defeatOverlay').classList.add('hidden');
  document.getElementById('helpOverlay').classList.add('hidden');

  // Start loop if not running
  if (!loopRunning) { loopRunning=true; requestAnimationFrame(gameLoop); }
}

// ==================== GAME LOOP ====================
let lastUIUpdate=0;

function gameLoop(ts) {
  if (gamePhase==='menu') { requestAnimationFrame(gameLoop); return; }

  frame++;

  updateCamera();

  for (const e of [...entities]) {
    if (!e) continue;
    if (e.isUnit) updateUnit(e);
    else          updateBuilding(e);
  }

  // Remove dead entities
  for (let i=entities.length-1;i>=0;i--) {
    if (entities[i].hp<=0) removeEntity(entities[i].id);
  }

  updateProjectiles();

  // Notifications
  for (let i=notes.length-1;i>=0;i--) {
    const n=notes[i]; n.life++; n.y-=0.6;
    if (n.life>=n.maxLife) notes.splice(i,1);
  }

  updateAI();

  // Victory/defeat check every 60 frames
  if (frame%60===0) checkWinCondition();

  render();

  if (ts-lastUIUpdate>100) { updateUI(); lastUIUpdate=ts; }

  requestAnimationFrame(gameLoop);
}

// ==================== INIT ====================
function init() {
  canvas=document.getElementById('gameCanvas');
  ctx=canvas.getContext('2d');
  mmCanvas=document.getElementById('minimap');
  mmCtx=mmCanvas.getContext('2d');
  portraitCanvas=document.getElementById('portraitCanvas');
  portraitCtx=portraitCanvas.getContext('2d');

  gameW=window.innerWidth;
  gameH=window.innerHeight;
  canvas.width=gameW; canvas.height=gameH;

  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mousemove',  onMouseMove);
  canvas.addEventListener('mouseup',    onMouseUp);
  canvas.addEventListener('contextmenu',onCtxMenu);
  document.addEventListener('keydown',  onKeyDown);
  document.addEventListener('keyup',    onKeyUp);
  mmCanvas.addEventListener('click',    onMinimapClick);

  window.addEventListener('resize',()=>{
    gameW=window.innerWidth; gameH=window.innerHeight;
    canvas.width=gameW; canvas.height=gameH;
  });

  loadOptions();

  // Start the loop (will idle on menu phase)
  loopRunning=true;
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load',init);
