"""The characters of the four boards added on 2026-11-28 (maps 16 to 19), as the image model is
asked to paint them. `group` is the pack's: 'villain' (a named 局主) or 'troop' (a troop type).
`look` describes the figure; `weapon` what is in the hands; `attack` and `special` the fourth and
fifth rows of the sheet. `like` is the roster-pack character whose sheet and portrait are given
as the style and layout reference.
"""

CAST = {
    # 16 石樑 溫家: the five brothers of the 五行陣, each robed in the colour of his element, and
    # the house's retainers.
    'wenDa': dict(
        group='villain', name='溫方達', book='碧血劍', like='hongAn',
        look=('the eldest of five elderly brothers of a wealthy, hard Zhejiang gentry clan: about '
              'seventy, broad and heavy, a long grey beard, a severe square face, a dark ochre-yellow '
              'scholar-gentleman robe with a brown sash and a small black gauze cap'),
        weapon='bare hands, the palms open',
        attack='a heavy two-handed palm strike pushed forward',
        special='both palms drawn back to the hip, then a great double-palm blow thrust forward'),
    'wenYi': dict(
        group='villain', name='溫方義', book='碧血劍', like='hongAn',
        look=('the second of five elderly gentry brothers: about sixty-eight, tall and stiff, a '
              'neat white beard, narrow cold eyes, an off-white silver-grey scholar-gentleman robe '
              'with a pale sash and a small black gauze cap'),
        weapon='bare hands',
        attack='a quick chopping palm to the right',
        special='a spinning step and a sweeping chop with the edge of the hand'),
    'wenShan': dict(
        group='villain', name='溫方山', book='碧血劍', like='qiuRen',
        look=('the third of five elderly gentry brothers, the fiercest: about sixty-five, lean and '
              'hard, a short grizzled beard, a hawk nose and glaring eyes, a very dark blue-black '
              'scholar-gentleman robe with a black sash and a small black gauze cap'),
        weapon='bare hands',
        attack='a driving fist and palm combination to the right',
        special='a leaping strike coming down with both palms'),
    'wenShi': dict(
        group='villain', name='溫方施', book='碧血劍', like='hongAn',
        look=('the fourth of five elderly gentry brothers: about sixty-two, thin and wiry, a sparse '
              'black-and-grey goatee, a sly sidelong look, a dull green scholar-gentleman robe with a '
              'dark green sash and a small black gauze cap'),
        weapon='bare hands',
        attack='a low sweeping palm to the right',
        special='a darting step forward with both hands clawing'),
    'wenWu': dict(
        group='villain', name='溫方悟', book='碧血劍', like='qiuRen',
        look=('the youngest of five elderly gentry brothers: about sixty, stocky and red-faced, a '
              'bristling grey moustache, a dark red scholar-gentleman robe with a black sash and a '
              'small black gauze cap'),
        weapon='bare hands',
        attack='a hard straight punch to the right',
        special='a stamping step and a rising double fist'),
    'shiLiang': dict(
        group='troop', name='石樑派弟子', book='碧血劍', like='xiaGuard',
        look=('a young retainer of a rich gentry clan in Zhejiang: plain indigo jacket and trousers, '
              'a white sash, leg wrappings, cloth shoes, hair in a topknot with a dark cloth band'),
        weapon='a plain broad sabre (dao)',
        attack='a slash with the sabre to the right',
        special='raising the sabre high, then a hard downward cut forward'),
    # 17 萬安寺: the two old men of the 汝陽王府, and the foreign monks who guard the tower.
    'luZhang': dict(
        group='villain', name='鹿杖客', book='倚天屠龍記', like='hongAn',
        look=('鹿杖客, the elder of the 玄冥二老 who serve the Mongol prince: about seventy, tall and '
              'lean, long white hair and a white beard, a lustful sly face, a dark grey-green robe '
              'with a black fur collar'),
        weapon='a long staff whose head is a carved deer antler',
        attack='a thrust of the deer-antler staff to the right',
        special='the staff planted, then a cold open palm (玄冥神掌) driven forward, frost-pale'),
    'heBi': dict(
        group='villain', name='鶴筆翁', book='倚天屠龍記', like='hongAn',
        look=('鶴筆翁, the younger of the 玄冥二老: about sixty-eight, gaunt, a short pointed white '
              'beard, a red-tipped drinker\'s nose, a dark brown-black robe with a grey fur collar and '
              'a gourd of wine at the belt'),
        weapon='a pair of iron crane-beak brushes (鶴嘴筆), one in each hand',
        attack='a jab with both crane-beak brushes to the right',
        special='a whirling double stab with the brushes, then a cold palm thrust'),
    'fanSeng': dict(
        group='troop', name='西域番僧', book='倚天屠龍記', like='xiaGuard',
        look=('a Tibetan lama in the service of the Yuan court: shaven head, heavy build, a maroon '
              'robe with a saffron-yellow shoulder cloth, a string of large beads, boots'),
        weapon='a heavy iron staff with a bronze ring head',
        attack='a sweep of the iron staff to the right',
        special='the staff whirled overhead, then slammed down forward'),
    # 18 光明頂: the head of 峨嵋, the schemer in a monk's robe, and her disciples.
    'mieJue': dict(
        group='villain', name='滅絕師太', book='倚天屠龍記', like='liQiu',
        look=('滅絕師太, the stern elderly Buddhist nun who heads the 峨嵋派: about sixty, gaunt and '
              'severe, thin lips pressed tight, long greying brows, a plain grey nun\'s cap, a long '
              'plain grey-blue nun\'s robe with a dark collar, dark prayer beads, cloth shoes'),
        weapon='a slim, very bright straight sword (倚天劍)',
        attack='a sword thrust to the right',
        special='the sword raised overhead, then a great slashing cut forward with the robe sweeping'),
    'chengKun': dict(
        group='villain', name='成昆', book='倚天屠龍記', like='hongAn',
        look=('成昆 disguised as the Shaolin monk 圓真: about sixty-five, lean, a shaven head with '
              'ordination scars, a long thin face with hooded calculating eyes and a faint smile, a '
              'dull ochre-grey Shaolin monk\'s robe with a brown kasaya over one shoulder, prayer beads'),
        weapon='bare hands, the fingers held stiff',
        attack='a stabbing one-finger strike (幻陰指) to the right',
        special='a gliding step, then a pale cold finger strike thrust forward'),
    'emei': dict(
        group='troop', name='峨嵋弟子', book='倚天屠龍記', like='xiaGuard',
        look=('a young woman disciple of the 峨嵋派: hair bound up plainly, a pale blue-grey robe and '
              'trousers with a white sash, cloth shoes, a calm determined face'),
        weapon='a straight sword',
        attack='a sword thrust to the right',
        special='a turning step and a wide sweeping sword cut forward'),
    # 19 俠客島: the two envoys who bring the bronze tokens, and the island's disciples.
    'zhangSan': dict(
        group='villain', name='張三', book='俠客行', like='qiuRen',
        look=('張三, the 賞善使 envoy of 俠客島: middle-aged, short and very fat, a round beaming face '
              'always smiling, a plain bright yellow robe, a round black cap, a bronze token on a cord '
              'at his belt'),
        weapon='bare hands, plump and open',
        attack='a light, quick open-palm slap to the right',
        special='a rolling step and an easy, enormous palm push forward'),
    'liSi': dict(
        group='villain', name='李四', book='俠客行', like='hongAn',
        look=('李四, the 罰惡使 envoy of 俠客島: middle-aged, very tall and thin, a long gloomy pale '
              'face that never smiles, a plain dark grey-blue robe, a black cap, a bronze token on a '
              'cord at his belt'),
        weapon='bare hands, long bony fingers',
        attack='a cold, long-reaching palm strike to the right',
        special='a sudden lunge and a hooking claw strike forward'),
    'islander': dict(
        group='troop', name='俠客島弟子', book='俠客行', like='xiaGuard',
        look=('a disciple of the hidden island 俠客島: a young man in a plain undyed pale robe with a '
              'dark sash, straw sandals, hair tied back, sun-browned'),
        weapon='a short straight sword',
        attack='a sword thrust to the right',
        special='a leaping sword cut forward'),
}
