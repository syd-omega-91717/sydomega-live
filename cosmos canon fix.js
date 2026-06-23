// ============================================================
// SYD OMEGA 91717 - cosmos.html CANON FIX
// Replace the existing  const SIGNS=[...]  block with SIGNS below,
// and the existing  const PANTHEONS=[...]  block with PANTHEONS below.
// Nothing else in cosmos.html changes.
// Result: Virgo -> Athena (locked), no duplicate gods, full wheel coherent.
// ============================================================

const SIGNS=[
  {n:'ARIES',g:'\u2648',dates:'MAR 21-APR 19',el:'FIRE',col:'#E86A3A',deity:'ARES',desc:'The sovereign initiator. First fire in the matrix.'},
  {n:'TAURUS',g:'\u2649',dates:'APR 20-MAY 20',el:'METAL',col:'#C7CDD6',deity:'APHRODITE',desc:'The sovereign builder. Metal endurance shapes empires.'},
  {n:'GEMINI',g:'\u264A',dates:'MAY 21-JUN 20',el:'WIND',col:'#A9C2D8',deity:'HERMES',desc:'The sovereign messenger. Wind carries knowledge.'},
  {n:'CANCER',g:'\u264B',dates:'JUN 21-JUL 22',el:'WATER',col:'#34C6E6',deity:'ARTEMIS',desc:'The sovereign keeper. Water flows where others cannot.'},
  {n:'LEO',g:'\u264C',dates:'JUL 23-AUG 22',el:'FIRE',col:'#E86A3A',deity:'APOLLO',desc:'The sovereign commander. Fire at its apex.'},
  {n:'VIRGO',g:'\u264D',dates:'AUG 23-SEP 22',el:'SAND',col:'#D9B86A',deity:'ATHENA',desc:'The sovereign architect. Sand is the universal amplifier.'},
  {n:'LIBRA',g:'\u264E',dates:'SEP 23-OCT 22',el:'WIND',col:'#A9C2D8',deity:'HERA',desc:'The sovereign diplomat. Wind as justice and balance.'},
  {n:'SCORPIO',g:'\u264F',dates:'OCT 23-NOV 21',el:'WATER',col:'#8B0000',deity:'DEMETER',desc:'The sovereign executor. Water in its most powerful form.'},
  {n:'SAGITTARIUS',g:'\u2650',dates:'NOV 22-DEC 21',el:'FIRE',col:'#C9A84C',deity:'ZEUS',desc:'The sovereign explorer. Fire that expands beyond borders.'},
  {n:'CAPRICORN',g:'\u2651',dates:'DEC 22-JAN 19',el:'METAL',col:'#E2C86D',deity:'HESTIA',desc:'The sovereign master. Metal discipline across time.'},
  {n:'AQUARIUS',g:'\u2652',dates:'JAN 20-FEB 18',el:'WIND',col:'#9B6BF0',deity:'HEPHAESTUS',desc:'The sovereign visionary. Wind as civilizational revolution.'},
  {n:'PISCES',g:'\u2653',dates:'FEB 19-MAR 20',el:'WATER',col:'#3fb27f',deity:'POSEIDON',desc:'The sovereign mystic. Water as transcendence.'},
];

const PANTHEONS=[
  {name:'ARES',sign:'Aries',col:'#E86A3A',domain:'War, Courage, Intensity',desc:'Ares transforms through intensity. His charge: destroy what blocks the matrix and rebuild it stronger.'},
  {name:'APHRODITE',sign:'Taurus',col:'#C7CDD6',domain:'Beauty, Value, Abundance',desc:'Aphrodite governs the economy of value. Her charge: accumulate, beautify, and build permanent worth.'},
  {name:'HERMES',sign:'Gemini',col:'#A9C2D8',domain:'Messages, Mind, Travel',desc:'Hermes carries sacred messages across all boundaries. His charge: master communication and carry the code forward.'},
  {name:'ARTEMIS',sign:'Cancer',col:'#34C6E6',domain:'Moon, Protection, Instinct',desc:'Artemis guards the moonlit path. Her charge: protect what is sacred and trust the instinct others ignore.'},
  {name:'APOLLO',sign:'Leo',col:'#E86A3A',domain:'Sun, Knowledge, Radiance',desc:'Apollo illuminates all knowledge simultaneously. His charge: light up the darkness and lead from the centre.'},
  {name:'ATHENA',sign:'Virgo',col:'#D9B86A',domain:'Wisdom, Strategy, Craft',desc:'Athena is the divine intellect, the Architect of the Order. Her charge: think before acting, then act decisively. Strategy is the supreme weapon.'},
  {name:'HERA',sign:'Libra',col:'#A9C2D8',domain:'Union, Balance, Sovereignty',desc:'Hera rules union and balance. Her charge: weigh every side, and forge partnerships strong enough to hold an empire together.'},
  {name:'DEMETER',sign:'Scorpio',col:'#8B0000',domain:'Cycle, Rebirth, Depth',desc:'Demeter rules the descent and the return. Her charge: pass through every ending, and rise from loss stronger than before.'},
  {name:'ZEUS',sign:'Sagittarius',col:'#C9A84C',domain:'Authority, Expansion, Justice',desc:'Zeus commands from the apex. His charge: lead through sovereign authority, not force, and expand beyond every border. The crown is earned.'},
  {name:'HESTIA',sign:'Capricorn',col:'#E2C86D',domain:'Hearth, Legacy, Time',desc:'Hestia keeps the eternal flame. Her charge: build legacy across decades through patient, consistent discipline.'},
  {name:'HEPHAESTUS',sign:'Aquarius',col:'#9B6BF0',domain:'Invention, Craft, Revolution',desc:'Hephaestus forges the future from contradictions. His charge: invent the systems no one else dares, and build them both beautiful and just.'},
  {name:'POSEIDON',sign:'Pisces',col:'#3fb27f',domain:'Deep Waters, Mystic, Transcendence',desc:'Poseidon rules the deep unconscious. His charge: access the dimensions no other sign can map.'},
];
