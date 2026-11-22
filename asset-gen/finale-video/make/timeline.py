# The ending film's one timeline: when each panel enters, every word with its times, and the three
# emphases. cut59.py (upright), cut169.py (wide) and sound59.py all read it, so the two cuts and the
# soundtrack cannot drift apart. Times are seconds.
DUR = 59.0
T = {
 'f1': 0.0,      # f1-twig      quiet opening, slow push in
 'f2': 4.6,      # f2-setdown   gentle dissolve
 'f3': 9.2,      # f3-stones    the board, unlit: slow dissolve
 'lit': 10.7,    #              the stones light (halftone dots spread from the middle), lights drift up
 'f4': 14.8,     # f4-thanks    warm dissolve
 'f5': 21.2,     # f5-wei       a light slide
 'f6': 26.0,     # f6-stance    a hard, quiet cut: the music has dropped away
 'eyes': 28.0,   # f6-eyes      THE HIT: the old man's eyes cut in as the second panel of the page
 'f7': 31.8,     # f7-leave     gravity: slow dissolve, slow swell
 'f8': 38.4,     # f8-wake      IMPACT: a band slams across at the height of his eyes
 'f9': 42.6,     # f9-sword     energy, entering gently (a soft iris)
 'f10': 47.6,    # f10-eagle    JOLT: breaks in from the left
 'f11': 51.6,    # f11-name     gravity: slow dissolve; the frame darkens
 'bell': 55.2,   #              a low bell
 'name': 55.3,   #              獨孤求敗 settles beside the youth
 'fade': 57.9,   #              fade to black, done by 58.9
}
# The words, in order: key -> (columns of vertical text, from, to). Keys starting with q are 求敗's
# balloons; the rest are narration boxes. A line may be split across two boxes at its punctuation;
# nothing is reworded, added or dropped (JOINED below is checked against SCRIPT on import).
WORDS = {
 '1':   (['那根枯枝，', '求敗沒有再舉起來。'], 0.8, 4.3),
 '2a':  (['他俯下身去，', '將枯枝輕輕', '擱在盤上。'], 5.2, 9.0),
 '2b':  (['不是落子，', '是放下。'], 6.5, 9.0),
 'q2':  (['夠了。'], 7.6, 9.15),
 '3a':  (['盤上的黑子白子，', '一枚一枚亮了。'], 9.9, 14.5),
 '3b':  (['盒中收了', '幾百年的子，', '也都亮了起來，', '各回各的年月。'], 11.7, 14.5),
 'q4':  (['老夫求了一世，', '求的原來', '便是這一放。'], 15.6, 18.7),
 'q5':  (['小兄弟，', '多謝你。'], 18.9, 21.05),
 '6a':  (['韋小寶收了攤子，', '挑在肩上，', '自谷口走了出去。'], 21.9, 25.8),
 '6b':  (['那道門，', '原來一直開著。'], 23.7, 25.8),
 '7a':  (['少年提劍而立。'], 26.4, 28.0),
 '7b':  (['求敗向他瞧了一眼，', '忽地一怔。'], 28.25, 31.65),
 'q7':  (['……原來是你。'], 29.5, 31.75),
 '8a':  (['他向少年拱了拱手，', '大袖飄飄，', '撒手而去，', '不知所終。'], 32.7, 38.1),
 '8b':  (['那頭大鵰', '望著他的背影，', '沒有跟去。'], 35.1, 38.1),
 '9a':  (['少年醒了。'], 38.95, 42.3),
 '9b':  (['這一回，', '他沒有再睡回去。'], 40.1, 42.3),
 '10a': (['他提了枕邊那柄劍，', '到屋後練將起來。'], 43.3, 47.35),
 '10b': (['夢裡的事', '一件也記不起，', '手卻都記得。'], 45.0, 47.35),
 '11':  (['練罷抬頭，', '崖上立著一頭大鵰，', '正側過了頭瞧他。'], 48.2, 51.4),
 '12':  (['許多年後，', '他劍下', '再無一合之敵，', '給自己取了', '一個名字。'], 52.3, 55.2),
}
NAME = ('獨孤求敗', T['name'], 58.9)
SCRIPT = ('那根枯枝，求敗沒有再舉起來。' '他俯下身去，將枯枝輕輕擱在盤上。不是落子，是放下。' '夠了。'
          '盤上的黑子白子，一枚一枚亮了。盒中收了幾百年的子，也都亮了起來，各回各的年月。'
          '老夫求了一世，求的原來便是這一放。' '小兄弟，多謝你。'
          '韋小寶收了攤子，挑在肩上，自谷口走了出去。那道門，原來一直開著。'
          '少年提劍而立。求敗向他瞧了一眼，忽地一怔。' '……原來是你。'
          '他向少年拱了拱手，大袖飄飄，撒手而去，不知所終。那頭大鵰望著他的背影，沒有跟去。'
          '少年醒了。這一回，他沒有再睡回去。'
          '他提了枕邊那柄劍，到屋後練將起來。夢裡的事一件也記不起，手卻都記得。'
          '練罷抬頭，崖上立著一頭大鵰，正側過了頭瞧他。'
          '許多年後，他劍下再無一合之敵，給自己取了一個名字。')
JOINED = ''.join(''.join(cols) for cols, a, b in WORDS.values())
assert JOINED == SCRIPT, 'the lettering no longer matches the fixed words'
