// Lines that belong to a hero, not to a board or a position in the run.
//
// Heroes are drawn at random and boards can be shuffled, so nothing here may assume who
// else is present or which board is being played. Each hero carries the same five things:
//
//   arrival   the moment they were called from, and their first words on arriving.
//             Used for the three who answer at the start and for anyone who joins later.
//   obey      their answer on hearing that the youth places the stones (said by the leader).
//   echoes    deja vu. Only said on later runs, on a board reached before.
//   night     the mid-run talk: [what they will go back to, how they take "we have been here"].
//   farewell  their last words after the tenth board.
const HERO_VOICES = {
  hero: {
    arrival: {
      note: '他一身濕氣，手還虛按著一塊並不存在的鐵板。',
      text: '怪了。方才還在黑牢裡摸鐵板上的字，怎麼一抬頭就見了天日？莫非我終於死了。死後倒有風吹，不壞。'
    },
    obey: '小兄弟看得見，我看不見，那就聽你的。有酒沒有？有酒更好說話。',
    echoes: [
      '怪了。這酒我分明沒喝過，怎麼曉得它上頭慢？',
      '小兄弟，你下一句是不是要叫我往左？……我也不曉得自己怎麼知道。'
    ],
    night: [
      '回去？牢門還鎖著呢。鐵板上那些字我才摸了一半，總得回去把它摸完。',
      '來過？哈哈，那這酒我該喝過好幾回了。可惜不記得味道，只好再喝。'
    ],
    farewell: '這一路痛快。小兄弟，後會有期，下回我請你喝酒。'
  },
  medic: {
    arrival: {
      note: '她半蹲著，雙手還反扣在肩後，像背著一個人。背上卻是空的。',
      text: '……冲哥？人呢？我明明背著他，山門就在前面。'
    },
    obey: '我向來只發號令，不聽號令。今日破一次例。你若走錯一步，我便自己走。',
    echoes: ['這一段我彈過。指頭認得，心裡卻沒有譜。', '你方才一抬手，我已知道你要我護誰。這倒奇了。'],
    night: [
      '回去把他背上山。方丈肯救，我這條命給他；不肯，我另想法子。',
      '來過便來過。我只問一句：前幾回，我把他背上山沒有？'
    ],
    farewell: '多謝。我背上還有個人等著，不能久留。'
  },
  guard: {
    arrival: {
      note: '他雙手纏著鐵鏈，鏈梢還在晃。',
      text: '人呢？方才亭外少說也有幾百人，正教的、本教的，一個不少。老子正數到誰先上。'
    },
    obey: '老子這輩子只聽一個人的號令。今日破例，聽你一個毛頭小子的。',
    echoes: [
      '老子好像欠你一碗酒。幾時欠的不記得，欠了是一定的。',
      '這條鏈子甩出去，會纏住第三根柱子。……見鬼，我怎麼知道這裡有柱子？'
    ],
    night: [
      '回去？亭外幾百人等著老子。帶一悟回去，多放倒幾個；不帶，也是打。',
      '來過？難怪看這小子順眼。順眼便是打過交道，錯不了。'
    ],
    farewell: '好小子，棋下得不壞。亭外那幾百人，老子回去會會他們。'
  },
  guo: {
    arrival: {
      note: '他一手虛抓著半空，像還攀著一條繩。背後沒有箭。',
      text: '繩子……斷了？我該在城牆半腰才是。城上的弟兄怎樣了？'
    },
    obey: '你看得見，我看不見，自然聽你的。只一樣：見了有人喊救命，我是要去的。',
    echoes: [
      '我記性不好。可這條路，腳比我先認得。',
      '小兄弟，我好像答應過你一件事。是甚麼卻想不起來。你若記得，告訴我一聲。'
    ],
    night: ['回去守城。城在，百姓便有地方站。別的我沒想過。', '來過便來過。該救的人還是要救，城還是要守。'],
    farewell: '小兄弟，你調度得好。我得回去了，城上少不得人。'
  },
  xiao: {
    arrival: {
      note: '她的衣袂還向上飄著，像仍在往下墜。',
      text: '這裡不是崖底。我跳下來了，是不是？'
    },
    obey: '好。你說站哪裡，我便站哪裡。',
    echoes: ['我見過你。在哪裡，不知道。見過就是見過。', '這條路我走過。那時身邊也有人。'],
    night: ['我不回去。我跳下來，是要他好好活著。……若一定要回去，我便再跳一次。', '嗯。'],
    farewell: '我走了。你一個人，要好好的。'
  },
  duan: {
    arrival: {
      note: '他一根手指還直直伸著，指尖甚麼也沒發出來。',
      text: '咦，慕容公子呢？諸位請了，在下段譽。小弟這指劍時靈時不靈，方才正好不靈，莫非就此到了陰間？'
    },
    obey: '兄台看得見全局？妙極，妙極。小弟最怕自己拿主意，全聽兄台吩咐。',
    echoes: [
      '這位兄台好生面善，莫不是在夢裡見過？啊喲，眼下不就是在夢裡麼。',
      '小弟的腳自己走到這一格來了。凌波微步可沒有這一步，奇哉。'
    ],
    night: [
      '兩位義兄還在山上苦戰，小弟不能倒在那裡。只盼回去時，這六脈神劍肯靈一靈。',
      '來過？那可要恭喜小弟了：同樣的好朋友，能結識許多回。'
    ],
    farewell: '諸位保重。小弟得回去了，兩位哥哥還等著我這不爭氣的指頭。'
  },
  huang: {
    arrival: {
      note: '她指尖還掐著半個陣訣，腳下踩的卻不是自己擺的石頭。',
      text: '陣眼不在這裡。……不對，這根本不是我的陣。幾個人，幾身不同年月的衣裳。有趣。'
    },
    obey: '慢著。我先問你三步棋。……嗯，三步都不蠢。成，聽你的，聽到你下蠢棋為止。',
    echoes: [
      '那邊第三根樁是鬆的。我沒來過，怎會知道？這裡頭有文章。',
      '你這一手我見過。不是見別人下，是見你下。小兄弟，你可得給我個說法。'
    ],
    night: [
      '陣外有個大和尚等著破我的陣，我身邊還有要護的人。帶一悟回去，我要他一步也踏不進來。',
      '那麼每一回我都會推到這裡，然後忘掉。有趣。下一回的我，可得再聰明些。'
    ],
    farewell: '小兄弟，你這盤棋下得比我想的好。我得回去守我的陣了。'
  },
  yang: {
    arrival: {
      note: '他獨臂的袖子還在風裡翻。臉上沒有驚，只有一點失望。',
      text: '這不是谷底。……她不在這裡。我等了十六年，跳下來，還是找錯了地方？'
    },
    obey: '聽你的？我先看你頭一局怎麼下。下得好，楊過這條胳臂借你使。',
    echoes: ['等人等久了，看誰都面善。你不同，你是真的面善。', '這地方我來過。那一回，我也在找人。'],
    night: [
      '回去？我只想知道她在哪裡。若走完十局能知道，叫我走一百局也成。',
      '來過？那我等的十六年，在這裡算甚麼？算一天，還是算一千年？'
    ],
    farewell: '小兄弟，謝了。我還有個人要找。'
  },
  zhang: {
    arrival: {
      note: '他一手按著胸口，低頭看了半天。那裡沒有劍，也沒有血。',
      text: '咦……不痛了？那一劍分明刺進來了。各位，這是甚麼地方？可有人受傷？'
    },
    obey: '你說怎麼走，我便怎麼走。只求一件：能不傷人性命，便不傷。',
    echoes: ['你的脈我像是把過。……失禮，我連你貴姓都還未請教。', '這一步，我好像替誰擋過一掌。擋的是誰，卻想不起來了。'],
    night: [
      '光明頂上還有許多人。我若倒在那一劍下，他們一個也活不成。我得回去站著。',
      '來過也好。那就是說，前幾回我們都沒有丟下誰。'
    ],
    farewell: '多謝各位。我得回光明頂去，那一劍還在等我。'
  },
  hu: {
    arrival: {
      note: '他的刀還舉在半空，刀下卻沒有人。',
      text: '苗大俠？……人不見了。我這一刀才舉到一半。'
    },
    obey: '我幫你。先說好：是非曲直，我自己會看。',
    echoes: ['這一刀我好像劈過，又好像還沒劈。', '雪地裡走慣了，認得自己的腳印。這地上有我的腳印。'],
    night: [
      '回去還是那塊石頭，還是那一刀。劈也不是，不劈也不是。我想帶回去的，是劈與不劈之外的第三條路。',
      '來過？那麼那一刀，我是每一回都舉著來的。'
    ],
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
