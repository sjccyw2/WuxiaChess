// Lines that belong to a hero, not to a board or a position in the run.
//
// Heroes are drawn at random and boards can be shuffled, so nothing here may assume who
// else is present or which board is being played. Each hero carries the same six things,
// written in 金庸's manner (wiki/content/單輪劇本.md §15):
//
//   arrival   the moment they were copied from, and their first words on arriving.
//             Used for the three drawn at the start and for anyone 求敗 lends later.
//   obey      their answer on hearing that the youth says where to go (said by the leader).
//   echoes    deja vu: the board keeps what happened on it. Only on later runs, on a board
//             reached before.
//   night     the mid-run talk: [what they will go back to, how they take being a copy].
//             The second is said from the second 境界, once 求敗 has told them.
//   summit    said when the art that made their name comes back to them, with what it cost.
//   farewell  their last words after the tenth board, as their copy is returned.
const HERO_VOICES = {
  hero: {
    arrival: {
      note: '他一身濕氣，一隻手猶自虛按著一塊並不存在的鐵板。',
      text: '奇哉。適才還在黑牢之中摸那鐵板上的字，怎地一抬頭便見了天日？莫非我終於死了。死後倒有風吹，那也不壞。'
    },
    obey: '小兄弟看得見，我看不見，那便聽你的。有酒沒有？有酒更好說話。',
    echoes: [
      '奇哉。這酒我分明不曾喝過，怎地知道它上頭得慢？',
      '小兄弟，你下一句是不是要叫我往左？……我也不曉得自己怎生知道。'
    ],
    night: [
      '回去？牢門還鎖著呢。鐵板上那些字我才摸了一半，總得回去將它摸完。',
      '原來我是一張拓片！哈哈，拓片也會口渴，可見這酒非喝不可。'
    ],
    summit: '風太師叔說，這路劍法有進無退，招招都是進攻。當時我只道痛快。如今想得全了方才明白：不守，是當真沒有東西可守了。',
    farewell: '這一路好生痛快。小兄弟，後會有期，下回我請你喝酒。'
  },
  medic: {
    arrival: {
      note: '她半蹲著身子，雙手還反扣在肩後，便如背著一個人。背上卻是空的。',
      text: '……冲哥？人呢？我明明背著他，山門便在前面。'
    },
    obey: '我向來只發號令，不聽號令。今日破一次例。你若走錯一步，我便自己走。',
    echoes: ['這一段我彈過。指頭認得，心裡卻沒有譜。', '你適才一抬手，我已知道你要我護著誰。這可奇了。'],
    night: [
      '回去將他背上山。方丈肯救，我這條命給他；不肯，我另想法子。',
      '那很好。真的那一個還背著他趕路，沒有耽擱。'
    ],
    summit: '這一曲我記起來了。作曲的兩位前輩合奏一遍，便雙雙去了。曲終人散，原來是這個意思。',
    farewell: '多謝。我背上還有個人等著，不能久留。'
  },
  guard: {
    arrival: {
      note: '他雙手纏著鐵鏈，鏈梢猶自晃動。',
      text: '人呢？適才亭外少說也有數百人，正教的、本教的，一個不少。老子正數到哪一個先上！'
    },
    obey: '老子這一世只聽一個人的號令。今日破例，聽你一個毛頭小子的。',
    echoes: [
      '老子好像欠你一碗酒。幾時欠的不記得，欠了是一定的。',
      '這條鏈子甩將出去，會纏住第三根柱子。……見鬼，老子怎知道這裡有柱子？'
    ],
    night: [
      '回去？亭外數百人等著老子。帶一悟回去，多放倒幾個；不帶，也是打。',
      '拓的又怎地？老子的鐵鏈打在人身上，一樣的痛。那老兒若不服，叫他下來試試。'
    ],
    summit: '想起來啦。那一日在涼亭之中，老子給鐵鏈鎖著，一步也挪不開，索性便不挪了。站定了打，原來比滿場遊走還痛快。',
    farewell: '好小子，棋下得不壞。亭外那數百人，老子回去會會他們。'
  },
  guo: {
    arrival: {
      note: '他一手虛抓著半空，便如仍攀著一條繩索。背後並沒有箭。',
      text: '繩子……斷了？我該在城牆半腰才是。城上的弟兄怎樣了？'
    },
    obey: '小兄弟瞧得見，我瞧不見，自然聽你吩咐。只是一樣：見了有人呼救，我是定要去的。',
    echoes: [
      '我記性不好。可是這條路，腳比我先認得。',
      '小兄弟，我好像答允過你一件事。是甚麼卻想不起來。你若記得，說與我知道。'
    ],
    night: ['回去守城。城在，百姓便有地方站。別的我沒想過。', '是真是假，我分不清楚。但身邊的人有難，總是要救的。'],
    summit: '恩師教頭一掌之時說，打出去的力道要留三分。我學了許多年方才懂得，如今又從頭懂了一次。',
    farewell: '小兄弟，你調度得好。我得回去了，城上少不得人。'
  },
  xiao: {
    arrival: {
      note: '她的衣袂猶自向上飄著，便如仍在往下墜落。',
      text: '這裡不是崖底。我跳下來了，是不是？'
    },
    obey: '好。你說站在哪裡，我便站在哪裡。',
    echoes: ['我見過你。在哪裡，不知道。見過便是見過。', '這條路我走過。那時身邊也有人。'],
    night: ['我不回去。我跳下來，是要他好好活著。……若是定要回去，我便再跳一次。', '嗯。'],
    summit: '這套劍法要兩個人使。我一個人，想起了兩個人的份。',
    farewell: '我走了。你一個人，要好好的。'
  },
  duan: {
    arrival: {
      note: '他一根手指猶自直直伸著，指尖卻甚麼也沒有發出來。',
      text: '咦，慕容公子呢？諸位請了，在下段譽。在下這指劍時靈時不靈，適才正好不靈，莫非就此到了陰世？'
    },
    obey: '兄台看得見全局？妙極，妙極。在下最怕自己拿主意，全聽兄台吩咐。',
    echoes: [
      '這位兄台好生面善，莫非在夢中見過？啊喲，眼下不正是在夢中麼。',
      '在下的腳自己走到這一格來了。凌波微步之中可沒有這一步，奇哉怪也。'
    ],
    night: [
      '兩位義兄還在山上苦戰，在下不能倒在那裡。只盼回去之時，這六脈神劍肯靈上一靈。',
      '拓下來的？妙極！那麼在下在此受苦，本尊半點不痛，這買賣倒也不算吃虧。'
    ],
    summit: '啊喲，六脈一齊通了！只是這一下將在下的內力使得乾乾淨淨。原來要它靈，須得傾囊而出，半點不能藏私。',
    farewell: '諸位保重。在下得回去了，兩位哥哥還等著我這不爭氣的指頭。'
  },
  huang: {
    arrival: {
      note: '她指尖還掐著半個陣訣，腳下踩的卻不是自己擺的石頭。',
      text: '陣眼不在這裡。……不對，這根本不是我的陣。幾個人，幾身不同年月的衣裳。這可有趣了。'
    },
    obey: '且慢。我先問你三步棋。……嗯，三步都不算蠢。好，聽你的，聽到你下蠢棋為止。',
    echoes: [
      '那邊第三根樁是鬆的。我沒來過，怎會知道？這裡頭大有文章。',
      '你這一手我見過。不是見旁人下，是見你下。小兄弟，你可得給我一個說法。'
    ],
    night: [
      '陣外有個大和尚等著破我的陣，我身邊還有要護的人。帶一悟回去，我要他一步也踏不進來。',
      '那麼外頭另有一個我，正替我擋著那大和尚？妙極。我在這裡多耽一刻，她也不吃虧。'
    ],
    summit: '最後這一路想起來了。棒影鋪天蓋地，四面八方都是，使的人自己也再無後著。難怪一局之中，只使得一回。',
    farewell: '小兄弟，你這盤棋下得比我料想的好。我得回去守我的陣了。'
  },
  yang: {
    arrival: {
      note: '他獨臂的衣袖還在風中翻飛。臉上並無驚惶，只有一點失望。',
      text: '這不是谷底。……她不在這裡。我等了一十六年，跳將下來，還是找錯了地方？'
    },
    obey: '聽你的？我先瞧你頭一局怎生下法。下得好，楊過這條臂膀借給你使。',
    echoes: ['等人等得久了，瞧誰都面善。你不同，你是真的面善。', '這地方我來過。那一回，我也在找人。'],
    night: [
      '回去？我只想知道她在哪裡。若是走完十局便能知道，叫我走一百局也成。',
      '拓的也好，真的也好。我心裡念著她，這一節總不是假的。'
    ],
    summit: '想起來了。這一路掌法，是等她的那些年裡自己湊出來的。……原來要先想起那些年，方才使得出這一掌。',
    farewell: '小兄弟，多謝了。我還有個人要找。'
  },
  zhang: {
    arrival: {
      note: '他一手按著胸口，低頭瞧了半晌。那裡沒有劍，也沒有血。',
      text: '咦……不痛了？那一劍分明已刺了進來。各位，這是甚麼所在？可有人受傷麼？'
    },
    obey: '你說怎生走，我便怎生走。只求一件：能不傷人性命，便不傷。',
    echoes: ['你的脈我好像把過。……失禮，我連你貴姓也還未請教。', '這一步，我好像替誰擋過一掌。擋的是誰，卻想不起來了。'],
    night: [
      '光明頂上還有許多人。我若倒在那一劍之下，他們一個也活不成。我得回去站著。',
      '那倒好了。本尊在那邊挨了一劍，這裡至少有一個我是不痛的，可以多替各位擋幾掌。'
    ],
    summit: '這一層想起來了。要使它，須得將護著自己的勁力全數讓將出去。……當日在密道之中練成，我倒沒想過它這般貴重。',
    farewell: '多謝各位。我得回光明頂去，那一劍還在等我。'
  },
  hu: {
    arrival: {
      note: '他的刀還舉在半空，刀下卻沒有人。',
      text: '苗大俠？……人不見了。我這一刀才舉到一半。'
    },
    obey: '我幫你。先說明白：是非曲直，我自己會看。',
    echoes: ['這一刀我好像劈過，又好像還沒劈。', '雪地裡走慣了，認得自己的腳印。這地下有我的腳印。'],
    night: [
      '回去還是那塊石頭，還是那一刀。劈也不是，不劈也不是。我想帶回去的，是劈與不劈之外的第三條路。',
      '拓下來的？那麼那一刀，本尊還舉在半空。我在這裡替他多想一刻也好。'
    ],
    summit: '這一刀想起來了。……便是我舉著來的那一刀。',
    farewell: '我回去了。那一刀還舉著。'
  }
};

// Books that count as one series. A hero and a board's master from the same series may
// have a line of their own on that board (ENCOUNTER_SCRIPT[].heroLines); any other pairing
// uses the board's ordinary lines.
const SERIES = {
  射鵰英雄傳: '射鵰三部曲',
  神鵰俠侶: '射鵰三部曲',
  倚天屠龍記: '射鵰三部曲',
  飛狐外傳: '飛狐',
  雪山飛狐: '飛狐'
};
// books: one title, or several joined by 、
const seriesOf = (books) => String(books || '').split('、').map((book) => SERIES[book] || book);
const sameSeries = (a, b) => seriesOf(a).some((series) => seriesOf(b).includes(series));

export { HERO_VOICES, SERIES, seriesOf, sameSeries };
