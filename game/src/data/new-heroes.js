const NEW_HEROES = {
  huang: {
    name: '黃蓉',
    role: '奇門巧手',
    school: '桃花島・丐幫',
    mini: 'huang',
    portrait: 'huang',
    epithet: '桃島慧心',
    book: '射鵰英雄傳、神鵰俠侶',
    bio: '桃花島主黃藥師之女，通曉奇門陣法，又得洪七公傳授打狗棒法。渡船還沒靠岸，她已從三叢蘆花的位置，看出哪一條水道會折回原處。',
    basic: '落英神劍掌',
    skill: '打狗棒法',
    skillIcon: 'target',
    skillRange: 2,
    cost: 13,
    skillDesc: '兩格內以棒訣纏住敵手。此擊免受還擊，目標攻擊降低 4 點，持續兩回合。',
    voice: '那塊石頭不會走路。換了位置的，是我們腳下這一片岸。'
  },
  yang: {
    name: '楊過',
    role: '重劍豪俠',
    school: '古墓派',
    mini: 'yang',
    portrait: 'yang',
    epithet: '神鵰大俠',
    book: '神鵰俠侶',
    bio: '斷臂後，楊過在神鵰引領下以玄鐵重劍迎擊激流。與小龍女久別，他將相思之苦化入黯然銷魂掌。迷津中縱有百條岔路，他仍記得要找的那個人。',
    basic: '玄鐵劍法',
    skill: '黯然銷魂掌',
    skillIcon: 'hand',
    skillRange: 2,
    cost: 15,
    skillDesc: '自耗 9 點氣血，在兩格內重擊一名敵人。出掌後須留至少 1 點氣血。',
    voice: '我等過十六年，一程逆水還等得起。船家，開船。'
  },
  zhang: {
    name: '張無忌',
    role: '護陣醫俠',
    school: '明教・武當',
    mini: 'zhang',
    portrait: 'zhang',
    epithet: '明教教主',
    book: '倚天屠龍記',
    bio: '張無忌曾在蝴蝶谷習醫，後得九陽真經，於光明頂密道習成乾坤大挪移。聽見漏臺下有人喊痛，他先蹲下替人把脈，才想起還未問過這是何地。',
    basic: '太極拳',
    skill: '乾坤大挪移',
    skillIcon: 'shield',
    skillRange: 3,
    cost: 14,
    skillDesc:
      '為三格內一名友軍或自身卸力，施加 32 點護盾。護盾可抵銷總計 32 點傷害，最多保留兩回合。',
    voice: '讓我先看看他的傷。人救得回來，遲一班船又有甚麼打緊？'
  },
  hu: {
    name: '胡斐',
    role: '遊刀快客',
    school: '遼東胡家',
    mini: 'hu',
    portrait: 'hu',
    epithet: '雪山飛狐',
    book: '飛狐外傳、雪山飛狐',
    bio: '胡一刀之子，自幼由平阿四撫養，照胡家刀譜練成一身刀法。為了替素不相識的鍾家討回公道，他曾一路追索鳳天南。如今水裡浮出一串腳印，他照舊追了上去。',
    basic: '胡家快刀',
    skill: '胡家刀法',
    skillIcon: 'swords',
    skillRange: 1,
    cost: 12,
    skillDesc: '貼身連出兩刀，每刀按該招單擊傷害的 68% 結算。敵人撐過兩刀才可還擊。',
    voice: '那人把腳印掃乾淨了，倒忘了松枝上還掛著他袖口的雪。'
  }
};
const NEW_VOICES = {
  1: [
    {
      id: 'hu',
      line: '信使把韁繩纏在左腕上，右手有傷。誰替你壓了那道右拇指的蠟印，田歸農？'
    }
  ],
  2: [
    {
      id: 'zhang',
      line: '濕蘆葉都貼著地，只有這幾根一起一伏。姑娘，聽得見我，就在藥簍上輕敲一下。'
    }
  ],
  3: [
    {
      id: 'hu',
      line: '第二行腳印深了一截。有人原已過橋，又回頭把走不動的背了上去。'
    }
  ],
  5: [
    {
      id: 'huang',
      line: '近海的門閂銹得快，這半截偏磨得溜亮。裡頭有人試過好多回，我從這兒拆。'
    }
  ],
  6: [
    {
      id: 'huang',
      line: '輪楔上末道車痕還淺。靖哥哥認得這是哪家的車，我認得它該從哪個巷口出去。'
    },
    {
      id: 'yang',
      line: '守城門的儘管回頭，重劍替你們頂著。別叫筐裡那個小的醒來先看到箭頭。'
    }
  ],
  7: [
    {
      id: 'yang',
      line: '在這樣的寒玉上，姑姑連翻個身都極輕。這兒這道深痕，是有人拚盡氣力在喊疼。'
    }
  ],
  8: [
    {
      id: 'zhang',
      line: '手指叫細線勒白了，脈還跳得急。孩子，看著我，手放鬆一點，我來解線。'
    }
  ]
};

export { NEW_HEROES, NEW_VOICES };
