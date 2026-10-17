export const juniorMissions = [
  {title:'Meet our Sun',say:'Our Sun is a star. It gives Earth light and warmth.',task:'What is our Sun?',choices:['A star','A planet'],answer:0,success:'You found our star! Its light helps plants grow.',hint:'A star makes its own light. Look at the glowing Sun.'},
  {title:'Build a baby star',say:'Stars can begin in clouds of gas. Gravity pulls gas together.',task:'Drag each cloud into the circle, or tap it.',success:'The gas has gathered! A young star can begin here.',hint:'Find the three cloud buttons. Tap each one once.'},
  {title:'Find the energy centre',say:'The Sun has a very hot centre called the core. Tiny bits join there and release energy.',task:'Where does the Sun make its energy?',choices:['Deep inside its core','On Earth'],answer:0,success:'Yes! Energy begins deep inside the Sun.',hint:'The core is the hot centre. That is where tiny bits join.'},
  {title:'Tell a star’s story',say:'A star changes over a very long time. This story shows a star like our Sun.',task:'Put the story cards in the glowing spaces. What comes first?',success:'You told the whole story! The small leftover core is called a white dwarf.',hint:'Begin with a gas cloud. Then comes a shining star, a giant, and a white dwarf.'}
];
export const juniorHindi = [
  {title:'हमारे सूरज से मिलो',say:'हमारा सूरज एक तारा है। इससे धरती को रोशनी और गर्मी मिलती है।',task:'हमारा सूरज क्या है?',choices:['एक तारा','एक ग्रह'],success:'तुमने हमारा तारा खोज लिया! इसकी रोशनी से पौधे बढ़ते हैं।',hint:'तारा अपनी रोशनी बनाता है। चमकते सूरज को देखो।'},
  {title:'एक नन्हा तारा बनाओ',say:'तारे गैस के बादलों में बन सकते हैं। Gravity गैस को पास खींचती है।',task:'हर बादल को गोले में लाओ, या उस पर टैप करो।',success:'गैस इकट्ठी हो गई! यहाँ एक नया तारा बन सकता है।',hint:'तीन बादलों के बटन खोजो। हर एक पर एक बार टैप करो।'},
  {title:'ऊर्जा का केंद्र खोजो',say:'सूरज का केंद्र बहुत गर्म है। इसे core कहते हैं। यहाँ छोटे कण मिलते हैं और ऊर्जा निकलती है।',task:'सूरज अपनी ऊर्जा कहाँ बनाता है?',choices:['अपने core के अंदर','धरती पर'],success:'हाँ! ऊर्जा सूरज के अंदर बनती है।',hint:'Core सूरज का गर्म केंद्र है। छोटे कण यहाँ मिलते हैं।'},
  {title:'तारे की कहानी बताओ',say:'बहुत लंबे समय में तारा बदलता है। यह हमारे सूरज जैसे तारे की कहानी है।',task:'कहानी के कार्ड चमकती जगहों में रखो। पहले क्या आता है?',success:'तुमने पूरी कहानी बता दी! छोटे बचे केंद्र को white dwarf कहते हैं।',hint:'पहले गैस का बादल, फिर चमकता तारा, फिर विशाल तारा, और फिर white dwarf।'}
];
export const storyCards=[{key:'star',icon:'☀',en:'Shining star',hi:'चमकता तारा',progress:.4},{key:'dwarf',icon:'◉',en:'Small leftover core',hi:'छोटा बचा केंद्र',progress:1},{key:'cloud',icon:'☁',en:'Gas cloud',hi:'गैस का बादल',progress:0},{key:'giant',icon:'✹',en:'Giant star',hi:'विशाल तारा',progress:.6}];
export const storyOrder=['cloud','star','giant','dwarf'];
export function restoredJuniorProgress(value) {
  const completed=Array.isArray(value)?[...new Set(value.filter(n=>Number.isInteger(n)&&n>=0&&n<4))]:[];
  return {completed, next:[0,1,2,3].find(n=>!completed.includes(n))??0};
}
