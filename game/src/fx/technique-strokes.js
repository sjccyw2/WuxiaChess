// Ink strokes for the active arts, and six that only villain signatures still borrow. The ten
// heroes from the roster pack borrow the marks of the first ten; each has its own note.
// The action's stable ID owns its paint, even when the same manual is used by different
// heroes. Coordinates in the recipes are tile units.
const RECIPES = {
  'signature:hero': ['石壁劍招','slate','thrust','swordBind','snap','石壁上刻下的劍招一線穿出，劍鋒從護手旁掠過。'],
  ninefoldFormula: ['總訣式','steel','fan','nineFan','snap','九柄劍影張扇，劍尖同指一處。'],
  breakSword: ['破劍式','steel','thrust','swordBind','snap','劍鋒相交，一線從對方的護手旁穿出。'],
  breakArrow: ['破箭式','pearl','dart','splitFletch','quick','一劍截斷帶羽的箭桿，兩節向外彈開。'],
  starSuction: ['吸星大法','obsidian','return','seaFunnel','return','暗色漩渦逐層內收，一束內息流回掌心。'],
  breakQi: ['破氣式','violet','beam','cutVein','pulse','紫白劍線刺破三層斷開的氣環。'],
  ninefoldIntent: ['獨孤九劍','gold','fan','wheelNine','echo','九劍循圓換位，最後一劍斜貫圓心。'],

  'signature:youth': ['總訣式','slate','thrust','swordBind','snap','一劍尋著來路上的空處，搶先點到。'],
  youthBreakSword: ['破劍式','steel','thrust','swordBind','snap','劍鋒相交，一線從對方的護手旁穿出。'],
  youthBreakBlade: ['破刀式','frost','thrust','swordBind','quick','輕劍貼著厚重的刀背滑入，卸去刀勢。'],
  youthBreakPole: ['破槍式','slate','thrust','swordBind','heavy','劍尖沿著長桿欺進圈內，一震而開。'],
  youthBreakSoft: ['破索式','pearl','dart','splitFletch','quick','劍尖搭上軟索一絞，索梢斷作兩截彈開。'],
  youthBreakMace: ['破鞭式','bronze','thrust','brokenPalm','snap','薄刃從沉重兵刃的縫隙中遞入。'],
  youthBreakArrow: ['破箭式','pearl','dart','splitFletch','quick','一劍截斷帶羽的箭桿，兩節向外彈開。'],
  youthBreakHand: ['破掌式','bronze','thrust','brokenPalm','snap','薄刃從掌影的指縫穿過。'],
  youthBreakQi: ['破氣式','violet','beam','cutVein','pulse','紫白劍線刺破三層斷開的氣環。'],

  'signature:medic': ['清心普善咒','jade','strings','quietSong','glide','古琴橫陳，琴面的一道弦波渡到傷處。'],
  blackNeedle: ['黑血神針','obsidian','dart','blackQuiver','quick','五枚烏針成束疾出，針尾留下一點暗紅。'],
  returningSong: ['回春','peach','blossom','springTune','glide','一枝春花沿著琴音次第展開。'],
  qinXiaoRally: ['琴簫引','jade','strings','qinXiao','echo','橫琴與斜簫相和，兩道弦波交織。'],
  saintessOrder: ['聖姑令','violet','banner','warPennant','gather','繫著三枚指令帶的令旗下展，陣線隨旗立起。'],
  clearHeartCoda: ['笑傲江湖','pearl','strings','lotusChord','echo','五絃收於同一朵白蓮，花開後仍留金線。'],

  'signature:guard': ['吸功入地小法','slate','plunge','earthRoot','heavy','下沉的勁線壓入層岩，石脊從兩側隆起。'],
  chainShelter: ['鐵索並肩','steel','lattice','chainFence','gather','兩根短柱之間搭起交錯的護身鐵鏈。'],
  sweepingWhip: ['長鞭破陣','bronze','lash','whipArc','sweep','鐵索節節甩開，倒鉤掠過一道長弧。'],
  reverseForce: ['返勁','slate','return','returnHook','return','兩道鉤力回卷，鐵環沿原路收回。'],
  bloodAtPass: ['捨身截騎','cinnabar','thrust','gateSpike','heavy','赤色鐵錐從傾倒的關柵間直出。'],
  earthThroughChain: ['涼亭鐵鏈','slate','wave','chainBridge','echo','鏈身平鋪跨過三段石樑，餘勁從橋面散開。'],

  'signature:guo': ['分筋錯骨手','bronze','thrust','wristHook','snap','彎鉤扣住一道腕環，短白勁橫過圓心。'],
  kanglongRegret: ['亢龍有悔','gold','dragon','dragonHead','heavy','金龍昂首出掌，龍鬚卷向受掌之人。'],
  guoPairedHands: ['左右互搏術','gold','twins','crossedHands','double','左右手各走一路，前直後橫，交擊有別。'],
  fieldDragonWard: ['見龍在田','bamboo','lattice','scaleWard','gather','龍鱗逐排合起，結成低伏的掌牆。'],
  flyingDragon: ['飛龍在天','gold','plunge','skyDragon','heavy','龍首從高處折下，三道雲痕往下壓。'],
  armyBookRally: ['合陣','cinnabar','banner','warPennant','gather','繫著三枚指令帶的軍旗下展，陣線隨旗立起。'],
  dragonReserve: ['降龍十八掌','bronze','dragon','dragonEcho','echo','前龍甩首後，第二道小龍影從反面折回。'],

  'signature:xiao': ['天羅地網勢','pearl','steps','sparrowNet','glide','飛雀一高一低，從細索織成的網眼間穿過。'],
  jadeNeedle: ['玉蜂針','bamboo','bee','jadeSwarm','quick','幾隻玉蜂繞弧撲近，雙翼開合後露出針尾。'],
  silkBell: ['金鈴索','bronze','lash','silkBells','sweep','兩條紅綢分頭回旋，兩枚金鈴錯拍落下。'],
  jadeHeart: ['玉女心經','pearl','twins','pairedLotus','double','兩柄纖劍向相反方向張開，在蓮心處交鋒。'],
  pairedHands: ['左右互搏術','jade','twins','crossedHands','double','左右手各走一條劍路，前直後橫，交擊有別。'],
  maidenHarmony: ['玉女素心劍法','pearl','twins','twinHarmony','echo','兩柄長劍成合璧雙弧，白花從交點綻開。'],

  'signature:duan': ['北冥神功','sea','return','seaFunnel','return','墨藍水渦逐層內收，一束內息流回掌心。'],
  shangYang: ['商陽劍','violet','beam','narrowPoint','quick','一線食指劍氣如錐直行，穿過菱形氣眼。'],
  ripplingSteps: ['凌波微步','violet','steps','baguaStep','glide','足尖交錯踏上八卦斷爻，再從另一端現身。'],
  lesserMarsh: ['少澤劍','sea','ripple','marshPoint','snap','細指光撇開蘆葉，三滴水珠向旁迸出。'],
  guanChong: ['關衝劍','slate','ripple','marshPoint','heavy','拙重的指光撇開蘆葉，三滴水珠向旁迸出。'],
  shaoShang: ['少商劍','gold','beams','sixFan','snap','數道金色指光由一點扇形發出。'],
  sixMeridians: ['六脈齊發','violet','beams','sixLanes','echo','六條平行劍路逐一點亮，末道貼著前五道收束。'],

  'signature:huang': ['蘭花拂穴手','violet','blossom','orchidPoint','quick','三片蘭瓣拂過，細小穴點在瓣根亮起。'],
  peachWard: ['五行布陣','peach','lattice','peachLattice','gather','桃花落在五角陣眼，格紋在花下鎖合。'],
  beggarBind: ['纏字訣','bamboo','coil','staffSnare','return','一條繩圈纏住兵刃，竹節反向一攪。'],
  beggarTrip: ['絆字訣','bamboo','lash','bambooStaff','sweep','青竹杖節分明，紅穗在橫掃的杖尾收住。'],
  peachGate: ['開生門','peach','steps','peachGate','glide','兩株桃枝向兩側打開，花下露出生門。'],
  staffWithoutDogs: ['天下無狗','bamboo','fan','staffFan','echo','五道竹杖扇開，最重的一杖橫掃扇骨。'],

  'signature:yang': ['蛤蟆功','bronze','leap','toadLeap','heavy','伏地蟾影伸展雙腿，貼著低弧彈起。'],
  quanzhenSword: ['全真劍法','steel','coil','taijiBlade','sweep','一輪墨痕圓弧留有缺口，實劍從缺口出鋒。'],
  jadeFluteCut: ['玉簫劍法','jade','beam','fluteSword','snap','碧玉橫簫越過斜出的細劍，孔眼一線分明。'],
  tideBreaker: ['擊流','slate','wave','ironTide','heavy','厚重玄鐵劍切開浪頭，碎浪朝兩旁翻起。'],
  mournfulCloud: ['杞人憂天','cinnabar','mist','grievingCloud','sweep','兩層暗雲裂開，朱紅落掌從縫隙墜下。'],
  solitaryPalm: ['黯然銷魂掌','cinnabar','palm','lonelyPalm','heavy','一枚朱掌獨落，指尖帶出飄散的墨灰。'],

  'signature:zhang': ['蝶谷醫術','bamboo','pulse','valleyPulse','pulse','雙葉之間的一段脈線由紊亂轉為平緩。'],
  nineYangMantle: ['九陽護體','gold','halo','sunShell','gather','朝陽從三重護脈氣弧中升起，九線護住心口。'],
  qiankunYield: ['卸力','jade','coil','shiftCircle','glide','一陰一陽兩股墨弧在掌前互換位置。'],
  qiankunShove: ['移勁','jade','return','returnHook','return','兩道鉤力回卷，把來勁沿原路送回。'],
  holyFireTurn: ['聖火令武功','ember','plunge','fireTablets','snap','三枚火令斜插盤旋，令心的刻焰反向撩起。'],
  qiankunSeventh: ['第七層','jade','lattice','heavenCanopy','echo','飛簷形的護氣展作華蓋，垂穗護住蓋下眾人。'],

  'signature:hu': ['胡家刀法','frost','draw','snowSaber','snap','寬背雪刀橫過，留下一道冰白刀痕。'],
  snowPursuit: ['四象步','frost','steps','foxTracks','quick','三組狐爪在浮雪上由密至疏，最後一爪帶起碎雪。'],
  foxFeint: ['懷中抱月','frost','draw','foxFeint','double','先出半道斷刀影，再從另一側翻腕出鋒。'],
  silkwormPalm: ['春蠶掌法','pearl','coil','silkCocoon','glide','細蠶絲纏成橢繭，一縷柔掌從繭口穿出。'],
  miaoSword: ['苗家劍法','pearl','thrust','swordBind','snap','劍鋒相交，一線從對方的護手旁穿出。'],
  heartCut: ['纏身摘心刀','cinnabar','draw','foxFeint','double','先出半道斷刀影，再從另一側翻腕出鋒。'],
  cliffCut: ['懸崖一刀','frost','draw','foxMask','heavy','一道反向刀彎劈出雪狐的耳尖與雙眼。'],

  'signature:qiaoFeng': ['太祖長拳','bronze','palm','lonelyPalm','heavy','一記直拳獨落，拳鋒帶出飄散的墨灰。'],
  qfDragonGrab: ['擒龍功','bronze','return','returnHook','return','兩道鉤力凌空回卷，將人沿原路攝回。'],
  qfRegret: ['亢龍有悔','gold','dragon','dragonHead','heavy','金龍昂首出掌，龍鬚卷向受掌之人。'],
  qfField: ['見龍在田','bamboo','lattice','scaleWard','gather','龍鱗逐排合起，結成低伏的掌牆。'],
  qfWine: ['烈酒添勁','ember','halo','sunShell','gather','一團暖意從三重氣弧中升起，九線護住心口。'],
  qfWild: ['龍戰於野','gold','plunge','skyDragon','heavy','龍首從高處折下，三道雲痕往下壓。'],
  qfEighteen: ['降龍廿八掌','bronze','dragon','dragonEcho','echo','前龍甩首後，第二道小龍影從反面折回。'],

  'signature:xuZhu': ['韋陀掌','gold','palm','lonelyPalm','heavy','一枚金掌端正落下，指尖帶出飄散的墨灰。'],
  xzNorthQi: ['渡氣','sea','beam','healingPoint','pulse','一束真氣只落在一處穴位，三圈暖暈回應。'],
  xzPlum: ['天山折梅手','pearl','thrust','wristHook','snap','彎鉤扣住一道腕環，短白勁橫過圓心。'],
  xzSixYang: ['天山六陽掌','ember','wave','cottonPalm','glide','掌影沉進層疊的雲氣，掌邊陽和之力外散。'],
  xzHeal: ['化符','gold','blossom','springTune','glide','一枝春花沿著掌風次第展開。'],
  xzLifeDeath: ['生死符','frost','frost','iceCrystal','quick','一片薄冰直入，六角晶枝向四周裂開。'],

  'signature:hongQi': ['逍遙遊','bamboo','coil','vacantFist','glide','虛圈留出拳眼，輕拳從圈內探出。'],
  hqTail: ['神龍擺尾','bronze','dragon','dragonEcho','echo','前龍甩首後，第二道小龍影從反面折回。'],
  hqSeal: ['封字訣','bamboo','coil','staffSnare','return','一道棒圈封住來路，竹節反向一攪。'],
  hqShock: ['震驚百里','gold','plunge','skyDragon','heavy','龍首從高處折下，三道雲痕往下壓。'],
  hqTurn: ['轉字訣','bamboo','lash','bambooStaff','sweep','青竹杖節分明，紅穗在橫掃的杖尾收住。'],
  hqThirtySix: ['打狗棒法','bamboo','fan','staffFan','echo','五道竹杖扇開，最重的一杖橫掃扇骨。'],

  'signature:yaoShi': ['落英神劍掌','peach','blossom','orchidPoint','quick','三片落英拂過，一點實掌在瓣根亮起。'],
  ysPalm: ['劈空掌','jade','wave','cottonPalm','glide','掌影沉進層疊的雲氣，掌邊勁力凌空外散。'],
  ysFlute: ['玉簫劍法','jade','beam','fluteSword','snap','碧玉橫簫越過斜出的細劍，孔眼一線分明。'],
  ysMaze: ['五行布陣','peach','lattice','peachLattice','gather','桃花落在五角陣眼，格紋在花下鎖合。'],
  ysSnap: ['彈指神通','bamboo','pebble','flickStone','quick','一枚帶稜青石脫指而出，身後拖著三道短波。'],
  ysWhirl: ['旋風掃葉腿','jade','mist','grievingCloud','sweep','兩層落葉般的雲影裂開，一腿從縫隙掃下。'],
  ysTide: ['碧海潮生曲','sea','strings','qinXiao','echo','簫聲化作兩道弦波交織，一浪疊著一浪。'],

  'signature:sanFeng': ['羅漢拳','bronze','plunge','earthRoot','heavy','下沉的勁線壓入層岩，石脊從兩側隆起。'],
  sfPureYang: ['純陽無極功','gold','halo','sunShell','gather','朝陽從三重護脈氣弧中升起，九線護住心口。'],
  sfSword: ['太極劍','steel','coil','taijiBlade','sweep','一輪墨痕圓弧留有缺口，實劍從缺口出鋒。'],
  sfSeven: ['真武七截陣','jade','banner','warPennant','gather','繫著三枚指令帶的令旗下展，陣線隨旗立起。'],
  sfCloud: ['雲手','jade','coil','shiftCircle','glide','一陰一陽兩股墨弧在掌前互換位置。'],
  sfTaiji: ['太極拳','pearl','coil','shiftCircle','echo','一陰一陽兩股墨弧在掌前互換位置，圓轉不斷。'],

  'signature:zhaoMin': ['萬安寺劍招','steel','thrust','swordBind','snap','一招偷學來的殺著一線穿出，劍鋒從護手旁掠過。'],
  zmPowder: ['十香軟筋散','peach','wave','cottonPalm','glide','藥粉散作層疊的雲絮，綿綿外散。'],
  zmSalve: ['黑玉斷續膏','obsidian','pulse','valleyPulse','pulse','雙葉之間的一段脈線由紊亂轉為平緩。'],
  zmJade: ['玉碎崑岡','pearl','thrust','swordBind','snap','劍鋒相交，一線從對方的護手旁穿出。'],
  zmYitian: ['倚天劍','frost','draw','snowSaber','snap','倚天劍橫過，留下一道冰白劍痕。'],
  zmGhost: ['人鬼同途','cinnabar','thrust','gateSpike','heavy','赤色劍鋒從傾倒的關柵間直出。'],
  zmHeaven: ['天地同壽','cinnabar','beam','cutVein','pulse','朱紅劍線刺破三層斷開的氣環。'],

  'signature:lingSu': ['藥王方脈','bamboo','pulse','valleyPulse','pulse','雙葉之間的一段脈線由紊亂轉為平緩。'],
  lsScorpion: ['赤蠍粉','cinnabar','dart','blackQuiver','quick','五點赤芒成束疾出，尾後留下一點暗紅。'],
  lsGold: ['金針刺穴','gold','beam','healingPoint','quick','一束金線只落在一處穴位，三圈光暈回應。'],
  lsBlue: ['藍花辟毒','sea','steps','peachGate','glide','兩枝藍花向兩側打開，花下露出生路。'],
  lsTihu: ['醍醐香','violet','mist','grievingCloud','sweep','兩層香霧裂開，一縷醉意從縫隙墜下。'],
  lsSeven: ['七心海棠','obsidian','blossom','springTune','glide','一枝海棠沿著燭煙次第展開。'],

  'signature:diYun': ['躺屍劍法','slate','thrust','swordBind','snap','笨拙的一劍直直穿出，劍鋒從護手旁掠過。'],
  dySlap: ['耳光式','slate','draw','foxFeint','double','先晃半道劍影，再從另一側翻腕出手。'],
  dyBlade: ['批紙削腐','cinnabar','draw','snowSaber','snap','一柄血刀橫過，留下一道暗紅刀痕。'],
  dyDisarm: ['去劍式','steel','coil','staffSnare','return','一條劍圈纏住兵刃，反向一攪。'],
  dySweep: ['流星經天','cinnabar','draw','foxFeint','double','先出半道斷刀影，再從另一側翻腕出鋒。'],
  dyShenZhao: ['神照經','gold','palm','sevenCracks','heavy','一掌落下，數道勁力裂紋放射開來。'],

  'signature:chengZhi': ['伏虎掌','bronze','palm','lonelyPalm','heavy','一掌沉沉落下，指尖帶出飄散的墨灰。'],
  czSteps: ['神行百變','jade','steps','baguaStep','glide','足尖交錯踏過數處方位，再從另一端現身。'],
  czCone: ['金蛇錐','gold','beam','narrowPoint','quick','一枚金錐直行，穿過菱形氣眼。'],
  czFist: ['金蛇游身拳','gold','coil','vacantFist','glide','虛圈留出拳眼，輕拳從圈內探出。'],
  czSword: ['游身','gold','thrust','swordBind','snap','金色劍鋒相交，一線從對方的護手旁穿出。'],
  czSerpent: ['金蛇劍法','gold','lash','whipArc','sweep','蛇形劍身節節甩開，倒鉤掠過一道長弧。'],

  'signature:aQing': ['白猿竹枝','bamboo','beam','narrowPoint','quick','一點竹影如錐直行，穿過菱形氣眼。'],
  aqThread: ['竹枝穿陣','bamboo','beam','cutVein','pulse','青白竹影刺破三層斷開的氣環。'],
  aqEyes: ['竹枝點目','bamboo','ripple','marshPoint','snap','細竹尖撇開蘆葉，三滴水珠向旁迸出。'],
  aqApe: ['白猿步','bamboo','steps','foxTracks','quick','三組足印由密至疏，最後一步帶起碎草。'],
  aqChain: ['竹枝連環','bamboo','twins','crossedHands','double','左右各走一條棒路，前直後橫，交擊有別。'],
  aqYue: ['越女劍','bamboo','fan','nineFan','snap','九道竹影張扇，棒尖同指一處。'],

  fingerFlick: ['彈指神通','bamboo','pebble','flickStone','quick','一枚帶稜青石脫指而出，身後拖著三道短波。'],
  softPalm: ['綿掌','pearl','wave','cottonPalm','glide','掌影沉進層疊的棉絮雲，掌邊綿力外散。'],
  yangFinger: ['一陽指','gold','beam','healingPoint','pulse','一束金指線只落在一處穴位，三圈暖暈回應。'],
  yijinjing: ['易筋經','ember','halo','nineSuns','gather','金色光點圍繞心火，光圈由內而外鋪開。'],
  iceSoulNeedle: ['冰魄銀針','frost','frost','iceCrystal','quick','單枚冰針直入，六角晶枝向針尖四周裂開。'],
  diamondWard: ['金剛護體圖','gold','lattice','diamondWard','gather','六面金剛晶甲閉合，長菱沿著護甲中央豎起。'],
  sevenInjuries: ['七傷拳','ember','palm','sevenCracks','heavy','朱拳落下，七道不等長的傷勁裂紋放射開來。'],
  waterSkim: ['水上漂','sea','ripple','waterSkim','glide','腳尖只點過三圈低低的水紋，最後一滴向後飛起。'],

  // No hero art uses the strokes below any more; villain signatures still borrow them (VILLAIN_FORMS).
  breakPalm: ['破掌式','bronze','thrust','brokenPalm','snap','薄刃從掌影的指縫穿過。'],
  vacantFist: ['空明拳','jade','coil','vacantFist','glide','虛圈留出拳眼，輕拳從圈內探出。'],
  toadLunge: ['蛤蟆功','bronze','leap','toadLeap','heavy','伏地蟾影伸展雙腿，貼著低弧彈起。'],
  northernSea: ['北冥神功','sea','return','seaFunnel','return','墨藍水渦逐層內收，一束內息流回掌心。'],
  universeCanopy: ['乾坤大挪移・借力回護','jade','lattice','heavenCanopy','echo','飛簷形的護氣展作華蓋，垂穗護住蓋下眾人。'],
  foxTwinChange: ['胡家刀法・一刀兩變','frost','draw','foxMask','echo','兩次反向刀彎交出雪狐的耳尖與雙眼。']
};

const STROKE_NAMES = Object.freeze(Object.fromEntries(Object.entries(RECIPES).map(([id, row])=>[id,row[0]])));
const STROKE_NOTES = Object.freeze(Object.fromEntries(Object.entries(RECIPES).map(([id, row])=>[id,row[5]])));

const TAU = Math.PI * 2;
const PALETTES = {
  steel: ['#193847','#557888','#c6deeb','#fff3cd','#c69655'],
  pearl: ['#304952','#759397','#d8eee8','#fff4dc','#c88e9e'],
  bronze:['#40362e','#956a43','#e4b669','#fff1b1','#bd6a4a'],
  gold:  ['#493d32','#aa773a','#e8b657','#ffedac','#e77a48'],
  jade:  ['#193f42','#477d74','#8cc9a7','#e2f3ce','#dda665'],
  bamboo:['#233e35','#5b8253','#a6c97d','#f1efb0','#dd9c5b'],
  obsidian:['#202a35','#443545','#8a6378','#e4bd9f','#c66364'],
  peach: ['#513d45','#9d6770','#e4a0a3','#ffe5ca','#9cb380'],
  violet:['#333448','#74688d','#b6a5d3','#f0e6f8','#dfae70'],
  sea:   ['#163b48','#376d7a','#70b7b5','#d9ece0','#ecb977'],
  slate: ['#283d40','#586e6b','#a1aa93','#e1dfb7','#c89460'],
  cinnabar:['#472f34','#93453d','#dc7660','#ffcf9d','#cfaf69'],
  ember: ['#4f3430','#ad5b38','#ee974c','#ffe4a0','#e56d53'],
  frost: ['#293e55','#62829b','#a5ccdc','#ecf5ef','#cca4ab']
};
const clamp = (n, a=0, b=1) => Math.max(a,Math.min(b,n));
const smooth = (a,b,t) => { const n=clamp((t-a)/(b-a)); return n*n*(3-2*n); };
const window = (a,b,c,d,t) => smooth(a,b,t)*(1-smooth(c,d,t));
function local(c,x,y,r,sx,sy,draw) {
  c.save(); c.translate(x,y); c.rotate(r); c.scale(sx,sy);
  try {draw();} finally {c.restore();}
}
function line(c,pts,color,width=.03) {
  c.beginPath();c.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function curve(c,x,y,a,b,d,e,u,v,color,width=.03) {
  c.beginPath();c.moveTo(x,y);c.bezierCurveTo(a,b,d,e,u,v);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function arc(c,x,y,rx,ry,start,end,color,width=.03,rotation=0) {
  c.beginPath();c.ellipse(x,y,rx,ry,rotation,start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function oval(c,x,y,rx,ry,fill,rotation=0,stroke=null,width=.025) {
  c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function poly(c,pts,fill,stroke=null,width=.028) {
  c.beginPath();c.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
  c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
// A tapered, hand-brushed cubic: the two edges meet at the tip.
function brush(c,x,y,a,b,d,e,u,v,width,color) {
  const l=Math.hypot(u-x,v-y)||1,nx=-(v-y)/l,ny=(u-x)/l;
  c.beginPath();c.moveTo(x,y);
  c.bezierCurveTo(a+nx*width,b+ny*width,d+nx*width*.52,e+ny*width*.52,u,v);
  c.bezierCurveTo(d-nx*width*.18,e-ny*width*.18,a-nx*width*.64,b-ny*width*.64,x,y);
  c.closePath();c.fillStyle=color;c.fill();
}
function leaf(c,x,y,length,angle,p,alternate=false) {
  local(c,x,y,angle,length,length,()=>{
    c.beginPath();c.moveTo(0,0);c.bezierCurveTo(.27,-.28,.62,-.18,1,-.04);
    c.bezierCurveTo(.57,.17,.27,.18,0,0);c.closePath();
    c.fillStyle=alternate?p[1]:p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.046;c.stroke();
    curve(c,.12,.005,.46,-.04,.65,-.025,.89,-.045,p[3],.042);
  });
}
function petal(c,x,y,length,angle,p) {
  local(c,x,y,angle,length,length,()=>{
    c.beginPath();c.moveTo(0,0);c.bezierCurveTo(.33,-.32,.94,-.48,1,-.08);c.bezierCurveTo(.95,.27,.42,.31,0,0);
    c.closePath();c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.045;c.stroke();
    curve(c,.15,0,.43,-.04,.61,-.14,.86,-.15,p[3],.047);
  });
}
function blossom(c,x,y,size,p,count=5,turn=0) {
  if(size<=.13) {
    // The tiny peach flowers share a single silhouette; inner veins are below a pixel.
    c.beginPath();
    for(let i=0;i<count;i++){
      const a=turn+TAU*i/count,cs=Math.cos(a),sn=Math.sin(a);
      const xx=x+cs*size*.52,yy=y+sn*size*.52;
      c.moveTo(xx+cs*size*.49,yy+sn*size*.49);
      c.ellipse(xx,yy,size*.49,size*.25,a,0,TAU);
      c.closePath();
    }
    c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=size*.095;c.stroke();
  } else {
    for(let i=0;i<count;i++)petal(c,x,y,size,turn+TAU*i/count,p);
  }
  oval(c,x,y,size*.23,size*.22,p[4],0,p[0],size*.07);
}
function diamond(c,x,y,rx,ry,p) {
  poly(c,[x-rx,y,x,y-ry,x+rx,y,x,y+ry],p[2],p[0]);
  line(c,[x-rx*.71,y,x,y-ry*.64,x+rx*.63,y],p[3],.019);
}
function sword(c,x,y,r,length,p) {
  local(c,x,y,r,length,length,()=>{
    poly(c,[.02,-.044,.67,-.052,1,0,.68,.054,.02,.048],p[2],p[0],.027);
    line(c,[.06,0,.75,0,.98,0],p[3],.022);
    poly(c,[-.025,-.13,.07,-.098,.09,-.044,.082,.043,.061,.11,-.029,.134,-.008,.046,-.006,-.041],p[4],p[0],.026);
    line(c,[-.193,0,.005,0],p[0],.072);line(c,[-.16,-.01,-.025,-.01],p[1],.035);
    oval(c,-.205,0,.035,.037,p[4],0,p[0],.018);
  });
}
function saber(c,x,y,r,length,p) {
  local(c,x,y,r,length,length,()=>{
    c.beginPath();c.moveTo(.015,-.069);c.bezierCurveTo(.31,-.106,.79,-.038,1,-.219);
    c.bezierCurveTo(.766,.135,.29,.143,.015,.041);c.closePath();c.fillStyle=p[2];c.fill();
    c.strokeStyle=p[0];c.lineWidth=.029;c.stroke();
    curve(c,.09,.047,.36,.119,.74,.075,.94,-.145,p[3],.027);
    line(c,[0,-.132,-.015,.107],p[4],.055);
    line(c,[-.19,-.012,.006,0],p[0],.071);
    arc(c,-.222,-.016,.036,.044,0,TAU,p[4],.024);
  });
}
function cane(c,x,y,r,length,p) {
  local(c,x,y,r,length,length,()=>{
    line(c,[0,0,1,-.014],p[0],.091);line(c,[.012,-.012,.997,-.023],p[2],.049);
    for(const n of [.14,.40,.69,.90])line(c,[n,-.054,n+.006,.036],p[4],.03);
    brush(c,.09,.014,.08,.17,-.01,.21,-.12,.19,.038,p[4]);
  });
}
function chain(c,x,y,r,length,p,links=4) {
  local(c,x,y,r,length,length,()=>{
    for(let i=0;i<links;i++){
      const at=(i+.5)/links,wide=.53/links,high=.255/links;
      arc(c,at,.018*Math.sin(i*1.5),wide,high*(i%2?.65:1),0,TAU,p[0],.033/length,i%2?.13:-.11);
      arc(c,at,.013*Math.sin(i*1.5),wide,high*(i%2?.65:1),.35,Math.PI*1.54,p[3],.016/length,i%2?.13:-.11);
    }
  });
}
function palm(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    c.beginPath();c.moveTo(-.28,.48);c.bezierCurveTo(-.29,.27,-.37,.2,-.47,.03);
    c.bezierCurveTo(-.62,-.17,-.49,-.28,-.38,-.12);c.lineTo(-.25,.014);
    c.lineTo(-.37,-.48);c.bezierCurveTo(-.4,-.65,-.27,-.7,-.22,-.53);c.lineTo(-.13,-.17);
    c.lineTo(-.17,-.69);c.bezierCurveTo(-.18,-.85,-.035,-.87,-.016,-.68);c.lineTo(.014,-.2);
    c.lineTo(.065,-.71);c.bezierCurveTo(.09,-.85,.22,-.81,.20,-.64);c.lineTo(.16,-.19);
    c.lineTo(.28,-.55);c.bezierCurveTo(.34,-.66,.43,-.59,.39,-.47);c.lineTo(.31,-.10);
    c.bezierCurveTo(.29,.10,.2,.31,.14,.48);c.closePath();c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.043;c.stroke();
    curve(c,-.32,.01,-.17,.05,-.08,.12,-.04,.29,p[0],.035);
    curve(c,-.15,-.085,-.015,-.025,.12,.04,.24,-.05,p[3],.029);
  });
}
function qin(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    c.beginPath();c.moveTo(-.52,-.13);c.bezierCurveTo(-.34,-.19,-.09,-.11,.22,-.13);
    c.lineTo(.46,-.107);c.quadraticCurveTo(.59,-.02,.43,.115);c.lineTo(.27,.13);
    c.bezierCurveTo(.1,.17,-.18,.086,-.52,.16);c.quadraticCurveTo(-.59,.02,-.52,-.13);
    c.closePath();c.fillStyle=p[1];c.fill();c.strokeStyle=p[0];c.lineWidth=.036;c.stroke();
    for(let j=0;j<4;j++)line(c,[-.47,-.072+j*.043,.43,-.061+j*.041],p[3],.013);
    line(c,[-.40,-.12,-.40,.13],p[4],.029);
    for(let j=0;j<3;j++)oval(c,.04+j*.10,-.105,.013,.012,p[4]);
  });
}
function flute(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    line(c,[-.49,0,.5,0],p[0],.125);line(c,[-.48,-.013,.49,-.013],p[2],.084);
    for(let j=0;j<5;j++)oval(c,-.25+j*.12,-.014,.022,.023,p[0]);
    for(const n of [-.44,.43])line(c,[n,-.065,n,.048],p[4],.032);
    brush(c,.414,.045,.43,.13,.49,.21,.55,.19,.029,p[4]);
  });
}
function ripple(c,x,y,r,p,n=2) {
  for(let j=0;j<n;j++){
    const a=r*(1-j*.26);
    arc(c,x,y,a,a*.255,.12,3.02,p[j%2?3:2],.027);
    arc(c,x,y,a,a*.255,3.55,5.94,p[1],.018);
  }
}
function footprint(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    oval(c,.035,-.11,.081,.13,p[2],-.21,p[0],.027);
    oval(c,-.017,.077,.057,.065,p[1],-.15,p[0],.021);
    line(c,[-.011,-.11,.02,-.186],p[3],.018);
  });
}
function dragon(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    brush(c,-.88,.36,-.72,-.28,-.36,.15,-.18,-.02,.15,p[0]);
    brush(c,-.86,.36,-.65,-.23,-.34,.19,-.1,-.06,.094,p[2]);
    c.beginPath();c.moveTo(-.36,.08);c.bezierCurveTo(-.43,-.31,-.20,-.52,.01,-.48);
    c.quadraticCurveTo(.19,-.42,.24,-.27);c.lineTo(.54,-.16);c.lineTo(.67,-.19);
    c.lineTo(.60,-.02);c.lineTo(.40,.032);c.lineTo(.51,.136);c.lineTo(.39,.182);
    c.lineTo(.21,.083);c.bezierCurveTo(.05,.11,-.11,.37,-.33,.4);c.lineTo(-.22,.19);c.closePath();
    c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.038;c.stroke();
    for(let i=0;i<3;i++){
      const off=i*.083;
      brush(c,-.23+off,-.34,-.37+off,-.55,-.4+off,-.7,-.47+off,-.76,.047,p[i===1?2:4]);
    }
    line(c,[-.07,-.44,-.15,-.65,-.08,-.62,-.11,-.78],p[3],.037);
    line(c,[.06,-.43,.06,-.60,.13,-.56,.17,-.69],p[4],.036);
    poly(c,[.025,-.283,.23,-.24,.13,-.205],p[0]);
    oval(c,.141,-.245,.021,.024,p[3]);oval(c,.51,-.14,.031,.024,p[0]);
    line(c,[.31,-.006,.46,-.037,.56,-.042],p[0],.027);
    curve(c,.45,-.08,.70,.05,.78,-.02,.84,-.20,p[4],.024);
    curve(c,.38,.051,.65,.28,.79,.22,.86,.11,p[3],.022);
    brush(c,-.13,.21,-.15,.36,-.03,.44,.02,.48,.055,p[4]);
  });
}
function bee(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    oval(c,-.09,-.15,.13,.071,p[3],-.59,p[0],.02);oval(c,.015,-.15,.112,.061,p[2],-1.01,p[0],.019);
    poly(c,[-.32,-.003,-.168,-.059,-.128,.046],p[4],p[0],.016);
    oval(c,-.049,0,.174,.089,p[2],.04,p[0],.026);
    line(c,[-.127,-.062,-.141,.041],p[0],.032);line(c,[-.034,-.075,-.052,.073],p[1],.035);
    oval(c,.116,-.006,.065,.073,p[0]);oval(c,.142,-.025,.018,.019,p[3]);
  });
}
function needle(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    poly(c,[-.43,-.021,.31,-.026,.56,0,.30,.025,-.43,.021],p[3],p[0],.022);
    line(c,[-.42,-.006,-.26,-.006],p[4],.051);
  });
}
function arrow(c,x,y,r,size,p,head=true,feathers=true) {
  local(c,x,y,r,size,size,()=>{
    line(c,[-.55,0,.48,0],p[0],.049);line(c,[-.53,-.006,.4,-.006],p[2],.021);
    if(head)poly(c,[.30,-.092,.59,0,.30,.092,.366,0],p[2],p[0],.022);
    if(feathers)for(let j=0;j<3;j++){
      const k=-.53+j*.065;
      line(c,[k,-.1,k+.105,0,k,.1],p[3],.037);
    }
  });
}
function bell(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    arc(c,0,-.18,.07,.064,3.08,6.15,p[4],.034);
    c.beginPath();c.moveTo(-.047,-.15);c.bezierCurveTo(-.2,-.14,-.17,.02,-.24,.092);
    c.quadraticCurveTo(0,.204,.25,.09);c.bezierCurveTo(.17,.01,.18,-.13,.047,-.15);c.closePath();
    c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.037;c.stroke();
    arc(c,0,.102,.20,.049,.12,3.00,p[3],.032);oval(c,.009,.18,.045,.045,p[4],0,p[0],.022);
  });
}
function cloud(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    c.beginPath();c.moveTo(-.62,.12);c.bezierCurveTo(-.48,.10,-.48,-.15,-.25,-.13);
    c.bezierCurveTo(-.24,-.37,.08,-.37,.16,-.19);c.bezierCurveTo(.36,-.32,.43,-.11,.42,-.038);
    c.quadraticCurveTo(.57,-.09,.67,.045);c.bezierCurveTo(.38,.25,.10,.12,-.1,.16);
    c.bezierCurveTo(-.32,.22,-.45,.2,-.62,.12);c.closePath();
    c.fillStyle=p[1];c.fill();c.strokeStyle=p[0];c.lineWidth=.031;c.stroke();
    curve(c,-.38,.044,-.28,-.048,-.21,.03,-.14,-.069,p[3],.026);
    curve(c,-.09,.027,.03,.077,.18,.03,.21,-.043,p[2],.026);
  });
}
function wave(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    c.beginPath();c.moveTo(-.66,.22);c.bezierCurveTo(-.38,.20,-.38,-.19,-.078,-.27);
    c.bezierCurveTo(.17,-.36,.23,-.15,.192,-.058);c.quadraticCurveTo(.03,-.13,.003,.045);
    c.bezierCurveTo(.09,.22,.32,.17,.64,-.02);c.bezierCurveTo(.31,.36,-.12,.35,-.66,.22);c.closePath();
    c.fillStyle=p[1];c.fill();c.strokeStyle=p[0];c.lineWidth=.031;c.stroke();
    curve(c,-.50,.18,-.23,.12,-.31,-.22,.032,-.23,p[3],.032);
    brush(c,.31,.13,.47,.08,.57,-.07,.65,-.17,.028,p[2]);
  });
}
function paw(c,x,y,r,size,p) {
  local(c,x,y,r,size,size,()=>{
    c.beginPath();c.moveTo(-.145,.07);c.quadraticCurveTo(0,-.15,.14,.075);c.quadraticCurveTo(.20,.22,.043,.16);
    c.quadraticCurveTo(-.021,.13,-.09,.17);c.quadraticCurveTo(-.19,.19,-.145,.07);c.closePath();
    c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.024;c.stroke();
    for(const [xx,yy,rot] of [[-.157,-.073,-.44],[-.056,-.159,-.15],[.053,-.167,.13],[.153,-.093,.36]])
      oval(c,xx,yy,.039,.059,p[3],rot,p[0],.014);
  });
}
function snow(c,x,y,r,p,size=.28) {
  for(let i=0;i<6;i++)local(c,x,y,r+TAU*i/6,size,size,()=>{
    line(c,[0,0,.95,0],p[3],.087);line(c,[.47,-.22,.65,0,.47,.22],p[2],.074);
  });
}
function trigram(c,x,y,r,radius,p,i) {
  local(c,x,y,r,1,1,()=>{
    for(let j=0;j<2;j++) {
      const rr=radius+j*.042;
      if((i+j)%3===0)line(c,[-.095,-rr,.095,-rr],p[3],.022);
      else {line(c,[-.098,-rr,-.017,-rr],p[2],.022);line(c,[.017,-rr,.098,-rr],p[2],.022);}
    }
  });
}

const MARKS = {
  nineFan(c,p,t) {
    for(let j=0;j<9;j++){
      c.save();c.globalAlpha*=.39+.61*smooth(j*.035,j*.035+.24,t);
      sword(c,-.27,.19,-1.48+j*(.21+.044*t),.52+.16*Math.sin(j*Math.PI/8),p);c.restore();
    }
    brush(c,-.52,.39,-.31,.36,.28,-.12,.62,-.25,.034,p[3]);
  },
  swordBind(c,p,t) {
    sword(c,-.47,.31,-.62,.95,p);sword(c,-.13,-.49,.92+.13*t,.68,p);
    diamond(c,.16,-.055,.087,.10,p);
    brush(c,.19,-.07,.42,-.24,.48,-.28,.58,-.37,.033,p[4]);
  },
  splitFletch(c,p,t) {
    arrow(c,-.34,-.045-.07*t,-.28,.54,p,false,true);
    arrow(c,.34,.005+.09*t,.43,.50,p,true,false);
    brush(c,-.09,.45,-.12,.13,.05,-.16,.14,-.49,.07,p[0]);
    brush(c,-.09,.42,-.1,.16,.062,-.18,.14,-.49,.029,p[3]);
  },
  brokenPalm(c,p,t) {
    palm(c,-.03,.13,-.21,.72,p);
    sword(c,-.46,.30,-.50,.91,p);
    line(c,[.27,-.13,.38,-.20,.45,-.18],p[4],.031);
  },
  cutVein(c,p,t) {
    for(let j=0;j<3;j++){
      const r=.26+j*.093;
      arc(c,.04,.025,r,r*.83,-1.30,-.22,p[j%2?2:1],.043);
      arc(c,.04,.025,r,r*.83,.04,2.49,p[2],.029);
    }
    brush(c,-.58,.19,-.23,.13,.15,-.10,.66,-.12,.065,p[0]);
    brush(c,-.58,.17,-.19,.10,.15,-.13,.70,-.14,.024,p[3]);
    diamond(c,.13,-.048,.072,.068,p);
  },
  wheelNine(c,p,t) {
    for(let j=0;j<9;j++){
      const a=TAU*j/9+(.1*t);
      sword(c,Math.cos(a)*.31,Math.sin(a)*.31,a-1.12,.37,p);
    }
    sword(c,-.45,.39,-.69,1.04,p);diamond(c,.035,.001,.09,.07,p);
  },
  quietSong(c,p,t) {
    for(let j=0;j<3;j++)curve(c,-.38,.13+j*.072,-.16,.29+j*.04,.25,-.19+j*.045,.47,-.065+j*.065,p[j%2?2:1],.022);
    qin(c,0,-.045,-.20,1.02,p);
    arc(c,-.18,-.07,.15,.2,-2.2,-.85,p[3],.02);
  },
  springTune(c,p,t) {
    brush(c,-.53,.38,-.28,.17,.08,-.20,.52,-.33,.054,p[0]);
    brush(c,-.51,.33,-.21,.15,.09,-.22,.50,-.32,.026,p[1]);
    leaf(c,-.23,.13,.27,-2.42,p);leaf(c,.10,-.08,.25,.75,p);
    blossom(c,-.27,.13,.12,p);blossom(c,.04,-.078,.169,p,5,-.7);blossom(c,.37,-.25,.13,p,5,.2);
  },
  blackQuiver(c,p,t) {
    for(let j=0;j<5;j++){
      const a=-.31+j*.13;
      needle(c,.01+j*.03,(j-2)*.089,a,.84-.063*Math.abs(j-2),p);
      oval(c,.43+j*.036,(j-2)*.12+.043,.034,.021,p[4],a);
    }
    for(const [x,y,s] of [[.48,.20,.044],[.57,.09,.025],[.42,-.30,.026]])oval(c,x,y,s,s*.78,p[1],0);
  },
  bambooScreen(c,p,t) {
    for(const [x,y,a,l] of [[-.32,.33,-1.71,.69],[-.04,.36,-1.53,.89],[.25,.35,-1.38,.76]])cane(c,x,y,a,l,p);
    for(const [x,y,a] of [[-.25,-.09,-2.63],[-.09,-.21,-.7],[.21,-.07,-.6],[.24,.11,.13]])leaf(c,x,y,.26,a,p);
    brush(c,-.47,.4,-.18,.38,.17,.34,.51,.27,.022,p[4]);
  },
  qinXiao(c,p,t) {
    curve(c,-.47,-.24,-.12,-.58,.17,-.16,.50,-.44,p[3],.024);
    curve(c,-.4,.35,-.03,.43,.22,.19,.49,.23,p[2],.029);
    qin(c,-.10,.119,-.2,.94,p);flute(c,.08,-.06,-.96,.81,p);
  },
  lotusChord(c,p,t) {
    for(let i=0;i<5;i++)curve(c,-.63,.27-.09*i,-.35,.18-.12*i,-.03,.26-.09*i,.25,.016,p[i%2?3:1],.019);
    for(let i=0;i<5;i++)petal(c,.12,.12,.43,-2.85+i*.65,p);
    arc(c,.10,.165,.42,.128,.05,3.12,p[4],.039);oval(c,.12,.09,.065,.06,p[4],0,p[0],.019);
  },
  earthRoot(c,p,t) {
    const points=[[-.57,.05,-.43,-.07,-.17,-.02,.01,-.16,.23,-.10,.42,-.03,.56,.05,.42,.195,-.44,.19],
      [-.47,.22,-.22,.171,.08,.225,.39,.20,.53,.26,.33,.34,-.38,.33]];
    poly(c,points[1],p[1],p[0]);poly(c,points[0],p[2],p[0]);
    line(c,[-.36,.114,-.14,.06,.05,.097,.13,-.015],p[3],.027);
    for(let j=-1;j<=1;j++)brush(c,j*.18,-.56,j*.18+.07,-.33,j*.17,-.20,j*.13,-.045,.045,p[j?1:4]);
  },
  whipArc(c,p,t) {
    const N=7;
    for(let i=0;i<N;i++){
      const a=2.96+i*3.22/N,b=2.96+(i+1)*3.22/N;
      const x=Math.cos(a)*.52,y=Math.sin(a)*.35,x2=Math.cos(b)*.52,y2=Math.sin(b)*.35;
      chain(c,x,y,Math.atan2(y2-y,x2-x),Math.hypot(x2-x,y2-y),p,1);
    }
    poly(c,[.45,-.09,.66,-.111,.53,.083,.52,.008],p[2],p[0]);
    brush(c,-.54,.19,-.21,.53,.12,.45,.38,.29,.027,p[4]);
  },
  returnHook(c,p,t) {
    curve(c,.48,-.27,-.14,-.58,-.58,.05,-.15,.19,p[0],.088);
    curve(c,.47,-.26,-.08,-.50,-.50,.045,-.16,.147,p[2],.039);
    arc(c,-.05,.124,.155,.13,-.08,2.91,p[4],.055);
    chain(c,.11,.158,-.19,.44,p,3);
  },
  chainFence(c,p,t) {
    for(const x of [-.39,.39]){cane(c,x,.43,-1.57,.81,p);diamond(c,x,-.40,.078,.073,p);}
    for(const y of [-.19,.064]){
      chain(c,-.40,y,.23,.42,p,3);chain(c,.008,y+.094,-.23,.42,p,3);
    }
  },
  gateSpike(c,p,t) {
    for(const [x,r] of [[-.45,.11],[.32,-.14]])local(c,x,.06,r,1,1,()=>{
      poly(c,[-.05,.35,.05,.35,.045,-.31,0,-.46,-.05,-.31],p[1],p[0]);
      line(c,[-.068,.10,.075,.10],p[4],.031);
    });
    poly(c,[-.48,.26,-.02,-.01,.46,-.40,.22,-.019,-.03,.082],p[2],p[0]);
    line(c,[-.29,.158,.36,-.319],p[3],.027);
  },
  chainBridge(c,p,t) {
    for(let j=-1;j<=1;j++){
      const x=j*.31;
      arc(c,x,.20,.158,.19,Math.PI,TAU,p[0],.108);
      arc(c,x,.20,.158,.19,Math.PI+.06,TAU-.06,p[2],.047);
    }
    line(c,[-.54,-.025,.55,-.025],p[1],.08);
    chain(c,-.49,-.21,-.012,.99,p,7);
    for(const x of [-.46,.46])line(c,[x,-.27,x,.023],p[4],.036);
  },
  dragonHead(c,p,t) {dragon(c,.00,.07,-.08,.80,p);brush(c,-.60,.36,-.28,.48,.22,.37,.43,.24,.033,p[4]);},
  vacantFist(c,p,t) {
    arc(c,.03,0,.41,.35,-2.70,1.1,p[1],.064,-.23);arc(c,.025,.03,.33,.24,.85,3.38,p[3],.041,.26);
    poly(c,[-.21,.01,-.15,-.10,-.05,-.115,.017,-.08,.07,-.09,.21,-.01,.18,.12,.06,.19,-.14,.12],p[2],p[0]);
    line(c,[-.072,-.08,-.065,.035,.01,.06,.028,-.059],p[0],.023);
  },
  scaleWard(c,p,t) {
    for(let j=0;j<2;j++)for(let k=0;k<3-j;k++){
      const x=(k-(2-j)/2)*.255,y=.02-j*.17;
      poly(c,[x-.158,y,x-.11,y-.093,x+.105,y-.096,x+.158,y,x,y+.20],p[2],p[0],.027);
      curve(c,x-.108,y-.016,x-.02,y-.07,x+.07,y-.058,x+.11,y-.002,p[3],.018);
    }
    arc(c,0,.01,.46,.34,3.45,6.07,p[4],.052);
  },
  skyDragon(c,p,t) {
    for(let i=0;i<3;i++)brush(c,-.59+i*.13,-.55,-.53+i*.13,-.25,-.24+i*.1,-.06,-.16+i*.1,.13,.028,p[i===1?3:1]);
    dragon(c,.095,.07,.66,.70,p);
    cloud(c,-.34,-.23,-.15,.53,p);
  },
  warPennant(c,p,t) {
    line(c,[-.34,.49,-.25,-.54],p[0],.072);line(c,[-.34,.48,-.25,-.53],p[4],.033);
    poly(c,[-.25,-.43,.11,-.36,.50,-.42,.33,-.22,.47,-.056,.21,-.125,-.28,-.11],p[2],p[0],.033);
    for(let i=0;i<3;i++)line(c,[-.14+i*.12,-.338,-.057+i*.12,-.259,-.15+i*.12,-.208],p[3],.027);
    for(let i=0;i<2;i++)brush(c,-.28,-.12+i*.04,.07,-.04+i*.07,.29,.08+i*.075,.48,.006+i*.08,.026,p[i?4:1]);
  },
  dragonEcho(c,p,t) {
    dragon(c,-.05,-.12,-.18,.62,p);
    local(c,-.05,.24,.18,-1,1,()=>dragon(c,0,0,-.11,.48,p));
    arc(c,.06,.02,.55,.38,-1.20,1.28,p[4],.031);
  },
  pairedLotus(c,p,t) {
    sword(c,-.26,.32,-1.16+.16*t,.90,p);
    c.save();c.globalAlpha*=.32+.68*smooth(.15,.46,t);sword(c,.32,.28,-1.87-.28*t,.86,p);c.restore();
    for(const a of [-2.86,-1.55,-.3])petal(c,.028,.09,.21,a,p);
  },
  sparrowNet(c,p,t) {
    for(let i=0;i<3;i++){
      line(c,[-.52+i*.22,.26,-.13+i*.21,-.18],p[1],.021);
      line(c,[-.5+i*.22,-.12,-.12+i*.19,.28],p[2],.02);
    }
    for(const [x,y,r,s] of [[-.23,-.29,-.15,.49],[.26,-.18,.32,.67]])local(c,x,y,r,s,s,()=>{
      brush(c,-.35,-.16,-.21,-.28,-.08,-.12,0,.07,.092,p[0]);
      brush(c,-.02,.056,.14,-.20,.31,-.26,.42,-.15,.073,p[2]);
      poly(c,[-.071,.012,.058,-.014,.128,.024,.057,.073,-.034,.19,-.057,.096,-.128,.142],p[0]);
    });
  },
  jadeSwarm(c,p,t) {
    bee(c,.16+.09*t,-.02,-.08,1.02,p);bee(c,-.18+.045*Math.sin(t*4),-.22-.045*t,.16,.69,p);bee(c,-.29,.13+.055*Math.sin(t*5),-.19,.65,p);
    for(let j=0;j<3;j++)brush(c,-.56,.24-j*.15,-.41,.28-j*.12,-.41,.19-j*.14,-.33,.13-j*.11,.017,p[4]);
  },
  crossedHands(c,p,t) {
    sword(c,-.51,.14,-.53,.98,p);c.save();c.globalAlpha*=.22+.78*smooth(.25,.57,t);
    sword(c,-.18,-.42,1.17-.31*t,.92,p);c.restore();
    arc(c,-.05,.02,.46,.30,.53,2.85,p[4],.035,-.28);
  },
  silkBells(c,p,t) {
    curve(c,-.52,-.20,-.05,-.57,-.21,.04,.17,.11,p[0],.088);
    curve(c,-.52,-.21,-.04,-.54,-.18,.023,.17,.10,p[4],.045);
    curve(c,-.52,-.13,-.26,.38,.14,-.21,.36,-.115,p[0],.072);
    curve(c,-.51,-.13,-.25,.32,.17,-.20,.36,-.115,p[2],.034);
    bell(c,.17,.19,-.23,.74,p);bell(c,.38,-.06,.32,.62,p);
  },
  twinHarmony(c,p,t) {
    arc(c,0,0,.49,.37,-2.9,-.27,p[1],.055,-.3);
    arc(c,0,0,.49,.37,.17,2.72,p[4],.049,-.3);
    sword(c,-.42,.04,-.79,.63,p);sword(c,.41,-.02,2.39,.62,p);
    blossom(c,0,.015,.206,p,6,t*.18);
  },
  sixFan(c,p,t) {
    const colors=['#bacaeb','#9ac6cc','#c1a6cd','#f1c7a2','#c4d79b','#f7e4bd'];
    for(let i=0;i<6;i++){
      const a=-.76+i*.29,l=.82+.047*Math.sin(i*2);
      local(c,-.37,.095,a,1,1,()=>{
        brush(c,0,0,.24,-.036,.6,-.01,l,0,.032,p[0]);
        brush(c,.03,0,.25,-.024,.57,-.018,l,0,.020,colors[i]);
      });
    }
    oval(c,-.37,.095,.071,.060,p[3],0,p[0],.021);
  },
  seaFunnel(c,p,t) {
    for(let j=0;j<4;j++){
      const r=.53-j*.107;
      arc(c,.00,-.10+j*.055,r,r*.29,-.9,4.99,p[j%2?3:2],.036-j*.004,-.14);
    }
    brush(c,.29,-.25,.67,.02,.04,.24,-.20,.43,.084,p[0]);
    brush(c,.32,-.21,.56,.03,-.03,.27,-.22,.45,.037,p[2]);
  },
  baguaStep(c,p,t) {
    for(let i=0;i<8;i++)trigram(c,0,.025,TAU*i/8,.32,p,i);
    footprint(c,-.09,.074,-.55,.74,p);footprint(c,.083,-.105,.24,.61,p);
    arc(c,0,.025,.246,.235,.08,2.05,p[4],.023);
  },
  narrowPoint(c,p,t) {
    diamond(c,.23,0,.172,.267,p);
    poly(c,[-.61,-.02,.42,-.031,.66,0,.406,.034,-.61,.023],p[0]);
    poly(c,[-.55,-.009,.43,-.015,.68,0,.42,.014,-.55,.011],p[3]);
    for(const x of [-.31,-.13])arc(c,x,0,.055,.105,3.60,5.83,p[2],.028);
  },
  marshPoint(c,p,t) {
    for(const [x,r,l] of [[-.32,-1.78,.47],[-.27,-1.24,.56],[-.17,-.86,.32]])leaf(c,x,.27,l,r,p);
    ripple(c,.015,.22,.39,p,2);
    needle(c,.14,-.006,-.37,.72,p);
    for(const [x,y,a,s] of [[.25,-.27,-.8,.11],[.42,-.18,-.35,.13],[.44,.0,.34,.08]])petal(c,x,y,s,a,p);
  },
  sixLanes(c,p,t) {
    const colors=['#9ec2d8','#d8aed5','#aad1b7','#f2bd93','#a7a3d9','#f5ddae'];
    for(let i=0;i<6;i++){
      c.save();c.globalAlpha*=.20+.80*smooth(i*.084,i*.084+.18,t);
      const y=(i-2.5)*.105,x=-.55+((i*3)%5)*.045,end=.31+(i%3)*.09;
      brush(c,x,y,x+.20,y-.035,end-.19,y+.025,end,y,.032,p[0]);
      line(c,[x+.035,y,end,y],colors[i],.025);
      poly(c,[end-.046,y-.037,end+.075,y,end-.047,y+.038],colors[i],p[0],.013);c.restore();
    }
    arc(c,-.23,.005,.17,.325,2.57,3.75,p[4],.029);
  },
  bambooStaff(c,p,t) {
    arc(c,-.025,.03,.48,.30,-2.75,-.31,p[1],.059,-.28);
    cane(c,-.42,.30,-.56,1.02,p);
    brush(c,-.4,.28,-.49,.38,-.51,.4,-.63,.39,.039,p[4]);
  },
  peachLattice(c,p,t) {
    for(let j=0;j<5;j++){
      const a=-Math.PI/2+TAU*j/5, b=a+TAU*2/5;
      line(c,[Math.cos(a)*.32,Math.sin(a)*.32,Math.cos(b)*.32,Math.sin(b)*.32],p[1],.027);
      blossom(c,Math.cos(a)*.36,Math.sin(a)*.32,.107,p,5,a);
    }
    diamond(c,0,.008,.073,.094,p);
  },
  orchidPoint(c,p,t) {
    petal(c,-.035,.10,.49,-2.62,p);petal(c,-.035,.10,.53,-1.73,p);petal(c,-.035,.10,.4,-.72,p);
    brush(c,-.36,.35,-.19,.22,.03,.095,.43,-.17,.029,p[3]);
    oval(c,-.035,.10,.070,.067,p[4],0,p[0],.024);
    arc(c,-.035,.10,.13,.12,.25,2.9,p[1],.024);
  },
  staffSnare(c,p,t) {
    sword(c,-.22,.29,-.94,.71,p);
    for(let i=0;i<3;i++)arc(c,-.04+i*.11,.02-i*.079,.14,.089,-1.98,3.18,p[i%2?4:2],.037,.71);
    cane(c,-.5,-.18,.29,.92,p);
    curve(c,.067,-.053,.31,-.17,.42,-.07,.49,-.19,p[4],.029);
  },
  peachGate(c,p,t) {
    brush(c,-.38,.40,-.39,.047,-.37,-.32,-.09,-.45,.067,p[0]);
    brush(c,.37,.41,.39,-.05,.31,-.33,.10,-.43,.06,p[0]);
    for(const [x,y,a] of [[-.30,-.18,-1.6],[-.19,-.36,-1.42],[.275,-.22,-.61],[.18,-.379,-1.02]])
      blossom(c,x,y,.113,p,5,a);
    line(c,[-.13,.39,.002,.27,.13,.39],p[4],.039);
  },
  staffFan(c,p,t) {
    for(let i=0;i<5;i++)cane(c,-.24,.24,-1.59+i*(.31+.15*t),.73+.08*Math.sin(i*Math.PI/4),p);
    cane(c,-.48,.15,-.12,1.03,p);
    arc(c,-.01,0,.50,.38,3.40,5.60,p[3],.028);
  },
  lonelyPalm(c,p,t) {
    brush(c,-.51,.41,-.21,.27,.01,-.01,.24,-.37,.11,p[0]);
    palm(c,.055,.17,-.18,.77,p);
    for(const [x,y,r] of [[-.39,.22,.056],[-.44,.13,.036],[.34,-.29,.031]])oval(c,x,y,r,r*.63,p[1],-.3);
  },
  fluteSword(c,p,t) {
    sword(c,-.34,.34,-.90,.86,p);
    flute(c,.035,-.082,-.13,1.05,p);
    curve(c,.23,.15,.37,.18,.48,.02,.53,-.10,p[3],.023);
  },
  ironTide(c,p,t) {
    wave(c,-.013,.12,-.02,.94,p);
    poly(c,[-.29,-.49,-.155,-.53,.212,.144,.148,.28,.045,.24],p[0],p[3],.023);
    line(c,[-.18,-.395,.127,.17],p[1],.04);
    line(c,[-.35,-.375,-.096,-.49],p[4],.066);
    for(const [x,y,a] of [[.29,-.11,-.62],[.40,-.003,-.33],[-.39,.09,-2.44]])leaf(c,x,y,.15,a,p);
  },
  toadLeap(c,p,t) {
    brush(c,-.56,.23,-.33,.13,-.37,-.23,.04,-.26,.049,p[1]);
    c.beginPath();c.moveTo(-.42,.23);c.quadraticCurveTo(-.32,.11,-.18,.06);
    c.bezierCurveTo(-.34,-.23,-.17,-.38,.04,-.27);c.quadraticCurveTo(.26,-.37,.39,-.194);
    c.lineTo(.51,-.12);c.quadraticCurveTo(.39,.012,.24,.006);c.lineTo(.26,.12);
    c.lineTo(.46,.18);c.lineTo(.41,.23);c.lineTo(.18,.19);c.lineTo(.075,.07);c.quadraticCurveTo(-.07,.2,-.22,.175);
    c.lineTo(-.40,.29);c.lineTo(-.52,.27);c.closePath();c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=.035;c.stroke();
    oval(c,.28,-.23,.08,.066,p[4],0,p[0],.024);oval(c,.305,-.239,.024,.03,p[0]);
    curve(c,-.19,.08,-.27,-.11,-.12,-.14,-.02,-.04,p[1],.043);
  },
  grievingCloud(c,p,t) {
    cloud(c,-.09,-.18,-.05,.81,p);cloud(c,.17,.057,.10,.69,p);
    palm(c,.05,.24,.34,.39,p);
    brush(c,.11,-.44,.06,-.29,-.10,.12,-.21,.4,.044,p[4]);
  },
  solitaryShadow(c,p,t) {
    local(c,-.21,.18,-.29,1,1,()=>{
      const shadow=[p[0],p[0],p[1],p[1],p[0]];palm(c,0,.03,-.33,.69,shadow);
    });
    palm(c,.15,.017,.37,.91,p);
    brush(c,-.57,.45,-.34,.34,-.14,.08,.09,-.17,.052,p[4]);
  },
  shiftCircle(c,p,t) {
    for(let i=0;i<2;i++)local(c,0,.01,i*Math.PI+.12*t,1,1,()=>{
      brush(c,-.43,.07,-.42,-.41,.17,-.53,.39,-.11,.116,p[i?2:0]);
      oval(c,.234,-.133,.062,.061,p[i?0:3]);
    });
    curve(c,-.32,.15,-.12,.45,.02,-.33,.35,-.15,p[4],.025);
    arc(c,0,0,.50,.48,.64,2.06,p[3],.025);
  },
  valleyPulse(c,p,t) {
    leaf(c,-.22,.16,.36,-2.58,p);leaf(c,.19,.12,.33,-.67,p);
    line(c,[-.55,.072,-.34,.072,-.26,.023,-.20,.09,-.10,-.24,-.028,.206,.065,-.057,.14,.052,.33,.052,.49,.012],p[0],.066);
    line(c,[-.55,.072,-.34,.072,-.26,.023,-.20,.09,-.10,-.24,-.028,.206,.065,-.057,.14,.052,.33,.052,.49,.012],p[2],.029);
    oval(c,-.10,-.25,.038,.038,p[4]);
  },
  taijiBlade(c,p,t) {
    arc(c,-.04,.015,.389,.348,-2.92,1.13,p[0],.097,-.25);
    arc(c,-.04,.015,.389,.348,1.14,2.44,p[2],.056,-.25);
    curve(c,-.25,.196,-.02,.44,-.04,-.36,.18,-.235,p[1],.046);
    sword(c,-.46,.33,-.62,1.05,p);
  },
  sunShell(c,p,t) {
    oval(c,.008,-.06,.157,.155,p[4],0,p[0],.028);
    for(let i=0;i<9;i++){
      const a=Math.PI*1.05+i*Math.PI*.91/8;
      line(c,[Math.cos(a)*.20,-.06+Math.sin(a)*.20,Math.cos(a)*.29,-.06+Math.sin(a)*.29],p[3],.026);
    }
    for(let j=0;j<3;j++)arc(c,0,-.005+j*.018,.30+j*.065,.22+j*.055,.035,3.11,p[j===1?1:2],.043);
  },
  fireTablets(c,p,t) {
    for(const [x,y,r,s] of [[-.30,.02,-.41,.78],[.02,-.07,-.03,1],[.31,.10,.38,.73]])local(c,x,y,r,s,s,()=>{
      poly(c,[-.083,.40,-.091,-.17,-.042,-.31,.038,-.4,.09,-.22,.079,.39,0,.431],p[2],p[0],.028);
      brush(c,-.05,.08,-.087,-.03,.067,-.12,.015,-.231,.049,p[4]);
      line(c,[-.036,.22,.039,.22],p[0],.026);
    });
  },
  heavenCanopy(c,p,t) {
    c.beginPath();c.moveTo(-.58,-.042);c.bezierCurveTo(-.28,-.04,-.17,-.30,-.01,-.40);
    c.bezierCurveTo(.16,-.28,.34,-.04,.59,-.055);c.quadraticCurveTo(.38,.10,.18,.034);
    c.quadraticCurveTo(0,.17,-.18,.032);c.quadraticCurveTo(-.39,.13,-.58,-.042);
    c.closePath();c.fillStyle=p[1];c.fill();c.strokeStyle=p[0];c.lineWidth=.037;c.stroke();
    for(const x of [-.46,-.23,0,.23,.46]){
      curve(c,0,-.35,x*.45,-.23,x*.75,-.07,x,.007,p[3],.020);
      line(c,[x,.044,x,.178+Math.abs(x)*.17],p[4],.024);
      diamond(c,x,.213+Math.abs(x)*.17,.031,.061,p);
    }
    oval(c,0,-.42,.045,.043,p[4],0,p[0],.017);
  },
  snowSaber(c,p,t) {
    brush(c,-.54,.29,-.23,.38,.17,.26,.47,-.155,.064,p[1]);
    saber(c,-.38,.16,-.41,.96,p);
    brush(c,.46,.04,.34,.18,.23,.25,.12,.32,.029,p[3]);
  },
  foxTracks(c,p,t) {
    paw(c,-.33,.23,-.51,.71,p);paw(c,-.04,.044,.30,.81,p);paw(c,.29,-.24,-.13,.92,p);
    for(const [x,y,s] of [[.35,-.44,.031],[.48,-.31,.029],[.46,-.40,.022]])oval(c,x,y,s,s*.69,p[3],-.26);
  },
  silkCocoon(c,p,t) {
    oval(c,-.045,-.008,.201,.334,p[2],.40,p[0],.037);
    for(let i=0;i<5;i++)curve(c,-.19,-.224+i*.085,-.02,-.22+i*.08,.03,-.12+i*.092,.16,-.16+i*.075,p[i%2?1:3],.022);
    brush(c,-.56,.26,-.1,.40,.24,-.18,.51,-.24,.055,p[1]);
    curve(c,-.54,.29,-.21,.42,.30,-.10,.52,-.27,p[3],.027);
  },
  foxFeint(c,p,t) {
    arc(c,-.07,.06,.397,.295,-2.9,-1.9,p[1],.052,-.28);
    arc(c,-.07,.06,.397,.295,-1.66,-.89,p[1],.047,-.28);
    arc(c,-.07,.06,.397,.295,-.60,-.30,p[2],.039,-.28);
    saber(c,.37,-.18,2.57,.79,p);brush(c,-.45,.12,-.17,.37,.19,.28,.42,.11,.037,p[4]);
  },
  wristHook(c,p,t) {
    for(let j=0;j<2;j++)arc(c,.06,-.03,.163+j*.066,.135+j*.065,-2.66,2.58,p[j?3:1],j?.03:.063,.32);
    saber(c,-.46,.28,-.54,.90,p);line(c,[.232,.122,.326,.15,.389,.111],p[4],.026);
  },
  foxMask(c,p,t) {
    brush(c,-.56,-.28,-.41,.32,-.20,.45,.04,.28,.085,p[2]);
    brush(c,.54,-.27,.41,.27,.21,.35,.032,.291,.080,p[1]);
    poly(c,[-.38,-.335,-.19,-.205,.012,-.235,.22,-.194,.39,-.34,.29,.040,.09,.227,.015,.33,-.09,.228,-.27,.065],p[2],p[0],.026);
    poly(c,[-.32,-.252,-.21,-.198,-.27,-.105],p[1]);poly(c,[.33,-.25,.23,-.194,.27,-.10],p[1]);
    line(c,[-.2,-.045,-.086,.012,-.052,-.006],p[0],.044);line(c,[.205,-.046,.092,.01,.055,-.009],p[0],.044);
    poly(c,[-.041,.176,.063,.177,.014,.239],p[0]);line(c,[-.16,.153,-.041,.25,.01,.28],p[3],.023);
    saber(c,-.39,.21,-.17,.50,p);
  },
  flickStone(c,p,t) {
    for(let i=0;i<3;i++)brush(c,-.59,.16-i*.105,-.32,.21-i*.10,-.19,.09-i*.065,.015,.035-i*.062,.023,p[i===1?3:1]);
    poly(c,[.01,-.13,.20,-.208,.34,-.123,.36,.055,.23,.171,.025,.103,-.042,.005],p[2],p[0],.036);
    line(c,[.017,-.10,.142,-.126,.24,-.086,.19,.056],p[3],.027);
    arc(c,.18,-.01,.285,.257,-1.04,.61,p[4],.024);
  },
  cottonPalm(c,p,t) {
    cloud(c,-.11,.10,-.27,.77,p);cloud(c,.19,.19,-.09,.55,p);
    palm(c,.083,-.018,.79,.47,p);
    for(let j=0;j<2;j++)curve(c,-.53,-.088+j*.098,-.26,-.20+j*.08,-.26,-.05+j*.08,-.09,-.11+j*.065,p[j?2:3],.025);
  },
  healingPoint(c,p,t) {
    for(let i=0;i<3;i++)arc(c,.20,-.038,.094+i*.094,.087+i*.079,-1.29,3.97,p[i===1?2:4],.026);
    needle(c,-.14,.053,-.26,.86,p);
    for(const a of [-1.57,0,1.57,3.14]){
      const x=.20+Math.cos(a)*.18,y=-.038+Math.sin(a)*.18;
      diamond(c,x,y,.025,.041,p);
    }
  },
  nineSuns(c,p,t) {
    for(let i=0;i<9;i++){
      const a=-Math.PI/2+i*TAU/9,x=Math.cos(a)*.37,y=Math.sin(a)*.34;
      oval(c,x,y,.071,.071,p[i%3?2:3],0,p[0],.020);
    }
    brush(c,-.031,.16,-.24,.015,.01,-.094,.04,-.27,.10,p[4]);
    brush(c,.025,.14,.13,.055,.11,-.018,.135,-.12,.06,p[2]);
    oval(c,.015,.067,.064,.067,p[3]);
  },
  iceCrystal(c,p,t) {
    snow(c,.18,-.048,.19,p,.295);
    needle(c,-.105,.062,-.38,1.02,p);
    for(const [x,y,a] of [[.42,-.26,-.60],[.47,.10,.41],[.01,-.35,-1.95]])local(c,x,y,a,1,1,()=>{
      poly(c,[0,0,.12,-.028,.064,.035],p[3],p[1],.014);
    });
  },
  diamondWard(c,p,t) {
    poly(c,[0,-.47,.353,-.265,.401,.094,0,.453,-.397,.092,-.347,-.267],p[1],p[0],.045);
    poly(c,[0,-.38,.20,-.077,0,.34,-.197,-.075],p[2],p[0],.030);
    line(c,[0,-.38,0,.34],p[3],.03);
    for(const dir of [-1,1]){
      line(c,[dir*.325,-.217,dir*.22,-.066,dir*.34,.071,dir*.22,.177],p[4],.033);
      diamond(c,dir*.326,-.07,.035,.06,p);
    }
  },
  sevenCracks(c,p,t) {
    for(let j=0;j<7;j++){
      const a=-1.61+j*TAU/7,l=.36+.1*((j*3)%4)/3;
      local(c,0,0,a,1,1,()=>{
        line(c,[.065,0,.19,-.027,.215,.031,l,-.042,l+.05,-.076],p[0],.055);
        line(c,[.11,0,.19,-.027,.215,.031,l,-.042],p[j%2?2:4],.026);
      });
    }
    poly(c,[-.17,-.07,-.09,-.16,.05,-.15,.151,-.05,.14,.09,.051,.157,-.10,.136,-.18,.034],p[2],p[0],.031);
    line(c,[-.086,-.08,-.073,.012,-.01,.052,.049,.026,.04,-.08],p[3],.026);
  },
  waterSkim(c,p,t) {
    ripple(c,-.32,.176,.232,p,2);ripple(c,.035,.065,.290,p,2);ripple(c,.34,-.044,.205,p,2);
    brush(c,-.49,-.10,-.19,-.28,.17,-.17,.41,-.291,.057,p[2]);
    for(const [x,y,a,s] of [[.28,-.18,-1.15,.115],[.399,-.183,-.76,.12],[.485,-.116,-.39,.11]])petal(c,x,y,s,a,p);
  }
};

// Position of an airborne stroke, expressed along its actual projected source–target line.
function trajectory(kind,d,u,variant) {
  const arch=Math.sin(Math.PI*u),bend=Math.min(.77,.17+d*.10), wave=Math.sin(TAU*u);
  switch(kind) {
    case 'fan': return [d*u,(variant-1)*bend*arch*.72];
    case 'twins': return [d*u,(variant?1:-1)*arch*(.16+.11*Math.sin(Math.PI*u))*Math.min(1,d*.8)];
    case 'draw': return [d*u,arch*(variant?-.23:.20)+wave*.035];
    case 'lash': return [d*u,-bend*arch+wave*arch*.19];
    case 'bee': return [d*u,arch*(.16*Math.sin(2.7*Math.PI*u+variant*1.7)+(variant-1)*.125)];
    case 'frost': case 'beam': return [d*u,(variant-1)*.018*arch];
    case 'pebble': return [d*u,-arch*Math.min(.39,.09+d*.083)];
    case 'dragon': return [d*u,arch*(-.23+.17*Math.sin(TAU*1.2*u))];
    case 'plunge': return [d*u,-(bend+.25)*arch*(.46+.86*u)];
    case 'leap': return [d*u,-Math.min(.49,.16+d*.07)*Math.sin(Math.PI*Math.pow(u,.76))];
    case 'return': return [d*(1-u),-arch*(.12+.08*wave)];
    case 'wave': case 'ripple': return [d*u,.035*arch+wave*.077*arch];
    case 'coil': return [d*u+.04*wave,-arch*.21+wave*arch*.14];
    case 'strings': return [d*u,arch*((variant-1)*.108+.044*Math.sin(TAU*1.7*u))];
    case 'blossom': return [d*u,arch*(-.20+.10*wave)];
    case 'beams': return [d*u,(variant-1)*arch*.19+.036*wave];
    case 'palm': return [d*u,-arch*.050];
    case 'mist': return [d*u,-arch*.29+.062*wave];
    case 'pulse': return [d*u,-arch*.07+Math.sin(6*Math.PI*u)*arch*.046];
    case 'lattice': case 'halo': return [d*u,-arch*(.22+variant*.06)];
    case 'banner': return [d*u,-arch*.19+wave*.055];
    case 'dart': return [d*u,arch*((variant-1)*.14-.066)];
    default: return [d*u,-arch*.035];
  }
}
const MANY = new Set(['fan','bee','beams','strings','dart']);
const TWO = new Set(['twins','draw','lattice','halo','wave']);
const LOW = new Set(['ripple','steps','wave','leap']);
function comet(c,kind,p,d,head,variant) {
  const tail=clamp(head-(kind==='beam'||kind==='beams'?.48:.32)/Math.max(1,Math.sqrt(d*.6)),0,1);
  if(head<=tail+.001)return;
  const curvePoints=[];
  for(let i=0;i<7;i++)curvePoints.push(...trajectory(kind,d,tail+(head-tail)*i/6,variant));
  const broad=kind==='palm'||kind==='dragon'||kind==='wave'||kind==='plunge';
  line(c,curvePoints,p[0],broad?.082:.058);
  line(c,curvePoints,variant===2?p[4]:p[2],broad?.046:.029);
  const tip=trajectory(kind,d,head,variant), prev=trajectory(kind,d,Math.max(0,head-.05),variant);
  const angle=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]);
  const [x,y]=tip;
  if(kind==='bee')bee(c,x,y,angle,.40,p);
  else if(kind==='dart'||kind==='frost')needle(c,x,y,angle,kind==='frost'?.42:.28,p);
  else if(kind==='pebble')diamond(c,x,y,.075,.064,p);
  else if(kind==='blossom')petal(c,x,y,.13,angle-.55,p);
  else if(kind==='dragon')local(c,x,y,angle,.22,.22,()=>dragon(c,0,0,0,1,p));
  else if(kind==='lash')chain(c,x-.14,y,angle,.22,p,2);
  else if(kind==='banner')local(c,x,y,angle,1,1,()=>poly(c,[-.13,-.088,.08,0,-.13,.061,-.06,0],p[4],p[0],.016));
  else if(kind==='beam'||kind==='beams')local(c,x,y,angle,1,1,()=>poly(c,[-.14,-.029,.09,0,-.14,.030],p[3]));
  else if(kind==='coil'||kind==='return')arc(c,x,y,.075,.055,-2.41,2.10,p[3],.020,angle);
  else if(kind==='lattice'||kind==='halo')diamond(c,x,y,.053,.07,p);
  else if(kind==='pulse')oval(c,x,y,.051,.045,p[3],angle,p[0],.015);
  else if(kind==='mist')brush(c,x-.16,y-.04,x-.08,y-.11,x+.015,y-.03,x+.07,y-.025,.039,p[3]);
  else if(kind==='strings')oval(c,x,y,.046,.029,p[3],angle-.3);
  else if(kind==='palm')local(c,x,y,angle+.7,.14,.14,()=>palm(c,0,0,0,1,p));
  else if(kind==='plunge')local(c,x,y,angle,1,1,()=>poly(c,[-.116,-.071,.096,0,-.12,.059,-.055,0],p[3],p[0],.017));
}
function travel(c,kind,p,d,t,tempo) {
  if(d<.24)return;
  if(kind==='steps'||kind==='ripple'){
    for(let i=0;i<4;i++){
      const k=.12+i*.24,alpha=window(k*.28+.085,k*.28+.16,k*.28+.32,k*.28+.44,t);
      if(alpha<=.015)continue;
      c.save();c.globalAlpha*=alpha*.85;
      if(kind==='ripple')ripple(c,d*k,(i%2?1:-1)*.038,.17+i*.012,p,2);
      else footprint(c,d*k,(i%2?1:-1)*.073,-1.45+(i%2?.22:-.20),.54,p);
      c.restore();
    }
    return;
  }
  const count=MANY.has(kind)?3:TWO.has(kind)?2:1;
  for(let i=0;i<count;i++){
    const stagger=i*(kind==='beams'?.046:.022), time=t-stagger;
    const start={quick:.16,snap:.18,double:.13,glide:.07,gather:.10,echo:.09,heavy:.16,sweep:.105,return:.38,pulse:.10}[tempo]??.12;
    const finish=kind==='return'?.755:.524;
    const alpha=window(start,start+.055,finish-.015,finish+.075,time);
    if(alpha<=.01)continue;
    const linear=clamp((time-start)/(finish-start));
    const head=(tempo==='heavy'||tempo==='snap'||tempo==='quick') ? linear*(.66+.34*linear) : smooth(0,1,linear);
    c.save();c.globalAlpha*=alpha*.85;
    comet(c,kind,p,d,head,count===1?1:i);c.restore();
  }
}
function windup(c,kind,p,t) {
  const gain=window(.035,.13,.30,.47,t);
  if(gain<=.015)return;
  c.save();c.globalAlpha*=gain*.72;
  const open=smooth(.05,.28,t);
  if(kind==='strings'||kind==='pulse') {
    for(let j=0;j<3;j++)curve(c,-.22,-.10+j*.08,-.07,-.16+j*.08,.08,-.04+j*.05,.22,-.13+j*.06,p[j%2?2:3],.019);
  } else if(kind==='lattice'||kind==='halo'||kind==='banner') {
    for(let j=0;j<2;j++)arc(c,0,0,.12+j*.091,.10+j*.079,-2.78,-.61+open*.65,p[j?2:4],.026);
  } else if(kind==='steps'||kind==='ripple') {
    ripple(c,0,.09,.22+.052*open,p,2);
  } else if(kind==='fan'||kind==='twins'||kind==='draw'||kind==='thrust') {
    for(const z of [-1,1])brush(c,-.31,z*(.16+.03*open),-.19,z*.12,-.07,z*.022,.085,0,.023,p[z===1?2:3]);
  } else if(kind==='palm'||kind==='plunge'||kind==='leap'||kind==='wave') {
    brush(c,-.27,.04,-.14,.23,.12,.16,.19,-.035,.041,p[1]);
    brush(c,-.22,.02,-.09,.155,.10,.12,.18,-.04,.020,p[3]);
  } else if(kind==='coil'||kind==='return'||kind==='lash'||kind==='dragon') {
    arc(c,0,0,.205,.144,-2.9+open*.21,1.23+open*.72,p[2],.039,-.23);
  } else if(kind==='bee'||kind==='blossom') {
    for(let i=0;i<3;i++)petal(c,0,0,.117+i*.012,-2.3+i*.79,p);
  } else {
    diamond(c,0,0,.091,.061,p);
    line(c,[-.22,.031,-.105,.013],p[3],.021);
  }
  c.restore();
}
const UPRIGHT = new Set(['quietSong','springTune','bambooScreen','qinXiao','lotusChord','earthRoot','chainFence','gateSpike',
  'chainBridge','dragonHead','scaleWard','skyDragon','warPennant','dragonEcho','sparrowNet','jadeSwarm','silkBells',
  'seaFunnel','baguaStep','marshPoint','peachLattice','orchidPoint','peachGate','lonelyPalm','ironTide','toadLeap',
  'grievingCloud','solitaryShadow','valleyPulse','sunShell','fireTablets','heavenCanopy','foxTracks','foxMask','nineSuns','diamondWard','waterSkim']);
const GRAND = new Set(['wheelNine','lotusChord','chainBridge','dragonEcho','twinHarmony','sixLanes','staffFan','solitaryShadow','heavenCanopy','foxMask']);
const RECOIL = {
  quick:[.024,.019,-.025],snap:[.052,.027,-.055],double:[.055,.025,-.10],
  heavy:[.075,.056,-.09],glide:[.019,.024,.026],gather:[.008,.047,.035],
  echo:[.052,.024,-.065],sweep:[.072,.021,-.11],return:[-.059,.013,.09],pulse:[.012,.026,.01]
};

/**
 * Paint one technique in projected screen space. from/to are {x,y} pixel anchors;
 * scale is the board's current pixel-per-tile scale. In reduced motion the complete
 * hit silhouette stays at its target; only opacity changes. Unknown IDs paint nothing.
 */
function paintTechniqueStroke(ctx,id,from,to,progress,scale,reduced=false) {
  if(!ctx||!Object.hasOwn(RECIPES,id)||!from||!to||!Number.isFinite(scale)||scale<=0||
    !Number.isFinite(progress)||progress<=0||progress>=1||
    ![from.x,from.y,to.x,to.y].every(Number.isFinite))return false;
  const [,ink,route,mark,tempo]=RECIPES[id],p=PALETTES[ink],pixel=clamp(scale,14,84);
  const dx=(to.x-from.x)/pixel,dy=(to.y-from.y)/pixel,d=Math.hypot(dx,dy);
  const angle=d>.03?Math.atan2(dy,dx):0,face=dx<-.035?-1:1;
  const phase=reduced?.85:smooth(.435,.825,progress);
  const travelLow=LOW.has(route)?.17:0;
  ctx.save();
  try{
    ctx.translate(from.x,from.y);ctx.scale(pixel,pixel);
    ctx.lineCap='round';ctx.lineJoin='round';
    if(!reduced){
      ctx.save();
      ctx.translate(0,travelLow);ctx.rotate(angle);
      windup(ctx,route,p,progress);
      travel(ctx,route,p,d,progress,tempo);
      ctx.restore();
    }
    const alpha=reduced?window(.025,.16,.81,.975,progress):window(.395,.52,.760,.963,progress);
    if(alpha<=.008)return true;
    const kick=reduced?0:Math.sin(Math.PI*smooth(.485,.73,progress))*(1-phase*.38);
    const [reach,rise,tilt]=RECOIL[tempo];
    const swell=reduced?1:.85+.15*smooth(.421,.535,progress)+(.052*kick);
    const size=swell*(GRAND.has(mark)?1.24:1.08);
    ctx.translate(dx+face*reach*kick,dy+travelLow-rise*kick);
    ctx.scale(face*size,size);
    const slope=UPRIGHT.has(mark)?clamp(Math.atan2(dy,Math.abs(dx)||.001),-.22,.22)*.36:
      clamp(Math.atan2(dy,Math.abs(dx)||.001),-1.4,1.4);
    ctx.rotate((d>.035?slope:0)+tilt*kick);
    ctx.globalAlpha*=alpha;
    MARKS[mark](ctx,p,phase);
    return true;
  }finally {ctx.restore();}
}

export { STROKE_NAMES, STROKE_NOTES, paintTechniqueStroke };
