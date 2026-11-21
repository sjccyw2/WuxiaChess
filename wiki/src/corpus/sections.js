// How 遊戲原文 is filed.
//
// The text itself is always read live from the game's source files (see extract.js).
// This table only decides which heading a line appears under, by the function or data
// table it was found in. A line from code this table does not know yet still shows up:
// it is filed under its file's usual group, with the function name as its heading.
//
// Format: file -> { place in the file: [group, heading] }. A place is a top-level
// function or table name, optionally followed by ' / ' and a nested name for exceptions.

export const GROUPS = ['開場與操作', '戰盤與指令', '整備與陣容', '行裝與商肆', '武學與效果', '圖鑑與人物', '目標與棋路', '戰場紀錄', '劇情、對白與旁白', '系統與提示', '地圖與地形'];

// The group a file's text falls under when nothing more specific is listed.
export const FILE_GROUP = {
  'src/ui/action-flow.js': '戰盤與指令',
  'src/actors/actors.js': '戰盤與指令',
  'src/actors/tokens.js': '戰盤與指令',
  'src/app.js': '系統與提示',
  'src/data/battles.js': '目標與棋路',
  'src/actors/battle-marks.js': '戰盤與指令',
  'src/data/board-objects.js': '目標與棋路',
  'src/ui/board-plan.js': '目標與棋路',
  'src/ui/field-extras.js': '戰盤與指令',
  'src/ui/phase-banner.js': '戰盤與指令',
  'src/data/rule-terms.js': '開場與操作',
  'src/ui/armory-views.js': '行裝與商肆',
  'src/rules/battle-mastery.js': '武學與效果',
  'src/ui/bowl-views.js': '行裝與商肆',
  'src/ui/company-views.js': '整備與陣容',
  'src/data/encounter-script.js': '劇情、對白與旁白',
  'src/data/encounters.js': '圖鑑與人物',
  'src/rules/ferry-market.js': '行裝與商肆',
  'src/ui/field-hud.js': '戰盤與指令',
  'src/data/form-catalog.js': '武學與效果',
  'src/rules/form-rules.js': '武學與效果',
  'src/rules/game.js': '圖鑑與人物',
  'src/ui/gates.js': '圖鑑與人物',
  'src/data/hero-voices.js': '劇情、對白與旁白',
  'index.html': '開場與操作',
  'src/ui/journey-pages.js': '目標與棋路',
  'src/rules/journey.js': '目標與棋路',
  'src/data/martial-arts.js': '行裝與商肆',
  'src/data/mastery-catalog.js': '武學與效果',
  'src/ui/mastery-views.js': '武學與效果',
  'src/data/maze-tale.js': '劇情、對白與旁白',
  'src/rules/move-facts.js': '武學與效果',
  'src/data/new-heroes.js': '圖鑑與人物',
  'src/ui/panels.js': '開場與操作',
  'src/ui/run-views.js': '開場與操作',
  'src/ui/intro-film.js': '開場與操作',
  'src/fx/technique-strokes.js': '系統與提示',
  'src/data/terrain.js': '地圖與地形',
  'src/data/wake-tale.js': '劇情、對白與旁白',
  'src/ui/wake-views.js': '系統與提示'
};

export const PLACES = {
  'src/actors/actors.js': {
    'ActorLayer': ['戰盤與指令', '戰場標記']
  },
  'src/app.js': {
    'navItems': ['系統與提示', '介面與操作'],
    'save': ['系統與提示', '介面與操作'],
    'refreshSound': ['系統與提示', '介面與操作'],
    'board': ['系統與提示', '介面與操作'],
    'paint': ['系統與提示', '介面與操作'],
    'syncZoom': ['系統與提示', '介面與操作'],
    'cellClick': ['系統與提示', '戰場提示'],
    'unitClick': ['系統與提示', '通知'],
    'targetHint': ['系統與提示', '介面與操作'],
    'drawModal': ['系統與提示', '介面與操作'],
    'finishAlly': ['系統與提示', '戰場提示'],
    'doCommand': ['系統與提示', '戰場提示'],
    'useItem': ['系統與提示', '通知'],
    'runEnemy': ['系統與提示', '戰場提示'],
    'beginEnemy': ['系統與提示', '戰場提示'],
    'openTitle': ['系統與提示', '介面與操作'],
    'toggleSound': ['系統與提示', '通知'],
    'command': ['系統與提示', '通知']
  },
  'src/ui/armory-views.js': {
    'slotNames': ['行裝與商肆', '行裝與物資'],
    'numerals': ['行裝與商肆', '行裝與物資'],
    'planDiagram': ['行裝與商肆', '行裝與物資'],
    'formationCards': ['整備與陣容', '佈陣'],
    'bonus': ['行裝與商肆', '行裝與物資'],
    'armory': ['行裝與商肆', '行裝與物資']
  },
  'src/rules/battle-mastery.js': {
    'COMMANDS': ['武學與效果', '領隊增益'],
    'commandDescription': ['武學與效果', '領隊增益'],
    'CONDITION_NAMES': ['武學與效果', '狀態'],
    'effectDescription': ['武學與效果', '狀態']
  },
  'src/ui/bowl-views.js': {
    'places': ['行裝與商肆', '韋小寶・三盅通吃'],
    'visitorInvite': ['行裝與商肆', '韋小寶・三盅通吃'],
    'bowlsPage': ['行裝與商肆', '韋小寶・三盅通吃']
  },
  'src/ui/company-views.js': {
    'teamTabs': ['整備與陣容', '隊伍管理'],
    'personTabs': ['整備與陣容', '隊伍管理'],
    'tabs': ['整備與陣容', '隊伍管理'],
    'picker': ['整備與陣容', '隊伍管理'],
    'memberLine': ['整備與陣容', '隊伍管理'],
    'arts': ['武學與效果', '武譜招式'],
    'teamPage': ['整備與陣容', '隊伍管理'],
    'dossier': ['整備與陣容', '俠客詳情'],
    'encounterPage': ['劇情、對白與旁白', '對話面板']
  },
  'src/data/encounters.js': {
    'ENCOUNTERS': ['圖鑑與人物', '守關人與絕技'],
    'SIGNATURE_RULES': ['圖鑑與人物', '守關人與絕技']
  },
  'src/rules/ferry-market.js': {
    'VISITOR': ['行裝與商肆', '通吃坊與三盅通吃'],
    'VISITOR.arrival': ['劇情、對白與旁白', '韋小寶・三盅通吃'],
    'VISITOR.reveal': ['劇情、對白與旁白', '韋小寶・三盅通吃'],
    'VISITOR.blind': ['劇情、對白與旁白', '韋小寶・三盅通吃'],
    'VISITOR.win': ['劇情、對白與旁白', '韋小寶・三盅通吃'],
    'MARKET_RULES': ['行裝與商肆', '通吃坊與三盅通吃']
  },
  'src/ui/field-hud.js': {
    'FieldHud': ['戰盤與指令', '浮動面板與控制']
  },
  'src/data/form-catalog.js': {
    'COMBINATIONS': ['武學與效果', '招式配合']
  },
  'src/rules/form-rules.js': {
    'FORM_RULES': ['武學與效果', '招式配合'],
    'contactPlan': ['武學與效果', '招式配合']
  },
  'src/rules/game.js': {
    'BOOKS': ['戰盤與指令', '交戰與回合'],
    'ITEMS': ['行裝與商肆', '器物與藥品'],
    'TALENTS': ['武學與效果', '修為'],
    'DETAILS': ['圖鑑與人物', '人物與招式'],
    'DETAILS.hero.name': ['劇情、對白與旁白', '江湖舊事與俠客應答'],
    'DETAILS.medic.name': ['劇情、對白與旁白', '江湖舊事與俠客應答'],
    'DETAILS.chief.name': ['戰盤與指令', '交戰與回合'],
    'DETAILS.bow.role': ['戰盤與指令', '交戰與回合'],
    'module': ['戰盤與指令', '交戰與回合'],
    'STORIES': ['劇情、對白與旁白', '江湖舊事與俠客應答'],
    'STORIES[2].speaker': ['戰盤與指令', '交戰與回合'],
    'VOICES': ['劇情、對白與旁白', '江湖舊事與俠客應答'],
    'chapterScenes': ['劇情、對白與旁白', '江湖舊事與俠客應答'],
    'chapterScenes[2].speaker': ['戰盤與指令', '交戰與回合'],
    'newGame': ['戰盤與指令', '交戰與回合'],
    'undo': ['戰場紀錄', '步法'],
    'forecast': ['戰盤與指令', '交戰與回合'],
    'settleExperience': ['戰場紀錄', '成長'],
    'exp': ['戰場紀錄', '成長'],
    'wound': ['戰場紀錄', '交鋒'],
    'holdObjective': ['戰盤與指令', '交戰與回合'],
    'reflectStrike': ['戰場紀錄', '交鋒'],
    'restoreHealth': ['戰場紀錄', '交鋒'],
    'resolve': ['戰場紀錄', '交鋒'],
    'waitUnit': ['戰場紀錄', '交鋒'],
    'equip': ['戰場紀錄', '用物'],
    'transferEquipment': ['戰場紀錄', '用物'],
    'train': ['戰場紀錄', '成長'],
    'check': ['戰場紀錄', '局中紀事'],
    'restOnHerbs': ['戰場紀錄', '地形'],
    'startEnemy': ['戰場紀錄', '交鋒'],
    'enemyAct': ['戰場紀錄', '交鋒'],
    'nextRound': ['戰場紀錄', '交鋒']
  },
  'src/ui/gates.js': {
    'codexPage': ['圖鑑與人物', '江湖群像']
  },
  'index.html': {
    'index': ['開場與操作', '主畫面與戰場']
  },
  'src/ui/journey-pages.js': {
    'stageScenes': ['劇情、對白與旁白', '局中紀事'],
    'equippedMoves': ['武學與效果', '戰場出招'],
    'journeyEnding': ['目標與棋路', '終局']
  },
  'src/rules/journey.js': {
    'NUMERALS': ['目標與棋路', '棋路與結算'],
    'goalNames': ['目標與棋路', '任務與達成條件'],
    'startRun': ['目標與棋路', '棋路與結算'],
    'restoreRun': ['目標與棋路', '棋路與結算'],
    'dialogue': ['劇情、對白與旁白', '臨陣與戰後'],
    'dialogue.speaker': ['目標與棋路', '棋路與結算'],
    'deployLineup': ['戰場紀錄', '回合與整備'],
    'boardModel': ['目標與棋路', '任務與達成條件'],
    'settle': ['目標與棋路', '棋路與結算'],
    'buy': ['戰場紀錄', '用物'],
    'advance': ['目標與棋路', '棋路與結算'],
    'giveGuide': ['戰場紀錄', '成長'],
    'guideInventory': ['武學與效果', '參悟與解鎖'],
    'milestone': ['目標與棋路', '任務與達成條件'],
    'studyState': ['武學與效果', '參悟與解鎖'],
    'campModel': ['目標與棋路', '任務與達成條件']
  },
  'src/data/martial-arts.js': {
    'BRANCHES': ['武學與效果', '武學與修為'],
    'WARES': ['行裝與商肆', '通吃坊']
  },
  'src/data/mastery-catalog.js': {
    'CATALOG_NOTE': ['武學與效果', '門派武學'],
    'RECALL_NOTE': ['武學與效果', '門派武學'],
    'GATE_LABELS': ['武學與效果', '歷練門檻'],
    'HERO_PATHS': ['武學與效果', '門派脈絡'],
    'MASTERY_ARTS': ['武學與效果', '門派武學'],
    'TRADE_MANUALS': ['武學與效果', '江湖武譜']
  },
  'src/ui/mastery-views.js': {
    'tiers': ['武學與效果', '武學面板'],
    'tierName': ['武學與效果', '武學面板'],
    'slotName': ['武學與效果', '武學面板'],
    'kindNames': ['武學與效果', '武學面板'],
    'skillTabs': ['武學與效果', '武學面板'],
    'tabs': ['武學與效果', '武學面板'],
    'heroPicker': ['武學與效果', '武學面板'],
    'skillHeading': ['武學與效果', '武學面板'],
    'pathOrigin': ['武學與效果', '武學面板'],
    'statusOf': ['武學與效果', '武學面板'],
    'schoolMap': ['武學與效果', '武學面板'],
    'nodeDetails': ['武學與效果', '武學面板'],
    'schoolContents': ['武學與效果', '武學面板'],
    'guideContents': ['武學與效果', '武學面板'],
    'loadout': ['武學與效果', '武學面板'],
    'treeView': ['武學與效果', '武學面板'],
    'groups': ['武學與效果', '武學面板'],
    'campRecap': ['行裝與商肆', '通吃坊'],
    'productRow': ['行裝與商肆', '通吃坊'],
    'shop': ['行裝與商肆', '通吃坊'],
    'campView': ['行裝與商肆', '通吃坊'],
    'frameDialog': ['武學與效果', '武學面板']
  },
  'src/data/maze-tale.js': {
    'YOUTH': ['圖鑑與人物', '少年與韋小寶'],
    'QIUBAI': ['圖鑑與人物', '少年與韋小寶'],
    'WEI': ['圖鑑與人物', '少年與韋小寶'],
    'EAGLE': ['圖鑑與人物', '少年與韋小寶'],
    'MAZE_TALE': ['劇情、對白與旁白', '一輪的骨架'],
    'MAZE_TALE.title': ['開場與操作', '標題'],
    'MAZE_TALE.prologue': ['劇情、對白與旁白', '入夢'],
    'MAZE_TALE.rule': ['劇情、對白與旁白', '局規'],
    'MAZE_TALE.draw': ['劇情、對白與旁白', '局規'],
    'MAZE_TALE.ruleRead': ['劇情、對白與旁白', '局規'],
    'MAZE_TALE.ruleTold': ['劇情、對白與旁白', '局規'],
    'MAZE_TALE.told': ['劇情、對白與旁白', '說破'],
    'MAZE_TALE.command': ['劇情、對白與旁白', '第一局之前'],
    'MAZE_TALE.recall': ['劇情、對白與旁白', '第一局之前'],
    'MAZE_TALE.deploy': ['劇情、對白與旁白', '第一局之前'],
    'MAZE_TALE.inHand': ['劇情、對白與旁白', '軍情與起陣'],
    'MAZE_TALE.brief': ['劇情、對白與旁白', '軍情與起陣'],
    'MAZE_TALE.clack': ['劇情、對白與旁白', '求敗落子'],
    'MAZE_TALE.clackSave': ['劇情、對白與旁白', '求敗落子'],
    'MAZE_TALE.shop': ['劇情、對白與旁白', '通吃坊開張'],
    'MAZE_TALE.opened': ['劇情、對白與旁白', '通吃坊開張'],
    'MAZE_TALE.origins': ['劇情、對白與旁白', '韋小寶的來歷'],
    'MAZE_TALE.unseen': ['劇情、對白與旁白', '韋小寶的來歷'],
    'MAZE_TALE.night': ['劇情、對白與旁白', '夜話'],
    'MAZE_TALE.after': ['劇情、對白與旁白', '求敗的話'],
    'MAZE_TALE.lend': ['劇情、對白與旁白', '添子'],
    'MAZE_TALE.step': ['劇情、對白與旁白', '添子'],
    'MAZE_TALE.fade': ['劇情、對白與旁白', '求敗落子'],
    'MAZE_TALE.scatter': ['劇情、對白與旁白', '眼破'],
    'MAZE_TALE.packUp': ['劇情、對白與旁白', '眼破'],
    'MAZE_TALE.release': ['劇情、對白與旁白', '請回吧'],
    'MAZE_TALE.close': ['劇情、對白與旁白', '請回吧'],
    'MAZE_TALE.closeAgain': ['劇情、對白與旁白', '請回吧'],
    'MAZE_TALE.win': ['劇情、對白與旁白', '請回吧'],
    'MAZE_TALE.winNote': ['劇情、對白與旁白', '請回吧'],
    'MAZE_TALE.loss': ['劇情、對白與旁白', '眼破'],
    'CHAMBER_TALES': ['劇情、對白與旁白', '青竹渡・局的紀事'],
    'CHAMBER_TALES[1].name': ['劇情、對白與旁白', '紅楓驛・局的紀事'],
    'CHAMBER_TALES[1].arrival': ['劇情、對白與旁白', '紅楓驛・局的紀事'],
    'CHAMBER_TALES[1].victory': ['劇情、對白與旁白', '紅楓驛・局的紀事'],
    'CHAMBER_TALES[2].name': ['劇情、對白與旁白', '蘆花汀・局的紀事'],
    'CHAMBER_TALES[2].arrival': ['劇情、對白與旁白', '蘆花汀・局的紀事'],
    'CHAMBER_TALES[2].victory': ['劇情、對白與旁白', '蘆花汀・局的紀事'],
    'CHAMBER_TALES[3].name': ['劇情、對白與旁白', '聽雪棧・局的紀事'],
    'CHAMBER_TALES[3].arrival': ['劇情、對白與旁白', '聽雪棧・局的紀事'],
    'CHAMBER_TALES[3].victory': ['劇情、對白與旁白', '聽雪棧・局的紀事'],
    'CHAMBER_TALES[4].name': ['劇情、對白與旁白', '空山琴臺・局的紀事'],
    'CHAMBER_TALES[4].arrival': ['劇情、對白與旁白', '空山琴臺・局的紀事'],
    'CHAMBER_TALES[4].victory': ['劇情、對白與旁白', '空山琴臺・局的紀事'],
    'CHAMBER_TALES[5].name': ['劇情、對白與旁白', '桃花石陣・局的紀事'],
    'CHAMBER_TALES[5].arrival': ['劇情、對白與旁白', '桃花石陣・局的紀事'],
    'CHAMBER_TALES[5].victory': ['劇情、對白與旁白', '桃花石陣・局的紀事'],
    'CHAMBER_TALES[6].name': ['劇情、對白與旁白', '襄陽殘垣・局的紀事'],
    'CHAMBER_TALES[6].arrival': ['劇情、對白與旁白', '襄陽殘垣・局的紀事'],
    'CHAMBER_TALES[6].victory': ['劇情、對白與旁白', '襄陽殘垣・局的紀事'],
    'CHAMBER_TALES[7].name': ['劇情、對白與旁白', '寒玉石室・局的紀事'],
    'CHAMBER_TALES[7].arrival': ['劇情、對白與旁白', '寒玉石室・局的紀事'],
    'CHAMBER_TALES[7].victory': ['劇情、對白與旁白', '寒玉石室・局的紀事'],
    'CHAMBER_TALES[8].name': ['劇情、對白與旁白', '倒影天街・局的紀事'],
    'CHAMBER_TALES[8].arrival': ['劇情、對白與旁白', '倒影天街・局的紀事'],
    'CHAMBER_TALES[8].victory': ['劇情、對白與旁白', '倒影天街・局的紀事'],
    'CHAMBER_TALES[9].name': ['劇情、對白與旁白', '無刻漏臺・局的紀事'],
    'CHAMBER_TALES[9].arrival': ['劇情、對白與旁白', '無刻漏臺・局的紀事'],
    'CHAMBER_TALES[9].victory': ['劇情、對白與旁白', '無刻漏臺・局的紀事'],
    'LAMP_TALE': ['劇情、對白與旁白', '支線紀事'],
    'SIDE_TALES': ['劇情、對白與旁白', '韋小寶的盤口'],
    'SIDE_PAY': ['劇情、對白與旁白', '韋小寶的盤口'],
    'SIDE_MISS': ['劇情、對白與旁白', '韋小寶的盤口']
  },
  'src/data/hero-voices.js': {
    'HERO_VOICES': ['劇情、對白與旁白', '俠客自己的話']
  },
  'src/rules/move-facts.js': {
    'roots': ['武學與效果', '威力與效果'],
    'moveFacts': ['武學與效果', '威力與效果']
  },
  'src/data/new-heroes.js': {
    'NEW_HEROES': ['圖鑑與人物', '俠客錄']
  },
  'src/ui/panels.js': {
    'actionState': ['戰盤與指令', '行動面板'],
    'renderParty': ['戰盤與指令', '行動面板'],
    'activeHero': ['戰盤與指令', '行動面板'],
    'commander': ['開場與操作', '指南與設定'],
    'commander / acts[0][2]': ['戰盤與指令', '行動面板'],
    'commander / acts[1][2]': ['圖鑑與人物', '人物資料'],
    'goalRows': ['戰盤與指令', '行動面板'],
    'labels': ['戰場紀錄', '紀錄面板'],
    'labels.system': ['戰盤與指令', '行動面板'],
    'labels.move': ['開場與操作', '指南與設定'],
    'logRow': ['戰場紀錄', '紀錄面板'],
    'portraitSummary': ['戰盤與指令', '行動面板'],
    'equippedCard': ['圖鑑與人物', '人物資料'],
    'sheetPage': ['圖鑑與人物', '人物資料'],
    'profileContents': ['圖鑑與人物', '人物資料'],
    'effect': ['戰盤與指令', '行動面板'],
    'inventoryPage': ['行裝與商肆', '行裝'],
    'inventoryPage / groups[0][1]': ['戰場紀錄', '紀錄面板'],
    'skillPage': ['武學與效果', '交鋒與研習'],
    'storyPage': ['劇情、對白與旁白', '江湖舊事'],
    'logPage': ['戰場紀錄', '紀錄面板'],
    'logPage / filters[4][1]': ['開場與操作', '指南與設定'],
    'goalsPage': ['目標與棋路', '目標與結算'],
    'terrainPage': ['地圖與地形', '地形說明'],
    'helpPage': ['開場與操作', '指南與設定'],
    'settingsPage': ['開場與操作', '指南與設定'],
    'endPage': ['開場與操作', '指南與設定'],
    'enemyPage': ['圖鑑與人物', '人物資料'],
    'attackPage': ['武學與效果', '交鋒與研習'],
    'attackPage / who': ['戰盤與指令', '行動面板'],
    'resultPage': ['目標與棋路', '目標與結算']
  },
  'src/ui/run-views.js': {
    'drawPortrait': ['開場與操作', '抓子與落子'],
    'rollView': ['開場與操作', '抓子與落子'],
    'prologueSteps': ['開場與操作', '入夢'],
    'prologuePage': ['開場與操作', '入夢']
  },
  'src/fx/technique-strokes.js': {
    'RECIPES': ['系統與提示', '介面用語']
  },
  'src/data/terrain.js': {
    'TERRAIN_TYPES': ['地圖與地形', '地形說明'],
    'regionalNotes': ['地圖與地形', '地形說明']
  },
  'src/data/wake-tale.js': {
    'WORLD': ['劇情、對白與旁白', '少年在棋臺邊瞧明白的事'],
    'FRAGMENTS': ['劇情、對白與旁白', '夢醒'],
    'CLOSING': ['劇情、對白與旁白', '夢醒'],
    'WAKES': ['劇情、對白與旁白', '臺邊的五行字'],
    'NO_MARK': ['劇情、對白與旁白', '臺邊的五行字'],
    'FULL_MARK': ['劇情、對白與旁白', '臺邊的五行字']
  },
  'src/ui/wake-views.js': {
    'wakeJournal': ['系統與提示', '介面用語'],
    'journalPage': ['系統與提示', '介面用語'],
  }
};
