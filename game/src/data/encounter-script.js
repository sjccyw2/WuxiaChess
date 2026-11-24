// One entry per board, in map order (the ten boards of the first edition, then the five built
// round one villain each). Each board is a closed scene. Its black stones did not
// choose to be here: 求敗 pressed a 戰意 on them as he set them down, and they must fight whoever
// comes. They feel that the thought is not their own, they strain against it, and they cannot
// see who did it; inside the board a man sees only a few steps. Beating them lifts it.
//
// A board must never mention another board or where it falls in the run, because boards are
// shuffled. It is written in 金庸's manner (wiki/content/單輪劇本.md §15).
//
//   who       boss, mini (the lieutenant; a board built round one villain has none), youth (the player's character, who sees the whole
//             board from the table), leader and ally (whichever heroes are fielded; these lines
//             must suit anyone), or the id of a named black stone beyond those two ('zhaoZhong').
//             A line of a stone that is not on the board is left out.
//   heroLines replaces the leader/ally line before the battle when that hero is fielded. Only
//             heroes from the same series of books as the board's master have one.
//   extras    the named black stones 求敗 set down beside the master and his lieutenant, by id:
//               enter   what he says as he steps on, if he arrives during the battle
//               reply   { who, text }: what a stone already there says to that
//               heroes  a hero from his series of books answers him: before the battle if he
//                       stands there from the start, as he steps on if he arrives later
//   objects   the board's objects (battles.js `objects`), by key; each moment a { who, text } line
//             (who as above, but no leader or ally) said as it happens:
//               hit     the first time it is struck
//               half    the first time it is at half its 氣血
//               broken  as it breaks
//               lost    a 'keep' object: the board's reason for the loss its breaking is (text only)
//               held    a 'keep' object: the last round to hold is over and it still stands
//   guest     what the board's master says on the last board (battles.js `last`), where he stands
//             with no 戰意 on him, of his own accord: as the board opens if he is there from the
//             start, as he steps on if he comes later. It is about himself only.
//
// The last entry is the last board itself, 谷底棋臺. 求敗 and the youth are on it; what they say
// there is the spine's (maze-tale.js `finale`), so its own lines are only how the board looks.
const ENCOUNTER_SCRIPT = [
  {
    guest: '余某要出劍，何須誰來按？今日便使青城派自己的劍。',
    before: [
      {
        who: 'boss',
        note: '橋上靜得很，兩人的手卻都緊扣著兵刃。橋頭那人望向橋尾，先開了口。',
        text: '木駝子，爭了半世的劍譜，余某今日竟不想搶了。只想打上橋的人。你也是麼？'
      },
      {
        who: 'mini',
        text: '余矮子，你看這杖，駝子收不回來！哪個王八羔子擺佈駝子？有種便滾出來！'
      },
      {
        who: 'youth',
        text: '是老伯落子時按在他們眉心的戰意。他們不肯打也得打。要過橋，先打醒他們。'
      },
      { who: 'leader', text: '那就上橋。早些打醒，早些讓他們鬆手。' }
    ],
    win: [
      {
        who: 'mini',
        note: '駝杖噹地落在橋板上，木高峰低頭看手，一時竟沒去拾。',
        text: '總算鬆了！余矮子，是誰借駝子的手打架？駝子何曾答應過他？'
      },
      { who: 'youth', text: '問他也沒用，他也不知道為甚麼守橋。兩個人都醒了。橋已讓開，走罷。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '鐵鏈又將橋口絞緊。余滄海仍站在橋頭，臉上看不出半分得意。',
        text: '贏了又如何？心裡還是那一句。下一個上橋的，照打。'
      },
      { who: 'youth', text: '還不肯放人……橋又封住了。他們眉心那股力，一點也沒鬆。' }
    ],
    heroLines: {
      hero: '余觀主、木駝子，追了我林師弟千里，劍譜倒不想要了？看來給拿得不輕。在下替兩位鬆鬆筋骨。',
      medic: '連余滄海也忘了劍譜？他眼裡向來沒有別的。落子之人好本事。',
      guard: '拴住了，還不知繩頭在誰手裡？老子這條鐵鏈，倒可替兩位解解扣。'
    },
    extras: {
      fengTiannan: {
        enter: '這又不是鳳某的地頭，封甚麼渡口？……棍子倒先橫過去了。',
        reply: { who: 'boss', text: '橋那頭是誰？腦後一條辮子，甚麼打扮？' },
        heroes: {
          hu: '鳳天南，逃出佛山還要逃到這裡？……不對。你眼裡竟沒有逃的意思。',
          lingSu: '鳳老爺，大哥追你千里，提起便咬牙。你這眼神卻像中了藥。……又不像藥。'
        }
      }
    }
  },
  {
    guest: '原該走的，偏又想留。挨著這位老前輩，田某便有七分把握。',
    before: [
      {
        who: 'mini',
        note: '桌面映著幾隻握兵刃的手，握得甚緊，誰也沒望自己的手。閻基側耳聽了一會，轉向田歸農。',
        text: '田兄，別疑心是藥，兄弟搭過自己的脈了。下了半世藥，從沒見過這一味。心裡只催一個「戰」字。'
      },
      {
        who: 'boss',
        text: '不是藥，你便叫我這雙腳停下！田某一生不打沒把握的仗。它倒不問把握，自己往前走。'
      },
      {
        who: 'zhaoZhong',
        text: '連印信也無，下官竟聽了令。平日奉命才出手，今日倒同草莽一般。壓在誰身上都一樣重！'
      },
      {
        who: 'youth',
        text: '他們都想保命，卻誰也不肯讓路。這場只得打。各位準備接招。'
      },
      { who: 'ally', text: '這時候最容易亂下狠手。大家留神。' }
    ],
    win: [
      {
        who: 'boss',
        note: '長劍落地，田歸農往後退了一步，又退一步。這回雙腳終於聽使喚了。',
        text: '閻大夫，田某何曾肯做蝕本買賣？怎會在這裡同人拚命？'
      },
      { who: 'zhaoZhong', text: '這一仗算在誰名下？……罷了。不可上聞。' },
      { who: 'youth', text: '他可肯退了。剛醒便顧著退，這才像他自己。' }
    ],
    loss: [
      {
        who: 'mini',
        note: '驛鈴已啞，閻基把刀收好，手仍抖個不停。',
        text: '刀收了，還不准歇？田兄，你聽。它又在說「再來」。'
      },
      { who: 'youth', text: '贏的人也走不了。他們還得站在這裡，等下一個上門。' }
    ],
    heroLines: {
      hu: '田歸農，我爹爹的事還沒問清。你眼裡卻全不是自己的意思。先打醒你再問。',
      lingSu: '苗大俠的眼，是我治好的；你的斷腸草，出自我師叔。田相公，今日輪到你睜眼做瞎子了。'
    },
    extras: { zhaoZhong: {} }
  },
  {
    guest: '這回沒人擺佈老仙。法力無邊四個字，今日教你們親眼瞧瞧！',
    before: [
      {
        who: 'mini',
        note: '頌聲裡，老者皺著眉看自己的雙手，袖口兀自鼓動。少年卻把這當作顯威的徵兆，愈發喊得起勁。',
        text: '弟子早瞧出來了，師父今日要大展神威！星宿老仙，法力無邊！'
      },
      {
        who: 'boss',
        text: '放屁，老仙何時說要動手？向來只有老仙化人的功，誰敢撥弄老仙的手？滾出來！'
      },
      {
        who: 'youth',
        text: '不只他，他的弟子也人人受制，非全打醒不可。別站在下風。散開些。'
      },
      { who: 'leader', text: '連他也作不得主，這一場便躲不掉了。先散開。' }
    ],
    win: [
      {
        who: 'boss',
        note: '丁春秋袖中的毒粉落了一地。他看著掌心，耳邊再聽不見一句頌辭。',
        text: '走了……摘星子！誰按著老仙，你可瞧清？說！'
      },
      { who: 'youth', text: '他一醒便追問是誰，輸贏倒不問了。我若指指老伯，怕要聽他罵三天三夜。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '蘆花盡伏，丁春秋獨立灘頭，臉色比開打時還難看。',
        text: '不許喝采！那東西還壓著老仙。這場勝仗算誰的？'
      },
      { who: 'youth', text: '贏了也不准喝采。他心口還壓著東西，哪裡歡喜得起來。' }
    ],
    heroLines: {
      duan: '丁老先生不願動手，在下倒有同感。可惜你那袖子不答應。得罪了。',
      qiaoFeng: '喬某久聞你愛聽吹捧。今日弟子誇你，你倒先罵他。這一仗，果然不由你作主。',
      xuZhu: '令高徒只管誇，老先生卻像沒聽見。可是身上不由自主？阿彌陀佛。'
    },
    extras: {}
  },
  {
    guest: '嘿嘿，誰也別按老祖的手。老祖自己想砍人！',
    before: [
      {
        who: 'mini',
        note: '兩柄刀橫在窄窄的棧道上，刀後的僧人背靠崖壁。小的看看來人，又低頭看刀，像是算不清這筆買賣。',
        text: '老祖，這幾人沒油水，又沒仇。弟子拔刀作甚？它倒自己出鞘了。'
      },
      {
        who: 'boss',
        text: '老祖想不砍，試了三回，三回都是刀先動。奶奶的，索性砍罷。砍完再找那人算帳！'
      },
      {
        who: 'youth',
        text: '他掙不開，便索性往狠裡打。棧道窄，大家一個個守穩。別指望他留手。'
      },
      { who: 'leader', text: '刀可不管誰叫它砍。看穩腳下，別給逼到崖邊。' }
    ],
    win: [
      {
        who: 'mini',
        note: '寶象的刀插進雪裡，他晃了晃頭，像才浮出水面。兩人隨即各自收刀入鞘，這回刀沒有再彈出。',
        text: '老祖，這回不催了。方才拚命，究竟替誰？'
      },
      { who: 'boss', text: '誰知道是哪個不露面的！老祖吃了一世黑心飯，倒頭一回吃這等悶虧。' },
      { who: 'youth', text: '虧是吃了，卻連替誰賣命也說不出。如今刀總算肯收了。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '刀才入鞘，鞘上積雪未落，刃口又自行彈出半寸。',
        text: '砍完還不准收？寶象，守棧口。只怕得砍到它滿意。'
      },
      { who: 'youth', text: '贏了，刀還不肯歇。這條棧道走不過去了。' }
    ],
    heroLines: {
      diYun: '老和尚，你的手還掐著我……怎麼不認得我了？你這眼神，跟牢裡給打怕的人一樣。'
    },
    extras: {}
  },
  {
    guest: '同前輩並肩過一招，抵得上十年劍譜。這等有益之事，左某豈肯錯過。',
    before: [
      {
        who: 'boss',
        note: '兩人手中都蓄著力，目光卻各望一處。高處那人的掌心透出寒氣，先往自己手上看了看。',
        text: '費師弟，左某哪一掌不是算過才發？這回尚未算，掌心先冷了。'
      },
      {
        who: 'mini',
        text: '師兄尚未發令，小弟便得出手。心裡那聲催促，比師兄的令還重。'
      },
      {
        who: 'youth',
        text: '眉心那股力催著他們，打的卻是我們這邊的琴。把琴守好。拖到那一念散了，便能停手。'
      },
      { who: 'ally', text: '那就守住。若先打醒他，也能教他不再聽那號令。' }
    ],
    win: [
      {
        who: 'mini',
        note: '費彬扶著石階，把胸中那口氣緩緩吐出。掌上的勁力已留不住了。',
        text: '師兄，那聲音總算停了。小弟險些真信了，一輩子便為打這場仗。'
      },
      { who: 'boss', text: '記下了。敢越過左某號令門人，還把左某也算在內。' },
      { who: 'youth', text: '剛能自己作主，便記起這筆帳。有人比他更會發號令，他可忘不了。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '琴臺上的霜又厚了一層。左冷禪負手而立，掌心的寒氣收不回去。',
        text: '費彬，守階。這仗雖勝，竟不知替誰贏的。'
      },
      { who: 'youth', text: '連勝仗是替誰贏的也不知道。他還得守著。' }
    ],
    heroLines: {
      hero: '左盟主併五嶽，一向自己算得精。如今連發這一掌也由不得你？擺佈你的人倒好手段。',
      medic: '先破這局。左冷禪從來只聽自己的，我倒要瞧瞧誰能叫他聽話。',
      guard: '左冷禪也給人當刀使，原該大笑三聲。偏那使刀的，連老子也算進去了！'
    },
    extras: {},
    objects: {
      guqin: {
        hit: { who: 'youth', text: '琴絃震響了！他們衝著琴來的，快護住。' },
        half: { who: 'youth', text: '琴身裂了。再挨幾下，便沒法彈了。' },
        broken: { who: 'boss', text: '斷了……左某恨此曲半生。今日斷它，卻未能自己作主。' },
        lost: '琴斷絃絕，戰意所逼的事已成，這一局輸了。',
        held: { who: 'youth', text: '八合了，那一念撐不住了。琴還在！' }
      }
    }
  },
  {
    guest: '我是誰？不管啦，那邊要打。我也去！',
    before: [
      {
        who: 'mini',
        note: '白衣人緊握摺扇，指節已發白。他望著身旁那人，想問一句話，扇子卻始終收不回去。',
        text: '叔父，姪兒並不想打，手卻不依。你心裡是不是也有人催？'
      },
      {
        who: 'boss',
        text: '有，是我在催麼？克兒，我連自己是誰也不知道。哪個才是我的念頭？'
      },
      {
        who: 'youth',
        note: '少年的手停在半空。對面求敗指間的黑子，竟也停了一停。',
        text: '他是誰，我答不上。可那股力從盤外來，我看得清楚。先贏了，替他拿開。'
      },
      { who: 'leader', text: '分不清便更不能任它擺佈。先替他解了這一重。' }
    ],
    win: [
      {
        who: 'mini',
        note: '歐陽克手一鬆，摺扇落在桃瓣上。他顧不得拾，先去扶叔父。',
        text: '叔父，催你的已走了。往後想打不想打，都隨你自己。'
      },
      { who: 'boss', text: '走了，留下的便是我？……我是誰？' },
      { who: 'youth', text: '壓他的已經沒了，這句話卻還在。老伯也忘了自己的名字。怕也答不出。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '歐陽鋒伏在陣心，蛤蟆功的勁道一鼓一鼓，停不下來。',
        text: '打完還要打，誰要打？克兒，叫我一聲。我就記得了。'
      },
      { who: 'youth', text: '他還當是自己要打。那股力沒鬆，手便停不了。' }
    ],
    heroLines: {
      huang: '歐陽伯伯，瘋了倒肯說實話。人家只說要打，你還肯問誰的意思。告訴你，不是你的。',
      guo: '你害過我恩師，我記得。今日這一掌卻是旁人逼的。我先打散它。',
      yang: '爸爸，我是過兒。不認得也沒甚麼。那聲音不是你的，別聽。',
      hongQi: '老毒物，你還沒想出那招的破法，便動手了？這回不像瘋病。老叫化替你把心裡那東西敲出來！',
      yaoShi: '鋒兄半生心計，今日竟出手無章。誰把西毒當棋子使？我看著不痛快。'
    },
    extras: {}
  },
  {
    guest: '十層龍象般若功，正缺個配得上的對手。今日老衲自己要打。',
    before: [
      {
        who: 'boss',
        note: '門洞裡一人手持五輪，另一人想走，雙腳卻仍停在原處。兩人望向無聲的城頭，都沒有先開口。',
        text: '霍都，為師立功自有五輪，何須旁人推我？今日偏有人推著，非打不可。這算誰的本事？'
      },
      {
        who: 'mini',
        text: '師父，弟子倒想走。見勢不妙原該退，腿卻釘住了。'
      },
      {
        who: 'youth',
        text: '他們給逼在門下，要打的是我們這邊的鼓。守住鼓。門洞窄、五輪掃得寬，別擠著。'
      },
      { who: 'leader', text: '那就護鼓。此刻同他講理也無用，打醒再說。' }
    ],
    win: [
      {
        who: 'mini',
        note: '霍都啪地合扇，試著退了一步。腳下一能動，便轉身要走。',
        text: '師父，能走了！那股力散了，快離開這裡。'
      },
      {
        who: 'boss',
        text: '慢著！究竟輸在為師自己，還是那推我之人？這帳得算清。'
      },
      { who: 'wanYan', text: '大金亡了？本王不信那和尚的話。回去，自會看個明白。' },
      { who: 'youth', text: '一個急著走，一個偏要留下算帳。都能自己拿主意了。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '五輪回到掌中，嗡嗡旋轉，半分不歇。',
        text: '此勝不算為師的。霍都，站好。它還沒走。'
      },
      { who: 'youth', text: '贏也不肯認，走也走不得。他們還給釘在門洞裡。' }
    ],
    heroLines: {
      guo: '這門我認得，城牆卻比我守的殘了。國師，你我雖是敵人，我不佔你失神的便宜。早些醒罷。',
      huang: '靖哥哥守的城，每條巷子我都認得。大和尚連攻城也忘了，只管動手。這枚子可真聽話。',
      yang: '大和尚，你我打過幾回，何曾見你這樣悶？有人捂著嘴罷。楊某替你揭開。',
      xiao: '過兒敬重的人在這城裡。你雖身不由己，我也不讓。',
      zhang: '太師父提過這城，說到後來便不說了。這位大師失了神，下手不知輕重。各位小心。',
      hongQi: '靖兒蓉兒守的城，老叫化認得，羊肉湯也好。大和尚卻沒見過。看來也是給人牽著鼻子來的。',
      sanFeng: '少年時認得一位姑娘，來自襄陽。她說起城牆，眼睛便亮了。大師受了制，老道不同你計較。',
      zhaoMin: '我曾祖那輩攻了多年才下的城，軍中老人常說。這位是蒙古國師罷？連你也不聽自己的，倒有趣。'
    },
    extras: {
      wanYan: {
        enter: '本王要兵書，要這殘牆作甚？……令旗卻舉起來了。',
        reply: { who: 'boss', text: '王爺，貴國已亡了些年。今日你我，都替旁人出力。' },
        heroes: {
          guo: '完顏洪烈，我爹爹的血債沒忘。你眼裡卻空空的。這一掌，不算報仇。',
          huang: '趙王爺，千方百計求兵書，到頭來得了甚麼？如今連舉不舉旗，也輪不到你選。',
          yang: '聽說我爹爹叫了你十八年父王。……我該叫你甚麼？',
          hongQi: '你到臨安宮裡偷兵書那晚，老叫化正偷御廚的菜。今日書沒拿著，魂也丟了麼？',
          yaoShi: '騙我說蓉兒葬身海裡的番僧，是你府上的。趙王爺，這筆帳……哼。我何苦同一枚失神的子算帳。'
        }
      }
    },
    objects: {
      warDrum: {
        hit: { who: 'youth', text: '鼓響得不對。他們是要打破鼓面！' },
        half: { who: 'youth', text: '蒙皮裂了！再打破，城上便沒聲音了。' },
        broken: { who: 'boss', text: '攻這城從未如此容易……鼓破了。這一下，卻非為師本意。' },
        lost: '鼓破聲止，城頭再無聲息。戰意所逼之事既成，這局便輸了。',
        held: { who: 'youth', text: '九合已過，那一念散了。鼓好好地留在架上。' }
      }
    }
  },
  {
    guest: '沒有人逼我。我這一口怨氣，原是自己的。',
    before: [
      {
        who: 'mini',
        note: '兩個女子都作道姑打扮，立在結霜的玉壁前。年長的拂塵低垂，指間三枚銀針卻扣得牢牢的。',
        text: '師父，弟子不想打。心裡催個不停，這拂塵怎麼也放不下。'
      },
      {
        who: 'boss',
        text: '我也沒想起那個人，針卻到了手裡。凌波，從前殺人還有自己的恨。今日連恨也借了別人的。'
      },
      {
        who: 'youth',
        text: '連恨誰都不由自己，手還得打。小心銀針上的毒。別讓她瞄準。'
      },
      { who: 'ally', text: '手不聽使喚，愛恨也由不得自己。早些打醒她罷。' }
    ],
    win: [
      {
        who: 'mini',
        note: '洪凌波鬆開手，拂塵落地。她看了看掌心，隨即望向師父。',
        text: '師父，不催了。你的針也放下了。'
      },
      { who: 'boss', text: '是放下了。不替旁人恨，手竟這麼輕。' },
      { who: 'youth', text: '針不在手裡了，她還看著。看了這麼久。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '霜花在玉壁上紛紛碎落。李莫愁射去三枚銀針，指間轉眼又自行補上三枚。',
        text: '凌波，到我身後。還得打。我收不住手。'
      },
      { who: 'youth', text: '明明已贏了，針還扣著。那股力不肯鬆。' }
    ],
    heroLines: {
      xiao: '師姐，恨了這許多年，總還是自己的。今日這個不是。我替你去掉。',
      yang: '李莫愁，我只算你自己欠的帳。今日出手由不得你。今日不算。',
      huang: '一個情字已困住你，今日又添一重。前一重我沒法子。後一重倒可試試。'
    },
    extras: {}
  },
  {
    guest: '岳某本願以和為貴。奈何前輩有命，不敢不從。諸位包涵。',
    before: [
      {
        who: 'mini',
        note: '兩道倒影在水面相望，劍光與扇影卻各自逼向前。佩劍人的弟子望望這頭，又望望那頭。',
        text: '師父，弟子向來聽兩頭的令，一明一暗。心裡這一道，卻兩頭都不是。'
      },
      {
        who: 'boss',
        text: '動手須先占理，這規矩你忘了？……岳某尚未占理，劍已出鞘。豈是君子本意。'
      },
      {
        who: 'xianYu',
        text: '在下鮮于通，動口為上，動手必留後著。今日竟來不及……青衫朋友，你怎也佩華山掌門的劍？'
      },
      { who: 'boss', text: '鮮于……歷代掌門名錄，有此二字。原是前代人物。' },
      {
        who: 'youth',
        text: '隔了這麼多年，兩位掌門倒像一對倒影；兩個都得打醒才行。一個劍快，一個扇裡有毒。別讓近身。'
      },
      { who: 'leader', text: '連動手的名目也找不出。這回不是他們作主，便不必客氣了。' }
    ],
    win: [
      {
        who: 'mini',
        note: '勞德諾先鬆開劍柄，隨即退了半步。',
        text: '師父，那道令沒了。弟子頭一回打完一仗，還不知替誰辦事。'
      },
      { who: 'boss', text: '方才失態，岳某愧甚。實非本心，諸位明鑒。' },
      {
        who: 'xianYu',
        text: '連「神機子」也給當槍使，好險！這事傳出去，還有甚麼臉面？諸位便揭過這頁罷。'
      },
      { who: 'youth', text: '一個醒了先整衣襟，一個先怕丟名聲。客氣話又來了，倒聽得出是他們自己。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '街上窗戶仍無一扇打開。岳不群把劍推回鞘裡，劍鋒卻又滑出三寸。',
        text: '德諾，不可外傳。……為師這劍，竟收不住。'
      },
      { who: 'youth', text: '說不外傳，也藏不住那口劍。逼他們的還在街上。' }
    ],
    heroLines: {
      hero: '師父教我出劍要有道理，今日卻沒了。弟子仍叫你師父。這道理，斗膽替你尋回來。',
      medic: '岳先生這回拔劍，連客套也來不及。使喚他的人，比他還不講客氣。',
      guard: '岳先生不講仁義道德，老子原該愛聽。偏是給捂了嘴。這可不算長進。'
    },
    extras: {
      xianYu: {
        heroes: {
          zhang: '鮮于掌門，光明頂上才露過扇中機關。這回當心些。別又傷了自己。',
          sanFeng: '六派上光明頂，至今無信，老道正掛心。鮮于掌門卻在此處？眼神這般，怕非自己來的。',
          zhaoMin: '鮮于掌門，萬安寺請六派作客，點名獨少了你。原來在這裡。'
        }
      }
    }
  },
  {
    guest: '一生替大燕出力，未替自己打過一日。今日便算老夫自己的。',
    before: [
      {
        who: 'youth',
        note: '臺心老者身上的星索直通盤外，繃得筆直。那股催人交手的戰意，此地竟連形跡也不藏。',
        text: '到末局了，那兩條索就是壓著他的東西。各有銅樁繫著、有人守著。樁一倒，索便斷。'
      },
      {
        who: 'mini',
        text: '慕容先生，天下路數小僧自問皆識。你我心中這道戰意，卻無經可考。怪哉。'
      },
      {
        who: 'boss',
        text: '明王只問路數？老夫半生暗中撥人相鬥，今日也嚐到了。它說打，便得打。'
      },
      {
        who: 'wanZhen',
        text: '老夫夜夜如此，睡著還得砌牆，醒來一身灰。今日不過換堵牆。'
      },
      { who: 'youth', text: '別人還得用索牽，他卻不必。原來睡著，也能動手。' },
      { who: 'leader', text: '那就先斷這兩條索。索斷了，便能自己作主。' }
    ],
    win: [
      {
        who: 'boss',
        note: '兩股星索斷後縮回盤外，慕容博身子跟著一晃。這次卻是自己站穩的。',
        text: '算了一世，原來也是人家盤上的子。明王，這滋味莫忘。'
      },
      { who: 'mini', text: '記下了。只是那戰意何人所創？才散，小僧倒有些不捨。' },
      { who: 'wanZhen', text: '牆砌到哪裡了？……不是我家？老夫怎在這裡？' },
      {
        who: 'youth',
        note: '銅漏那一聲響，在臺上迴盪。',
        text: '十局都贏了。各位，能回去了。'
      }
    ],
    loss: [
      {
        who: 'boss',
        note: '星索又勒緊一圈，慕容博站在臺心，一動也動不得。',
        text: '明王，還不肯放。老夫只得守著，等下一撥。'
      },
      { who: 'youth', text: '索還沒斷。就差這一局……' }
    ],
    heroLines: {
      duan: '在下同令郎雖有過節，今日先對付這兩條索。六脈神劍偏又時靈時不靈。這回可得靈些。',
      qiaoFeng: '姑蘇慕容還施彼身，喬某久仰，正有命案待問。尊駕這年紀，自非慕容公子。是慕容家哪位？',
      xuZhu: '大師在棋局邊同慕容公子談得好好的，怎地眼裡沒了神？阿彌陀佛。小僧得罪了。'
    },
    extras: {
      wanZhen: {
        heroes: {
          diYun: '萬師伯，在你家冤作賊，害我坐了這許多年的牢。如今你眼神卻空了。先醒醒，我還要問為甚麼。'
        }
      }
    },
    objects: {
      starPost: {
        hit: { who: 'boss', text: '樁震了，索也一緊。……打得好。' },
        half: { who: 'youth', text: '樁裂了，索上的光也暗了。再加把勁。' },
        broken: { who: 'boss', text: '鬆了一股。這身子又多一分聽老夫的了。' }
      }
    }
  },
  // The boards built round one villain: no lieutenant, so no 'mini' line.
  {
    guest: '都退開，本座自己來。心裡清淨得很。這回的旨意，是本座下的。',
    before: [
      {
        who: 'boss',
        note: '海島上這座竹堂，瓦片給頌聲震得輕響，白鬚老者仍端坐高臺。聲音愈響，他的眉頭便皺得愈緊。',
        text: '住口，這句「仙福永享，壽與天齊」究竟祝誰？聽了幾十年，今日倒像祝別人。這道號令不是本座下的！'
      },
      {
        who: 'youth',
        text: '他慣叫人賣命，這回自己也非動手不可。那手隔幾步便抓得到人。誰給扯過去，旁邊快接應。'
      },
      { who: 'leader', text: '臺下還當他在發令。先打醒臺上的，底下自然散。' }
    ],
    win: [
      {
        who: 'boss',
        note: '洪安通立在臺前，低頭看手，五指兀自屈成擒拿之形，這才慢慢鬆開。身後那片頌聲已無聲無息地歇了。',
        text: '還跪著作甚？是誰作主叫本座下場？說得出來，賞一顆豹胎易筋丸的解藥！'
      },
      { who: 'youth', text: '才鬆開手，便又查起誰越過他發令。這個人，他可查不著。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '臺下又念起頌辭，一聲壓過一聲。',
        text: '不准念！這仗不是本座要打的。祝誰的仙福？'
      },
      { who: 'youth', text: '底下越賀勝，他臉色越差。壓著他的那股力，還沒肯走。' }
    ],
    heroLines: {},
    extras: {}
  },
  {
    guest: '這回刀劍由公孫某自己使。無人代作主張。貴客休怪。',
    before: [
      {
        who: 'boss',
        note: '花間小刺密密匝匝，花徑盡頭那人寬袍緩帶，臉上含笑。左手金刀、右手黑劍都亮了出來，與那笑意全不相稱。',
        text: '貴客光降，原該掃徑相迎……這刀劍失禮了。谷中一向由公孫某作主。今日倒有人替我作主！'
      },
      {
        who: 'youth',
        text: '他笑他的，刀劍可沒停；張網的弟子也都給壓著，須全打醒。花叢帶刺，腳下走不快。小心網罩下來。'
      },
      { who: 'ally', text: '客氣話聽聽便罷。那刀劍輪著來，一回重、一回長。看準才近身。' }
    ],
    win: [
      {
        who: 'boss',
        note: '刀劍雙雙垂下，公孫止先回頭看了石屋一眼，才整好衣冠。',
        text: '方才實在作不得主，失禮了。諸位請便。石屋那邊，不必去了。'
      },
      { who: 'youth', text: '醒了便先看門閂，原來他怕人進石屋。裡頭藏甚麼，是他自己的事了。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '漁網從四面收緊，公孫止嘴邊那點笑意卻漸漸沒了。',
        text: '客是留下了，卻非公孫某的主意。收網……還得再張開。它又要等客了。'
      },
      { who: 'youth', text: '留下了人，他也笑不出來。連下一步做甚麼，還是由那股力替他定。' }
    ],
    heroLines: {
      yang: '公孫谷主，這刀劍倒比你笑臉老實。替你作主的，我先打散。你我自己的帳，隨後再算。',
      xiao: '公孫先生，救我騙我都是你。今日卻不是你作主。我不怪你，也不讓。',
      huang: '好斯文的谷主，好不斯文的手！給算計得連客套也說不順，算計你的人倒厲害。'
    },
    extras: {}
  },
  {
    guest: '今日無人點名。老夫想打誰，便打誰。這一掌，是裘某自己要出的。',
    before: [
      {
        who: 'boss',
        note: '水聲轟轟，那身黃葛短衫立在山門前，半步不動。老者雙掌本垂在兩側，目光一到來人身上，掌便提了起來。',
        text: '裘某打誰，何須旁人點名？今日偏有人在心裡點了，問也不許問。好，連老夫也作了棋子！'
      },
      {
        who: 'youth',
        text: '嘴還不服，掌已提起來了。我們涉不過急水，他卻踏水便來。先上石頭，別在水裡打。'
      },
      { who: 'leader', text: '踏腳石先站穩。在水裡接掌，正中他的下懷。' }
    ],
    win: [
      {
        who: 'boss',
        note: '裘千仞垂下雙掌，腳下再不挪動。右手翻過來之後，他便一直看著。',
        text: '方才的掌，不是老夫想打的。那麼從前想打的那些，又有幾掌該打？'
      },
      { who: 'youth', text: '他不走，也不罵了。這句是在問自己，我答不了。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '溪聲不歇，裘千仞立在水邊，掌心勁力一吐一收，竟也停不了。',
        text: '贏過這許多回，沒一次這般不由自己。它還要老夫守溪！'
      },
      { who: 'youth', text: '贏了還得守，掌也收不回。他眉心那股力仍在。' }
    ],
    heroLines: {
      guo: '裘幫主，蓉兒中你那掌險些喪命，我沒忘。今日卻是別人逼你出掌。舊帳待你醒了再算。',
      huang: '裘老兒，我那半條命還欠著呢。瞧你兩眼發直，倒像你那吹牛兄長給點了穴。先醒醒，再算帳。',
      yang: '鐵掌我認得。見他時已是慈恩和尚了。原來從前這般不肯回頭。',
      hongQi: '老叫化殺過二百三十一個惡徒，當面向你說過。今日卻不佔你受制的便宜。先打掉那個念頭！',
      yaoShi: '歸雲莊吐煙裝神的「鐵掌水上飄」，是你麼？那人眼滑，你卻眼空。原來有兩個。'
    },
    extras: {}
  },
  {
    guest: '鬥了一世，再鬥一場也好。這回是我歡喜，沒誰借手。',
    before: [
      {
        who: 'boss',
        note: '白綢遮住女子的面目，話聲卻輕柔地送了過來。身旁宮燈亮著，蓮池尚無一絲波紋。',
        text: '鬥了一世，原為誰我自明白。今夜卻既非為他，也非為師姊。哪位這樣大膽，借我的手？'
      },
      {
        who: 'youth',
        text: '她說得輕，手卻給催著出掌；掌力會轉彎，石欄後頭也躲不了。禁衛愛兩個夾一個。別讓他們合圍。'
      },
      { who: 'ally', text: '連擋在前面的人也攔不住這掌。各自留心，替人硬擋不得。' }
    ],
    win: [
      {
        who: 'boss',
        note: '宮燈不晃了。李秋水抬手按住白綢，先把自己的臉遮妥。',
        text: '剛才那些掌非我本意。你們可曾瞧見我的臉？沒有便好。'
      },
      { who: 'youth', text: '她先不問輸贏，只問那塊白綢遮住了沒有。原來怕的是這個。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '宮燈逐盞復明，李秋水仍立殿階前。衣袖裡掌力吞吐，未曾稍歇。',
        text: '不是為他打的，贏來何用？……還不肯走麼？'
      },
      { who: 'youth', text: '她連贏也不想要了。偏那股力還壓著。' }
    ],
    heroLines: {
      duan: '前輩這身形，好像無量山洞中的玉像。神仙姊姊卻不會出手傷人。在下得罪了。'
    },
    extras: {}
  },
  {
    guest: '花繡倦了，來看天下英雄。這針是我自己拿的。',
    before: [
      {
        who: 'boss',
        note: '崖頂紅梅翠竹，處處佈置精雅。門前那身粉紅衣衫映著膝上繃架，唯獨指間的針，偏指向了人。',
        text: '我早不動手了，天下英雄哪及這朵花。針卻自己離了繃子。誰來擾我？'
      },
      {
        who: 'youth',
        note: '少年低聲念了念「不敗」二字，棋臺對面，求敗抬起眼來。',
        text: '他把人家求的「不敗」當名字，只管繡花，偏給逼著出針。快得看不清，一出手便刺兩人。別擠在他身前。'
      },
      { who: 'leader', text: '再快也須落腳。分開站，別讓他接連刺中。' }
    ],
    win: [
      {
        who: 'boss',
        note: '針落石徑，輕輕一聲。東方不敗俯身拾起，將針放回繃架，先去細看上頭的花樣。',
        text: '半日清靜，倒繡壞了三針。那些殺人的針非我本意。去罷，今日不殺你們。'
      },
      { who: 'youth', text: '醒來先數繡壞幾針，輸贏倒不提。他是真沒把勝敗放在心上。' }
    ],
    loss: [
      {
        who: 'boss',
        note: '梅瓣落了一地，每瓣都有針孔。東方不敗坐回門前，指間的針仍不肯落到繃架上。',
        text: '人都倒了，還不許我繡花，只叫等人。蓮弟問起來，教我怎樣說？'
      },
      { who: 'youth', text: '贏到連花也繡不成。針上那股力，還沒肯鬆。' }
    ],
    heroLines: {
      hero: '久聞教主大名，只道三頭六臂，原來愛繡花。逼你扔下針線動手，怕比逼在下戒酒還難受。',
      medic: '東方叔叔，小時候你抱我上山採果子，我還記得。今日先不算爹爹的舊帳。是那股力逼你出針。',
      guard: '奪任教主位子的帳，老子記著。如今你連教主也不想當，只想繡花，他卻不許。比老子還不講理！'
    },
    extras: {}
  },
  // The last board (谷底棋臺): only 無名 speaks for the white side.
  {
    before: [
      {
        who: 'youth',
        note: '那方青石棋枰到了腳下，竟大如校場，十三路縱橫伸開，一路便是一步。東邊瀑布落入淺潭，水聲從枰外傳來。',
        text: '上了盤才知道，眼前真的只剩幾步。原來各位一直是這麼走的。'
      }
    ],
    win: [{ who: 'youth', note: '四下無人再出手，枰外的瀑聲忽然聽得清清楚楚。', text: '停手了……大家都停了。' }],
    // (Lost by 無名 falling or by the twelve rounds running out: the line must fit both.)
    loss: [{ who: 'youth', note: '瀑聲未歇，盤上眾人卻一齊住了手。', text: '我……沒能撐住。' }]
  }
];

export { ENCOUNTER_SCRIPT };
