// What each board is: how it is won, who stands on it beyond its fixed four pieces, who comes
// later, and the pool its secondary objective is drawn from. One entry per map index.
//
//   kind     'slay': every master must fall; 'rout': every enemy, reinforcements included;
//            'keep' (守): the board's objects must stand until the end of round `hold`, or every
//            master fall first, and it is lost if one breaks; 'break' (破): every object must break;
//            'yield' (問劍): every master must be brought to 1 氣血 (he is 不敗 and never falls)
//   last     the last board, which follows the ten boards of a run in 無劍境界. It has no fixed
//            four, and its `commander` is named here
//   guest    in place of a piece's `id` on the last board: the master of the run's n-th board
//            (0 the first met). game.js `boardOf` turns it into that master's id, so the last
//            board is always fought against the ten masters of the run it closes
//   masters  piece refs of the board's 局主, 'master' first
//   objects  the board objects (board-objects.js), { id, at }; an id is the object's key, or the
//            key numbered on its board ('starPost#1') when there are two
//   hold     on a 'keep' board, the last round the objects must stand through
//   legacyKind  the kind a save from before the board had objects finishes under
//   pieces   starting pieces beyond the fixed four, in the order they act
//   waves    reinforcements: { id, when: { round } | { halved: [refs] }, place, pieces }; a
//            wave's first piece leads it, and each piece's `at` is its entry tile
//   sides    the secondary pool (journey.js SIDE_KINDS), one drawn per run
//
// A piece ref is a slot of the fixed four ('master', 'lieutenant', 'bow', 'scout') or an extra
// piece's id. An extra id is a named villain's DETAILS key ('xianYu') or a copy of a troop type
// numbered on its board ('fiveTiger#1', 'bow-2#1'). `mods` on a piece apply after its type's own.
// Ids are kept in saves, so a piece keeps its id once a board ships.

// The reward kinds a secondary may pay (journey.js settle).
const SIDE_REWARDS = ['coins', 'points', 'manual'];

const BATTLES = [
  // 0 青竹渡: the gentle first board; a wave lands behind the south bridge in round 3.
  {
    kind: 'slay',
    masters: ['master'],
    pieces: [],
    waves: [
      {
        id: 'ferry',
        when: { round: 3 },
        place: '南渡口',
        pieces: [
          { id: 'fengTiannan', at: [8, 9] },
          { id: 'fiveTiger#1', at: [7, 9] },
          { id: 'fiveTiger#2', at: [8, 10] }
        ]
      }
    ],
    sides: [
      { kind: 'lamp', reward: 'coins' },
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'intact', reward: 'coins' },
      { kind: 'holdLine', zone: { x: [0, 6] }, place: '西岸與兩座木橋', reward: 'manual' }
    ]
  },
  // 1 紅楓驛: a second lieutenant and a shield pair before the east courtyard.
  {
    kind: 'slay',
    masters: ['master'],
    pieces: [
      { id: 'zhaoZhong', at: [11, 6] },
      { id: 'qingShield#1', at: [10, 5] },
      { id: 'qingShield#2', at: [10, 6] }
    ],
    waves: [],
    sides: [
      { kind: 'spare', behaviour: 'mend', piece: 'lieutenant', reward: 'points' },
      { kind: 'order', first: 'zhaoZhong', reward: 'coins' },
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'manual' },
      { kind: 'noMedicine', reward: 'coins' }
    ]
  },
  // 2 蘆花汀: defeat everyone; six disciples crowd round their master.
  {
    kind: 'rout',
    masters: ['master'],
    pieces: [
      { id: 'bow-2#1', at: [9, 0] },
      { id: 'scout-2#1', at: [10, 1] },
      { id: 'bow-2#2', at: [10, 2] },
      { id: 'scout-2#2', at: [11, 1] }
    ],
    waves: [],
    sides: [
      { kind: 'double', reward: 'coins' },
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'combo', reward: 'manual' },
      { kind: 'unhurt', reward: 'coins' }
    ]
  },
  // 3 聽雪棧: two monks come up behind the heroes in round 4.
  {
    kind: 'slay',
    masters: ['master'],
    pieces: [],
    waves: [
      {
        id: 'behind',
        when: { round: 4 },
        place: '南棧口',
        pieces: [
          { id: 'scout-3#1', at: [8, 13] },
          { id: 'scout-3#2', at: [7, 14] }
        ]
      }
    ],
    sides: [
      { kind: 'spare', behaviour: 'herbs', piece: 'master', reward: 'manual' },
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'noMedicine', reward: 'coins' },
      { kind: 'swift', by: 5, reward: 'coins' }
    ]
  },
  // 4 空山琴臺: keep the qin on its stone seat on the open terrace, east of the steps, through
  // round 8; 嵩山弟子 up both wings, east in round 3 and west in round 5. 左冷禪 and 費彬 hold
  // their posts; their men go for the qin.
  {
    kind: 'keep',
    legacyKind: 'slay',
    masters: ['master'],
    objects: [{ id: 'guqin', at: [8, 5] }],
    hold: 8,
    pieces: [],
    waves: [
      {
        id: 'east',
        when: { round: 3 },
        place: '東翼花圃',
        pieces: [
          { id: 'scout-4#1', at: [12, 6] },
          { id: 'bow-4#1', at: [11, 6] }
        ]
      },
      {
        id: 'west',
        when: { round: 5 },
        place: '西翼',
        pieces: [
          { id: 'scout-4#2', at: [0, 6] },
          { id: 'bow-4#2', at: [1, 6] }
        ]
      }
    ],
    sides: [
      { kind: 'order', first: 'lieutenant', reward: 'coins' },
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'holdLine', zone: { y: [0, 4] }, place: '琴臺北階', reward: 'manual' },
      { kind: 'lamp', reward: 'coins' }
    ]
  },
  // 5 桃花石陣: lighter snake slaves come up from the east stream every two rounds.
  {
    kind: 'slay',
    masters: ['master'],
    pieces: [],
    waves: [
      {
        id: 'tide1',
        when: { round: 3 },
        place: '東側桃溪',
        pieces: [
          { id: 'bow-5#1', at: [13, 8], mods: { hp: 0.7 } },
          { id: 'scout-5#1', at: [13, 9], mods: { hp: 0.7 } }
        ]
      },
      {
        id: 'tide2',
        when: { round: 5 },
        place: '東側桃溪',
        pieces: [
          { id: 'bow-5#2', at: [13, 8], mods: { hp: 0.7 } },
          { id: 'scout-5#2', at: [13, 9], mods: { hp: 0.7 } }
        ]
      },
      {
        id: 'tide3',
        when: { round: 7 },
        place: '東側桃溪',
        pieces: [
          { id: 'bow-5#3', at: [13, 8], mods: { hp: 0.7 } },
          { id: 'scout-5#3', at: [13, 9], mods: { hp: 0.7 } }
        ]
      }
    ],
    sides: [
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'unhurt', reward: 'coins' },
      { kind: 'holdLine', zone: { x: [0, 8] }, place: '陣井以西', reward: 'manual' },
      { kind: 'lamp', reward: 'coins' }
    ]
  },
  // 6 襄陽殘垣: keep the city's war drum where the one passage south opens, through round 9: whoever
  // gets through the passage is at the drum. Riders twice from
  // the east, 完顏洪烈 and his archers from the west. 完顏洪烈 is its second master (Q-N28): a
  // master still to come has not fallen, so felling 金輪國師 alone does not end it.
  {
    kind: 'keep',
    legacyKind: 'slay',
    masters: ['master', 'wanYan'],
    objects: [{ id: 'warDrum', at: [6, 9] }],
    hold: 9,
    pieces: [],
    waves: [
      {
        id: 'riders1',
        when: { round: 3 },
        place: '東面缺口',
        pieces: [
          { id: 'scout-6#1', at: [12, 4], mods: { hp: 0.75 } },
          { id: 'scout-6#2', at: [11, 4], mods: { hp: 0.75 } }
        ]
      },
      {
        id: 'zhao',
        when: { round: 4 },
        place: '西北甬道',
        pieces: [
          { id: 'wanYan', at: [0, 1] },
          { id: 'jinBow#1', at: [0, 2] },
          { id: 'jinBow#2', at: [2, 0] }
        ]
      },
      {
        id: 'riders2',
        when: { round: 6 },
        place: '東面缺口',
        pieces: [
          { id: 'scout-6#3', at: [12, 4], mods: { hp: 0.75 } },
          { id: 'scout-6#4', at: [11, 4], mods: { hp: 0.75 } }
        ]
      }
    ],
    sides: [
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'intact', reward: 'coins' },
      { kind: 'double', reward: 'coins' },
      // 南面甬道 (holdLine, y 9–12) stood here: with the drum at the passage's mouth it was the
      // primary over again, met every time the board was won.
      { kind: 'unhurt', reward: 'manual' }
    ]
  },
  // 7 寒玉石室: the lean board, its four pieces only.
  {
    kind: 'slay',
    masters: ['master'],
    pieces: [],
    waves: [],
    sides: [
      { kind: 'lastBlow', hero: '*', target: 'master', reward: 'points' },
      { kind: 'noMedicine', reward: 'coins' },
      { kind: 'unhurt', reward: 'coins' },
      { kind: 'double', reward: 'manual' }
    ]
  },
  // 8 倒影天街: two masters, both must fall; a second blade pair when either is first at half.
  {
    kind: 'slay',
    masters: ['master', 'xianYu'],
    pieces: [
      { id: 'xianYu', at: [9, 2] },
      { id: 'huaBlade#1', at: [8, 3] },
      { id: 'huaBlade#2', at: [9, 3] }
    ],
    waves: [
      {
        id: 'pair',
        when: { halved: ['master', 'xianYu'] },
        place: '中街',
        pieces: [
          { id: 'huaBlade#3', at: [5, 7] },
          { id: 'huaBlade#4', at: [6, 7] }
        ]
      }
    ],
    sides: [
      { kind: 'lastBlow', hero: '*', target: 'xianYu', reward: 'points' },
      { kind: 'order', first: 'lieutenant', reward: 'coins' },
      { kind: 'double', reward: 'manual' },
      { kind: 'answer', hero: 'hero', reward: 'points' }
    ]
  },
  // 9 無刻漏臺: the final board; break the two posts the star ropes are tied to, each guarded by a
  // rope-keeper, while each standing post takes 35% off 慕容博's blows. A second lieutenant beside
  // the ropes, his disciples at the west gate.
  {
    kind: 'break',
    legacyKind: 'slay',
    masters: ['master'],
    objects: [
      { id: 'starPost#1', at: [11, 4] },
      { id: 'starPost#2', at: [2, 11] }
    ],
    pieces: [
      { id: 'wanZhen', at: [10, 3] },
      { id: 'wanDisciple#1', at: [9, 3] }
    ],
    waves: [
      {
        id: 'west',
        when: { round: 4 },
        place: '西門',
        pieces: [
          { id: 'wanDisciple#2', at: [0, 7] },
          { id: 'wanDisciple#3', at: [1, 7] }
        ]
      }
    ],
    sides: [
      // 不觸斗轉星移 (spare, behaviour 'mirror') stood here; the simulator never met it, since the
      // mirror stays charged until it turns a blow. It can return once 吸勁 can hold the mirror off
      // (ROADMAP 0.8).
      { kind: 'intact', reward: 'manual' },
      // The last blow on 慕容博 stood here: the board ends when the second post falls, so it could
      // be met only by felling him first through his ward, and almost never was.
      { kind: 'lastBlow', hero: '*', target: 'lieutenant', reward: 'coins' },
      { kind: 'order', first: 'wanZhen', reward: 'coins' },
      { kind: 'unhurt', reward: 'coins' }
    ]
  },
  // 10 谷底棋臺: the last board (world view §8.4). 求敗 stands at 天元 and is never felled: bring
  // him to 1 氣血. The ten masters of the run stand with him of their own accord, no 戰意 on them:
  // the first four met from the start, the rest walking on two by two. 無名 is the 眼.
  {
    last: true,
    kind: 'yield',
    commander: 'qiubai',
    masters: ['qiubai'],
    pieces: [
      { id: 'qiubai', at: [6, 6] },
      { guest: 0, at: [4, 5] },
      { guest: 1, at: [8, 5] },
      { guest: 2, at: [5, 3] },
      { guest: 3, at: [7, 3] }
    ],
    waves: [
      {
        id: 'north',
        when: { round: 3 },
        place: '北邊',
        pieces: [
          { guest: 4, at: [2, 1] },
          { guest: 5, at: [10, 1] }
        ]
      },
      {
        id: 'flanks',
        when: { round: 5 },
        place: '東西兩邊',
        pieces: [
          { guest: 6, at: [0, 4] },
          { guest: 7, at: [12, 4] }
        ]
      },
      {
        id: 'rear',
        when: { round: 7 },
        place: '北邊',
        pieces: [
          { guest: 8, at: [5, 0] },
          { guest: 9, at: [7, 0] }
        ]
      }
    ],
    sides: [
      { kind: 'intact', reward: 'manual' },
      { kind: 'swift', by: 9, reward: 'coins' },
      { kind: 'noMedicine', reward: 'coins' },
      { kind: 'double', reward: 'coins' }
    ]
  }
];
// The last board's index.
const LAST_MAP = BATTLES.findIndex((board) => board.last);

export { BATTLES, SIDE_REWARDS, LAST_MAP };
