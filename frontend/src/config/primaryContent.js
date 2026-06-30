/**
 * Primary Content Map (Grades 1–5)
 * Each lesson points to a static HTML file served from /primary-content/
 * Paths are relative to the public folder root.
 */

const BASE = '/primary-content';
const SB_BASE = '/primary-content/storybooks';

// ─── Helper: Math lesson (Maths grade folders have flat structure) ───────────
function mLesson(id, title, description, icon, gradeFolder, chapterFolder) {
  return {
    id, title, description, icon,
    htmlPath: `${BASE}/${gradeFolder}/${chapterFolder}/index.html`,
  };
}

// ─── Helper: English lesson (final-updated-existing-contents has nested subfolders) ──
// Real path structure: /final-updated-existing-contents/<outer>/<inner>/index.html
function eLesson(id, title, description, icon, outerFolder, innerFolder) {
  return {
    id, title, description, icon,
    htmlPath: `${BASE}/final-updated-existing-contents/${outerFolder}/${innerFolder}/index.html`,
  };
}

// ─── Helper: English lesson where index.html is at root of outer folder ──────
// Path structure: /final-updated-existing-contents/<outer>/index.html
function eFlatLesson(id, title, description, icon, outerFolder) {
  return {
    id, title, description, icon,
    htmlPath: `${BASE}/final-updated-existing-contents/${outerFolder}/index.html`,
  };
}

// ─── Helper: Storybook lesson (flat HTML files in grade folders) ──────────────
function sbLesson(id, title, description, icon, gradeFolder, fileName) {
  return {
    id, title, description, icon,
    htmlPath: `${SB_BASE}/${gradeFolder}/${fileName}`,
  };
}

// ─── GRADE 1 ──────────────────────────────────────────────────────────────────
const grade1 = {
  gradeNumber: 1,
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      description: 'Counting, comparing, and basic arithmetic!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Numbers & Counting',
          lessons: [
            mLesson('g1-m-1', 'Counting 1–5',           'Count objects up to 5',            '1️⃣', 'Maths grade1', 'chapter1counting1-5'),
            mLesson('g1-m-2', 'Counting 6–9',           'Count objects 6 to 9',             '6️⃣', 'Maths grade1', 'chapter1counting6-9'),
            mLesson('g1-m-3', 'Compare Numbers 1–10',   'Which number is bigger?',          '⚖️', 'Maths grade1', 'chapter1compare1-10'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Addition & Subtraction',
          lessons: [
            mLesson('g1-m-4', 'Addition (1–9)',          'Add numbers up to 9',              '➕', 'Maths grade1', 'chapter2addition1-9'),
            mLesson('g1-m-5', 'Addition Missing Number', 'Find the missing number',          '❓', 'Maths grade1', 'chapter2additionmissingnum'),
            mLesson('g1-m-6', 'Add Three Numbers',       'Add three numbers with sum ≤ 9',   '🔣', 'Maths grade1', 'chapter2addthreesum9'),
            mLesson('g1-m-7', 'Subtraction Missing #',   'Find the missing subtracted value','➖', 'Maths grade1', 'chapter2submissingnum'),
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      description: 'Letters, sounds, and words!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Letters & Sounds',
          lessons: [
            // inner subfolder has same name as outer folder
            eLesson('g1-e-1', 'Letter–Picture Match',  'Match letters to pictures',        '🔤', 'letterPictureMatch',   'letterPictureMatch'),
            eLesson('g1-e-2', 'Name the Picture',      'What is this picture?',            '🖼️', 'NameThePicture',        'NameThePicture'),
            eLesson('g1-e-3', 'Complete the Word',     'Fill in the missing letters',      '✍️', 'completeTheWord',       'completeTheWord'),
            eLesson('g1-e-4', 'Car Letter Sound Match','Match sounds to letters',          '🚗', 'CarLetterSoundMatching','CarLetterSoundMatching'),
            eLesson('g1-e-5', 'Jumbled Word',          'Unscramble the letters',           '🔀', 'jumbledWord',           'jumbledWord'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Words & Phrases',
          lessons: [
            eLesson('g1-e-6', 'Fridge Word Construct', 'Build words from letters',         '🧲', 'fridgeWordConstruct',  'fridgeWordConstruct'),
            eLesson('g1-e-7', 'Concat Phrases',        'Put words together',               '🔗', 'concatPhrases',        'concatPhrases'),
            eLesson('g1-e-8', 'Seven Letters in One',  'Find all 7 letters',               '7️⃣', 'sevenLettersInOne',    'Alphabets'),
          ],
        },
      ],
    },
    {
      id: 'storybooks',
      name: 'Storybooks',
      icon: '📚',
      description: 'Fun stories to read and enjoy!',
      chapters: [
        {
          id: 'ch1',
          title: 'English Stories',
          lessons: [
            sbLesson('g1-sb-1',  'A New Pet',                     'Read about getting a new pet',       '🐕', 'Grade1 English', 'A-New-Pet.html'),
            sbLesson('g1-sb-2',  'A Farmer and His Garden',       'A story about farming',              '🌻', 'Grade1 English', 'A-farmer-and-his-garden.html'),
            sbLesson('g1-sb-3',  'Farm Animal Dialogue',          'Animals talking on the farm',        '🐄', 'Grade1 English', 'Farm-Animal-Dialogue.html'),
            sbLesson('g1-sb-4',  'Like and Dislike Dialogue',     'What do you like?',                  '👍', 'Grade1 English', 'Like-and-Dislike-Dialouge.html'),
            sbLesson('g1-sb-5',  'Objects at School',             'Things we find at school',           '🏫', 'Grade1 English', 'Objects-We-Find-Out-At-School-.html'),
            sbLesson('g1-sb-6',  'The Lost Football',             'Where is the football?',             '⚽', 'Grade1 English', 'The-lost-football.html'),
            sbLesson('g1-sb-7',  'Vegetables Song',               'Sing about vegetables!',             '🥕', 'Grade1 English', 'Vegatables-Song-.html'),
            sbLesson('g1-sb-8',  'Fruits I Like',                 'My favourite fruits',                '🍎', 'Grade1 English', 'fruits-i-like.html'),
            sbLesson('g1-sb-9',  'Going to the Zoo',              'A trip to the zoo',                  '🦁', 'Grade1 English', 'going-to-zoo.html'),
            sbLesson('g1-sb-10', 'On the Farm',                   'Life on the farm',                   '🚜', 'Grade1 English', 'on-the-farm-.html'),
            sbLesson('g1-sb-11', 'Six Mangos',                    'Counting mangos!',                   '🥭', 'Grade1 English', 'six-mangos-.html'),
            sbLesson('g1-sb-12', 'The Place Where We Live',       'Our neighbourhood',                  '🏠', 'Grade1 English', 'the-place-where-we-live- (2).html'),
            sbLesson('g1-sb-13', 'What I Like',                   'Things I enjoy',                     '❤️', 'Grade1 English', 'what-i-like (1).html'),
          ],
        },
        {
          id: 'ch2',
          title: 'ትግርኛ ዛንታታት (Tigrigna Stories)',
          lessons: [
            sbLesson('g1-sb-t1',  'ሃገገ (Hagege)',                  'A story in Tigrigna',                '📖', 'ቀደማይ ክፍሊ ትግርኛ', 'Hagege.html'),
            sbLesson('g1-sb-t2',  'ድሙ ገነት (Dimu Genet)',          'Cat story',                          '🐱', 'ቀደማይ ክፍሊ ትግርኛ', 'dimu-genet (1).html'),
            sbLesson('g1-sb-t3',  'ድሙን ፅሕራን (Dimun Tsihiran)',    'Cats and cleanliness',               '🧹', 'ቀደማይ ክፍሊ ትግርኛ', 'dimun-tsihiran.html'),
            sbLesson('g1-sb-t4',  'እንደራ ክብሮም (Endera Kibrom)',    'Kibrom\'s story',                    '👦', 'ቀደማይ ክፍሊ ትግርኛ', 'endera-kibrom (1).html'),
            sbLesson('g1-sb-t5',  'ፌስታ (Festa)',                   'Festival celebration',                '🎉', 'ቀደማይ ክፍሊ ትግርኛ', 'festa.html'),
            sbLesson('g1-sb-t6',  'ካኪታ (Kakita)',                  'A children\'s tale',                 '🧸', 'ቀደማይ ክፍሊ ትግርኛ', 'kakita.html'),
            sbLesson('g1-sb-t7',  'ሌባ ከልቢ',                       'The thief dog',                      '🐕', 'ቀደማይ ክፍሊ ትግርኛ', 'ሌባ-ከልቢ.html'),
            sbLesson('g1-sb-t8',  'ሌባን ፖሊስን',                     'Thieves and police',                 '👮', 'ቀደማይ ክፍሊ ትግርኛ', 'ሌባን-ፖሊስን.html'),
            sbLesson('g1-sb-t9',  'ሚጡ',                            'A name story',                       '🌟', 'ቀደማይ ክፍሊ ትግርኛ', 'ሚጡ.html'),
            sbLesson('g1-sb-t10', 'ማማ ተሃቢና',                      'Mother Tehabina',                    '👩', 'ቀደማይ ክፍሊ ትግርኛ', 'ማማ-ተሃቢና.html'),
            sbLesson('g1-sb-t11', 'ማትለን ጎብየን',                    'Matlen and Gobyen',                  '👫', 'ቀደማይ ክፍሊ ትግርኛ', 'ማትለን-ጎብየን.html'),
            sbLesson('g1-sb-t12', 'ሰላም',                           'Peace',                              '☮️', 'ቀደማይ ክፍሊ ትግርኛ', 'ሰላም.html'),
            sbLesson('g1-sb-t13', 'ሰንካም ወጠጦ',                     'The brave monkey',                   '🐒', 'ቀደማይ ክፍሊ ትግርኛ', 'ሰንካም-ወጠጦ.html'),
            sbLesson('g1-sb-t14', 'ሽሾ',                            'A fun tale',                         '🎭', 'ቀደማይ ክፍሊ ትግርኛ', 'ሽሾ.html'),
            sbLesson('g1-sb-t15', 'ናሆምን ቁቃህን',                    'Nahom and Kukah',                    '👦', 'ቀደማይ ክፍሊ ትግርኛ', 'ናሆምን-ቁቃህን.html'),
            sbLesson('g1-sb-t16', 'ንፍአቲ ወዛም',                     'A melodious story',                  '🎵', 'ቀደማይ ክፍሊ ትግርኛ', 'ንፍአቲ-ወዛም.html'),
            sbLesson('g1-sb-t17', 'ወረስ',                           'Inheritance',                        '🏠', 'ቀደማይ ክፍሊ ትግርኛ', 'ወረስ.html'),
            sbLesson('g1-sb-t18', 'ወርቁ',                           'Gold',                               '✨', 'ቀደማይ ክፍሊ ትግርኛ', 'ወርቁ.html'),
            sbLesson('g1-sb-t19', 'ዘተ ኣናጹ',                       'The sparrow debate',                 '🐦', 'ቀደማይ ክፍሊ ትግርኛ', 'ዘተ-ኣናጹ.html'),
            sbLesson('g1-sb-t20', 'ግዱስ ነጋዳይ',                     'The honest merchant',                '🤝', 'ቀደማይ ክፍሊ ትግርኛ', 'ግዱስ-ነጋዳይ.html'),
            sbLesson('g1-sb-t21', 'ጽዩፍ ነብዩ',                      'Prophet story',                      '📜', 'ቀደማይ ክፍሊ ትግርኛ', 'ጽዩፍ-ነብዩ.html'),
          ],
        },
      ],
    },
  ],
};

// ─── GRADE 2 ──────────────────────────────────────────────────────────────────
const grade2 = {
  gradeNumber: 2,
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      description: 'Numbers up to 100, multiplication, and measurement!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Numbers & Operations',
          lessons: [
            mLesson('g2-m-1',  'Next Number',                'What comes next?',                 '▶️', 'maths grade 2', 'cahpter1nextnumber'),
            mLesson('g2-m-2',  'Previous Number',            'What comes before?',               '◀️', 'maths grade 2', 'cahpter1previousNumber'),
            mLesson('g2-m-3',  'Compare Numbers',            'Greater, less, or equal',          '⚖️', 'maths grade 2', 'chapter1compare'),
            mLesson('g2-m-4',  'Order High to Low',          'Arrange from biggest',             '🔽', 'maths grade 2', 'chapter1orderinghightolow'),
            mLesson('g2-m-5',  'Order Low to High',          'Arrange from smallest',            '🔼', 'maths grade 2', 'chapter1orderinglowtohigh'),
            mLesson('g2-m-6',  'Addition up to 20',          'Add numbers within 20',            '➕', 'maths grade 2', 'chapter1additionsumupto20'),
            mLesson('g2-m-7',  'Addition Equations',         'Solve addition equations',         '🔣', 'maths grade 2', 'chapter1additionequations'),
            mLesson('g2-m-8',  'Addition to a Line',         'Number line addition',             '📏', 'maths grade 2', 'chapter1additiontoline'),
            mLesson('g2-m-9',  'Subtraction up to 20',       'Subtract within 20',               '➖', 'maths grade 2', 'chapter1subtractionupto20'),
            mLesson('g2-m-10', 'Subtraction from Line',      'Number line subtraction',          '📐', 'maths grade 2', 'chapter1subtractionfromline'),
            mLesson('g2-m-11', 'Vertical Addition (no carry)','Column addition',                 '📊', 'maths grade 2', 'chapter1verticaladditionwoutremainder'),
            mLesson('g2-m-12', 'Vertical Addition (carry)',   'Column addition with carry',       '📈', 'maths grade 2', 'chapter1verticaladditionwithremainder'),
            mLesson('g2-m-13', 'Vertical Subtraction',       'Column subtraction',               '📉', 'maths grade 2', 'chapter1verticalsubtractionwoutremainder'),
            mLesson('g2-m-14', 'Word Problems',              'Solve story problems',             '📖', 'maths grade 2', 'chapter1scenarios'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Multiplication & Division',
          lessons: [
            mLesson('g2-m-15', 'Even & Odd Numbers',         'Learn even and odd',               '🔢', 'maths grade 2', 'chapter2evenodd'),
            mLesson('g2-m-16', 'Multiplication',             'Basic multiplication',             '✖️', 'maths grade 2', 'chapter2multiplication'),
            mLesson('g2-m-17', 'Multiply by 2 and 10',       'Times 2 and times 10',             '2️⃣', 'maths grade 2', 'chapter2multipliedby2and10'),
            mLesson('g2-m-18', 'Multiply by 0–9',            'Multiplication table',             '🗂️', 'maths grade 2', 'chapter2multiliedby0-9'),
            mLesson('g2-m-19', 'Division',                   'Share equally',                    '➗', 'maths grade 2', 'chapter2division'),
            mLesson('g2-m-20', 'Divide by 2 and 10',         'Division by 2 and 10',             '🔟', 'maths grade 2', 'chapter2dividedby2and10'),
            mLesson('g2-m-21', 'Division 1–9',               'Divide by 1 through 9',            '🔣', 'maths grade 2', 'chapter2divisionby1-9'),
            mLesson('g2-m-22', 'Story Problems',             'Multiplication word problems',     '📚', 'maths grade 2', 'chapter2stories'),
          ],
        },
        {
          id: 'ch3',
          title: 'Chapter 3 – Measurement',
          lessons: [
            mLesson('g2-m-23', 'Adding Lengths',             'Measure and add lengths',          '📏', 'maths grade 2', 'chapter3addinglength'),
            mLesson('g2-m-24', 'Adding Liquids',             'Measure and add volumes',          '💧', 'maths grade 2', 'chapter3addingliquids'),
            mLesson('g2-m-25', 'Weight Addition',            'Add weights together',             '⚖️', 'maths grade 2', 'chapter3weightaddition'),
            mLesson('g2-m-26', 'Unit Converter',             'Convert between units',            '🔄', 'maths grade 2', 'chapter3converter'),
          ],
        },
        {
          id: 'ch4',
          title: 'Chapter 4 – Fractions',
          lessons: [
            mLesson('g2-m-27', 'Fractions',                  'Half and quarter',                 '½', 'maths grade 2', 'chapter4fractions'),
            mLesson('g2-m-28', 'Fraction Painting',          'Color the fraction',               '🎨', 'maths grade 2', 'chapter4fractionpainting'),
          ],
        },
        {
          id: 'ch5',
          title: 'Chapter 5 – Place Value & Numbers to 1000',
          lessons: [
            mLesson('g2-m-29', 'Place Value',                'Hundreds, tens, ones',             '🔢', 'maths grade 2', 'chapter5placevalue'),
            mLesson('g2-m-30', 'Multiples of 100',           'Count by 100s',                    '💯', 'maths grade 2', 'chapter5multiplesof100'),
          ],
        },
        {
          id: 'ch6',
          title: 'Chapter 6 – Shapes',
          lessons: [
            mLesson('g2-m-31', 'Shapes',                     'Identify 2D shapes',               '🔷', 'maths grade 2', 'chapter6shapes'),
          ],
        },
        {
          id: 'ch7',
          title: 'Chapter 7 – Money',
          lessons: [
            mLesson('g2-m-32', 'Money',                      'Count coins and notes',            '💰', 'maths grade 2', 'chapter7money'),
            mLesson('g2-m-33', 'Money Word Problems',        'Buy and get change',               '🛒', 'maths grade 2', 'chapter7moneystories'),
          ],
        },
        {
          id: 'ch8',
          title: 'Chapter 8 – Time',
          lessons: [
            mLesson('g2-m-34', 'Clock',                      'Read the clock',                   '🕐', 'maths grade 2', 'chapter8clock'),
            mLesson('g2-m-35', 'Time Conversion',            'Hours and minutes',                '⏱️', 'maths grade 2', 'chapter8timeconversion'),
          ],
        },
        {
          id: 'ch9',
          title: 'Chapter 9 – Data',
          lessons: [
            mLesson('g2-m-36', 'Data & Graphs',              'Read simple graphs',               '📊', 'maths grade 2', 'chapter9data'),
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      description: 'Words, sentences, and reading!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Words & Matching',
          lessons: [
            eLesson('g2-e-1', 'Picture & Text Match',   'Match image to word',              '🖼️', 'ballonPictureTextMatch',  'ballonPictureTextMatch'),
            eLesson('g2-e-2', 'Sound & Picture Match',  'Match sound to image',             '🔊', 'ballonSoundPictureMatch', 'ballonSoundPictureMatch'),
            eFlatLesson('g2-e-3', 'Choose the Unique One',  'Which one is different?',         '🔍', 'chooseUniqueOne'),
            eLesson('g2-e-4', 'Fill the Letters',       'Complete the word',                '✍️', 'fillTheLetters',          'fillTheLetters'),
            eLesson('g2-e-5', 'Sort Things',            'Group by category',                '🗂️', 'sortThings',              'sortThings'),
          ],
        },
      ],
    },
    {
      id: 'storybooks',
      name: 'Storybooks',
      icon: '📚',
      description: 'Exciting stories for Grade 2 readers!',
      chapters: [
        {
          id: 'ch1',
          title: 'English Stories – Book 1',
          lessons: [
            sbLesson('g2-sb-1',  'A Day in Sintayehu\'s Life',   'A regular day for Sintayehu',       '☀️', 'Grade2 B1 English', 'A-Day-in-the-Life-of-Sintayehu.html'),
            sbLesson('g2-sb-2',  'Derartu',                       'The story of Derartu',              '🏃', 'Grade2 B1 English', 'Derartu.html'),
            sbLesson('g2-sb-3',  'Helping Our Mother',            'Helping around the house',          '🏠', 'Grade2 B1 English', 'Helping-Our-Mother.html'),
            sbLesson('g2-sb-4',  'Keti and Bontu',                'Two friends\' adventure',            '👫', 'Grade2 B1 English', 'Keti-and-Bontu.html'),
            sbLesson('g2-sb-5',  'My Family',                     'All about my family',               '👨‍👩‍👧‍👦', 'Grade2 B1 English', 'My-Family.html'),
            sbLesson('g2-sb-6',  'Our Classroom',                 'A day in the classroom',            '🏫', 'Grade2 B1 English', 'Our-Classroom.html'),
            sbLesson('g2-sb-7',  'What We Like – Part 1',         'Things we enjoy',                   '❤️', 'Grade2 B1 English', 'What-We-Like-Part-One (1).html'),
            sbLesson('g2-sb-8',  'Okelo and His Goat – Part 1',   'Okelo takes care of his goat',      '🐐', 'Grade2 B1 English', 'okelo-and-his-goat-part-1.html'),
            sbLesson('g2-sb-9',  'Okelo and His Goats – Part 2',  'The goat adventure continues',      '🐐', 'Grade2 B1 English', 'okelo-and-his-goats-part-2.html'),
            sbLesson('g2-sb-10', 'Yonas and His Animals',         'Yonas loves animals',               '🐾', 'Grade2 B1 English', 'yonas-and-his-animals.html'),
            sbLesson('g2-sb-11', 'Yoyo Like and Dislike',         'What does Yoyo like?',              '👍', 'Grade2 B1 English', 'yoyo-like-and-dislike (1).html'),
          ],
        },
        {
          id: 'ch2',
          title: 'English Stories – Book 2',
          lessons: [
            sbLesson('g2-sb-12', 'A Walk Through the Countryside', 'Exploring nature',                 '🌳', 'Grade2 B2 English', 'A-walk-through-the-country-side.html'),
            sbLesson('g2-sb-13', 'A Week in Geleta\'s Life',      'Geleta\'s weekly story',             '📅', 'Grade2 B2 English', 'A-week-in-the-life-of-geleta.html'),
            sbLesson('g2-sb-14', 'Ahmed and Jemal',               'A tale of two friends',             '🤝', 'Grade2 B2 English', 'Ahmed-and-Jemal.html'),
            sbLesson('g2-sb-15', 'Aunt Roman\'s House',            'Visiting Aunt Roman',               '🏡', 'Grade2 B2 English', 'Aunt-Romans-house.html'),
            sbLesson('g2-sb-16', 'Best Friend',                   'What makes a best friend?',         '💝', 'Grade2 B2 English', 'Best-friend.html'),
            sbLesson('g2-sb-17', 'Dureti',                        'The story of Dureti',               '🌸', 'Grade2 B2 English', 'Dureti.html'),
            sbLesson('g2-sb-18', 'Hana',                          'Meet Hana',                         '🌺', 'Grade2 B2 English', 'Hana.html'),
            sbLesson('g2-sb-19', 'How Students Go to School',     'Different ways to school',          '🚌', 'Grade2 B2 English', 'How-students-go-to-school.html'),
            sbLesson('g2-sb-20', 'Roza, Ruth and Alula',          'Three friends together',            '👧', 'Grade2 B2 English', 'Roza-Ruth-and-Alula.html'),
            sbLesson('g2-sb-21', 'Strange Animals in Ferah\'s Garden', 'Unusual garden visitors',       '🦎', 'Grade2 B2 English', 'Strange-animals-in-ferahs-garden.html'),
            sbLesson('g2-sb-22', 'The Football Game',             'An exciting match!',                '⚽', 'Grade2 B2 English', 'The-foot-ball-game.html'),
            sbLesson('g2-sb-23', 'Who is Tall?',                  'Comparing heights',                 '📏', 'Grade2 B2 English', 'Who-is-tall.html'),
            sbLesson('g2-sb-24', 'Zebudia and Humid\'s Visit',    'A visit adventure',                 '✈️', 'Grade2 B2 English', 'Zebudia-and-Humids-visit.html'),
            sbLesson('g2-sb-25', 'House Song',                    'Sing about our house!',             '🎶', 'Grade2 B2 English', 'house-song.html'),
            sbLesson('g2-sb-26', 'The Baby Bird',                 'A baby bird\'s journey',             '🐣', 'Grade2 B2 English', 'the-baby-bird.html'),
            sbLesson('g2-sb-27', 'Where is My Cat?',              'Finding a lost cat',                '🐱', 'Grade2 B2 English', 'where-is-my-cat.html'),
          ],
        },
        {
          id: 'ch3',
          title: 'ትግርኛ ዛንታታት (Tigrigna Stories)',
          lessons: [
            sbLesson('g2-sb-t1',  'እዙው በሪሁ (Ezuw Berihu)',       'A Tigrigna story',                   '📖', 'ካልአይ ክፍሊ ትግርኛ', 'ezuw-berihugeminicompressed (1).html'),
            sbLesson('g2-sb-t2',  'ሐዲጋቶ ኣብያ (Hadigato Abya)',    'A traditional tale',                 '🏠', 'ካልአይ ክፍሊ ትግርኛ', 'hadigato-abyageminicompressed (1).html'),
            sbLesson('g2-sb-t3',  'ኪዳን ለይቲ (Kidan Leyti)',       'Night story',                        '🌙', 'ካልአይ ክፍሊ ትግርኛ', 'kidan-leyti-geminicompressed (1).html'),
            sbLesson('g2-sb-t4',  'ክላለየኩም (Klaleyekum)',          'A tale of wisdom',                   '📚', 'ካልአይ ክፍሊ ትግርኛ', 'klaleyekumgeminicompressed.html'),
            sbLesson('g2-sb-t5',  'ምድላዋት ኮልዔ ኣሸንዳ',              'Ashenda celebration',                '🎊', 'ካልአይ ክፍሊ ትግርኛ', 'mdlawat-kolue-ashendageminicompressed (1).html'),
            sbLesson('g2-sb-t6',  'መረዓ (Merea)',                   'Wedding celebration',                '💒', 'ካልአይ ክፍሊ ትግርኛ', 'merea-geminicompressed (1).html'),
            sbLesson('g2-sb-t7',  'ንፋስ ክውዕ (Nfas Kewei)',        'Wind story',                         '💨', 'ካልአይ ክፍሊ ትግርኛ', 'nfas-keweigeminicompressed.html'),
            sbLesson('g2-sb-t8',  'ሲላስ ኣንድ ፓውሎስ (Silas & Pawlos)', 'Silas and Pawlos',                '👬', 'ካልአይ ክፍሊ ትግርኛ', 'silas-and-pawloscompressed.html'),
            sbLesson('g2-sb-t9',  'ጽፉፍ ምግቢ (Tsfuf Mgbi)',        'Clean food story',                   '🍲', 'ካልአይ ክፍሊ ትግርኛ', 'tsfuf-mgbigeminicompressed.html'),
            sbLesson('g2-sb-t10', 'ወራድ መረዓ (Werad Merea)',        'Wedding journey',                    '🎉', 'ካልአይ ክፍሊ ትግርኛ', 'werad-mereageminicompressed (1).html'),
            sbLesson('g2-sb-t11', 'ውሕጅ (Wuhj)',                    'A water story',                      '💧', 'ካልአይ ክፍሊ ትግርኛ', 'wuhjjjgemicompressed (1).html'),
            sbLesson('g2-sb-t12', 'ዝሃሸ ናብራ (Zhashe Nabra)',       'Way of life',                        '🌍', 'ካልአይ ክፍሊ ትግርኛ', 'zhashe-nabrageminicompressed.html'),
            sbLesson('g2-sb-t13', 'ዝነኣድ ምህዝነት (Znead Mhznet)',   'Friendship admired',                 '🤝', 'ካልአይ ክፍሊ ትግርኛ', 'znead-mhznetgeminicompressed (1).html'),
            sbLesson('g2-sb-t14', 'ስሱዕ ከልቢ (Ssue Kelbi)',         'The greedy dog',                     '🐕', 'ካልአይ ክፍሊ ትግርኛ', 'ስሱዕ-ከልቢcompressed (3).html'),
          ],
        },
      ],
    },
  ],
};

// ─── GRADE 3 ──────────────────────────────────────────────────────────────────
const grade3 = {
  gradeNumber: 3,
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      description: 'Large numbers, fractions, measurement, and geometry!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Numbers up to 10,000',
          lessons: [
            mLesson('g3-m-1', 'Numbers',               'Read and write large numbers',     '🔢', 'Maths Grade 3', 'chapter1numbers'),
            mLesson('g3-m-2', 'Place Value',           'Thousands, hundreds, tens',        '📊', 'Maths Grade 3', 'chapter1numbersplace'),
            mLesson('g3-m-3', 'Comparing Numbers',     'Greater than, less than',          '⚖️', 'Maths Grade 3', 'chapter1comparing'),
            mLesson('g3-m-4', 'Order High to Low',     'Descending order',                 '🔽', 'Maths Grade 3', 'chapter1orderinghightolow'),
            mLesson('g3-m-5', 'Order Low to High',     'Ascending order',                  '🔼', 'Maths Grade 3', 'chapter1orderinglowtohigh'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Measurement',
          lessons: [
            mLesson('g3-m-6',  'Length Units',          'cm, m, km',                        '📏', 'Maths Grade 3', 'chapter2lengthunits'),
            mLesson('g3-m-7',  'Measurement',           'Measure objects',                  '📐', 'Maths Grade 3', 'chapter2measurement'),
            mLesson('g3-m-8',  'cm to mm Conversion',  'Convert centimetres',              '🔄', 'Maths Grade 3', 'chapter2conversioncmtomm'),
            mLesson('g3-m-9',  'm to km Conversion',   'Convert metres to kilometres',     '🔄', 'Maths Grade 3', 'chapter2conversionmtokm'),
            mLesson('g3-m-10', 'Volume Conversion',     'Litres and millilitres',           '💧', 'Maths Grade 3', 'chapter2volumeconversion'),
            mLesson('g3-m-11', 'Weight Conversion',     'Kilograms and grams',              '⚖️', 'Maths Grade 3', 'chapter2weightconversion'),
          ],
        },
        {
          id: 'ch3',
          title: 'Chapter 3 – Fractions',
          lessons: [
            mLesson('g3-m-12', 'Fractions',             'Numerator and denominator',        '½',  'Maths Grade 3', 'chapter3fractions'),
            mLesson('g3-m-13', 'Half and Quarter',      'Halves and quarters',              '¼',  'Maths Grade 3', 'chapter3halfandquarter'),
            mLesson('g3-m-14', 'Numerator',             'Understand the numerator',         '🔢', 'Maths Grade 3', 'chapter3numerator'),
            mLesson('g3-m-15', 'Comparing Fractions',   'Which fraction is larger?',        '⚖️', 'Maths Grade 3', 'chapter3comparingfractions'),
          ],
        },
        {
          id: 'ch4',
          title: 'Chapter 4 – Operations',
          lessons: [
            mLesson('g3-m-16', 'Addition',              'Add large numbers',                '➕', 'Maths Grade 3', 'chapter4addition'),
            mLesson('g3-m-17', 'Subtraction',           'Subtract large numbers',           '➖', 'Maths Grade 3', 'chapter4subtructioin'),
            mLesson('g3-m-18', 'Multiplication',        'Multiply numbers',                 '✖️', 'Maths Grade 3', 'chapter4multiplication'),
            mLesson('g3-m-19', 'Division',              'Divide numbers',                   '➗', 'Maths Grade 3', 'chapter4division'),
            mLesson('g3-m-20', 'Add Multiples of 100 & 1000','Mental arithmetic',           '💯', 'Maths Grade 3', 'chapter4additionofmultiple100&1000'),
          ],
        },
        {
          id: 'ch5',
          title: 'Chapter 5 – More Division',
          lessons: [
            mLesson('g3-m-21', 'Division by 10',        'Divide by 10',                     '🔟', 'Maths Grade 3', 'chapter5divisionby10'),
            mLesson('g3-m-22', 'Division Multiples',    'Divide multiples',                 '➗', 'Maths Grade 3', 'chapter5divisionmultiplies'),
          ],
        },
        {
          id: 'ch6',
          title: 'Chapter 6 – Geometry',
          lessons: [
            mLesson('g3-m-23', 'Geometry',              'Points, lines, and shapes',        '🔷', 'Maths Grade 3', 'chapter6geometry'),
            mLesson('g3-m-24', 'Circle',                'Parts of a circle',                '⭕', 'Maths Grade 3', 'chapter6circle'),
          ],
        },
        {
          id: 'ch7',
          title: 'Chapter 7 – Money',
          lessons: [
            mLesson('g3-m-25', 'Money',                 'Ethiopian Birr',                   '💰', 'Maths Grade 3', 'chapter7money'),
          ],
        },
        {
          id: 'ch8',
          title: 'Chapter 8 – Time',
          lessons: [
            mLesson('g3-m-26', 'Time',                  'Read the clock',                   '🕐', 'Maths Grade 3', 'chapter8time'),
            mLesson('g3-m-27', 'Time Conversion',       'Convert time units',               '⏱️', 'Maths Grade 3', 'chapter8timeconversion'),
          ],
        },
        {
          id: 'ch9',
          title: 'Chapter 9 – Data',
          lessons: [
            mLesson('g3-m-28', 'Data',                  'Read tables and charts',           '📊', 'Maths Grade 3', 'chapter9data'),
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      description: 'Sentences and vocabulary!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Vocabulary',
          lessons: [
            eLesson('g3-e-1', 'Examples of Things',  'Learn categories of objects',      '📦', 'examplesOf',          'examplesOf'),
            eLesson('g3-e-2', 'Picture Name',         'Name what you see',                '🖼️', 'pictureName',         'pictureName'),
            eLesson('g3-e-3', 'Unite Letter Family',  'Group letters by family',          '👨‍👩‍👧', 'uniteLetterFamily',   'uniteLetterFamily'),
            eLesson('g3-e-4', 'Fill Between',         'Complete the sentence',            '✍️', 'fillBetween',         'fillBetween'),
          ],
        },
      ],
    },
    {
      id: 'storybooks',
      name: 'Storybooks',
      icon: '📚',
      description: 'Amazing stories for Grade 3 readers!',
      chapters: [
        {
          id: 'ch1',
          title: 'English Stories – Book 1',
          lessons: [
            sbLesson('g3-sb-1',  'A Little Child',                'A child\'s adventure',               '👶', 'Grade3 B1 English', 'a-little-child.html'),
            sbLesson('g3-sb-2',  'An Old Man',                    'Wisdom of the elderly',             '👴', 'Grade3 B1 English', 'an-old-man.html'),
            sbLesson('g3-sb-3',  'Ashango the Goalkeeper',        'The best goalkeeper',               '🥅', 'Grade3 B1 English', 'ashango-the-goalkeeper (1).html'),
            sbLesson('g3-sb-4',  'Bagzi\'s Classroom',             'School story',                      '📝', 'Grade3 B1 English', 'bagzis-classroom.html'),
            sbLesson('g3-sb-5',  'Dosa\'s Sister',                 'A sibling story',                   '👧', 'Grade3 B1 English', 'dosas-sister.html'),
            sbLesson('g3-sb-6',  'Fruits',                        'Learn about fruits',                '🍇', 'Grade3 B1 English', 'fruits.html'),
            sbLesson('g3-sb-7',  'Keeping Our House',             'Clean and tidy home',               '🧹', 'Grade3 B1 English', 'keeping-our-house.html'),
            sbLesson('g3-sb-8',  'My Family',                     'Family story',                      '👨‍👩‍👧‍👦', 'Grade3 B1 English', 'my-family.html'),
            sbLesson('g3-sb-9',  'My Weekly Duties',              'Chores and responsibilities',       '📋', 'Grade3 B1 English', 'my-weekily-duities.html'),
            sbLesson('g3-sb-10', 'Our Garden',                    'Growing a garden',                  '🌱', 'Grade3 B1 English', 'our-garden.html'),
            sbLesson('g3-sb-11', 'School Rules',                  'Rules at school',                   '📏', 'Grade3 B1 English', 'school-rules.html'),
            sbLesson('g3-sb-12', 'What Does Yohannes Like?',      'Yohannes\' favourites',              '⭐', 'Grade3 B1 English', 'what-does-yohannes-like.html'),
            sbLesson('g3-sb-13', 'Rawda and Her Father',          'Father-daughter story',             '👨‍👧', 'Grade3 B1 English', 'what-rawda-and-her-father-doing.html'),
          ],
        },
        {
          id: 'ch2',
          title: 'English Stories – Book 2',
          lessons: [
            sbLesson('g3-sb-14', 'Hiwot Keeps Her Teeth Clean',   'Dental hygiene story',              '🦷', 'Grade3 B2 English', 'Hiwot-keeps-her-teeth-clean (1).html'),
            sbLesson('g3-sb-15', 'Holidays in Fekadu\'s Area',     'Holiday fun',                       '🏖️', 'Grade3 B2 English', 'Holidays-in-Fekadus-area.html'),
            sbLesson('g3-sb-16', 'Mahlet Cares for Animals',      'Animal care story',                 '🐾', 'Grade3 B2 English', 'Mahlet-cares-for-animals.html'),
            sbLesson('g3-sb-17', 'Rahel and Zelalem Go Shopping', 'A shopping adventure',              '🛒', 'Grade3 B2 English', 'Rahel-and-Zelalem-go-shopping.html'),
            sbLesson('g3-sb-18', 'Seasons in Ethiopia',           'Learn about Ethiopian seasons',     '🌦️', 'Grade3 B2 English', 'Seasons-in-Ethiopia.html'),
            sbLesson('g3-sb-19', 'Sharp Objects',                 'Safety with sharp objects',         '⚠️', 'Grade3 B2 English', 'Sharp-objects.html'),
            sbLesson('g3-sb-20', 'Tolla\'s Family',                'Family story',                      '👨‍👩‍👧‍👦', 'Grade3 B2 English', 'Tollas-family.html'),
            sbLesson('g3-sb-21', 'Day and Night Activities',      'What people do in day and night',   '🌙', 'Grade3 B2 English', 'What-peole-do-in-the-day-and-night-time.html'),
            sbLesson('g3-sb-22', 'Zeleke\'s Animals',              'Zeleke and his animals',            '🐑', 'Grade3 B2 English', 'Zelekes-animals.html'),
            sbLesson('g3-sb-23', 'Clothes People Wear',           'Different clothes',                 '👕', 'Grade3 B2 English', 'cloths-people-wear.html'),
            sbLesson('g3-sb-24', 'Household Jobs',                'Jobs around the house',             '🧽', 'Grade3 B2 English', 'house-hold-jobs.html'),
            sbLesson('g3-sb-25', 'Types of Food Animals Eat',     'What domestic animals eat',         '🌿', 'Grade3 B2 English', 'type-of-food-domesric-animals-eat.html'),
          ],
        },
        {
          id: 'ch3',
          title: 'ትግርኛ ዛንታታት (Tigrigna Stories)',
          lessons: [
            sbLesson('g3-sb-t1',  'ለታይን ማሙሽን',                    'Letayin and Mamushn',                '👫', 'ሳልሳይ ክፍሊ ትግርኛ', 'ለታይን-ማሙሽን.html'),
            sbLesson('g3-sb-t2',  'ሓልዮት ስንዳዮ',                    'Halyot Sindayo',                     '🌾', 'ሳልሳይ ክፍሊ ትግርኛ', 'ሓልዮት-ስንዳዮ.html'),
            sbLesson('g3-sb-t3',  'መኒኦም ይዕሽዉ',                    'Meniom Yieshw',                      '👦', 'ሳልሳይ ክፍሊ ትግርኛ', 'መኒኦም-ይዕሽዉ.html'),
            sbLesson('g3-sb-t4',  'ምሌኑ',                           'Milenu',                             '✨', 'ሳልሳይ ክፍሊ ትግርኛ', 'ምሌኑ.html'),
            sbLesson('g3-sb-t5',  'ቁልዕነተይ – ካልኣይ ክፋል',           'My childhood – Part 2',              '🧒', 'ሳልሳይ ክፍሊ ትግርኛ', 'ቁልዕነተይ-ካልኣይ-ክፋል.html'),
            sbLesson('g3-sb-t6',  'ብልሓት',                          'Cleverness',                         '🧠', 'ሳልሳይ ክፍሊ ትግርኛ', 'ብልሓት.html'),
            sbLesson('g3-sb-t7',  'ተጓንፎ ዘምዘም',                    'Zemzem\'s encounter',                '🌊', 'ሳልሳይ ክፍሊ ትግርኛ', 'ተጓንፎ-ዘምዘም.html'),
            sbLesson('g3-sb-t8',  'ትራፊክ ኣብ ከተማ',                  'Traffic in the city',                '🚗', 'ሳልሳይ ክፍሊ ትግርኛ', 'ትራፊክ-ኣብ-ከተማ.html'),
            sbLesson('g3-sb-t9',  'ኑዛዜ ወላዲ',                      'Parent\'s confession',               '👨', 'ሳልሳይ ክፍሊ ትግርኛ', 'ኑዛዜ-ወላዲ.html'),
            sbLesson('g3-sb-t10', 'ኣባዲ ናበይ ከይዱ',                  'Where did Abadi go?',                '🚶', 'ሳልሳይ ክፍሊ ትግርኛ', 'ኣባዲ-ናበይ-ከይዱ.html'),
            sbLesson('g3-sb-t11', 'ኣብርሃን ተኽላይን ኣብ መቐለ',          'Abrehan & Teklay in Mekelle',        '🏙️', 'ሳልሳይ ክፍሊ ትግርኛ', 'ኣብርሃን-ተኽላይን-ኣብ-መቐለ.html'),
            sbLesson('g3-sb-t12', 'እቲ ሕንቁቕ ቆልዓ',                  'The naughty child',                  '😈', 'ሳልሳይ ክፍሊ ትግርኛ', 'እቲ-ሕንቁቕ-ቆልዓ.html'),
            sbLesson('g3-sb-t13', 'እታ ፃዕራም ለታይ',                  'The hardworking girl',               '💪', 'ሳልሳይ ክፍሊ ትግርኛ', 'እታ-ፃዕራም-ለታይ.html'),
            sbLesson('g3-sb-t14', 'እዋን ቁልዕነተይ – ራብዓይ ክፋል',      'My childhood – Part 4',              '🧒', 'ሳልሳይ ክፍሊ ትግርኛ', 'እዋን-ቁልዕነተይ-ራብዓይ-ክፋል.html'),
            sbLesson('g3-sb-t15', 'እዋን ቁልዕነተይ – ቀዳማይ ክፋል',      'My childhood – Part 1',              '👶', 'ሳልሳይ ክፍሊ ትግርኛ', 'እዋን-ቁልዕነተይ-ቀዳማይ-ክፋል.html'),
            sbLesson('g3-sb-t16', 'ኩሉዶ ድርቅና ይመስለክን',              'Is it all stubbornness?',            '🤔', 'ሳልሳይ ክፍሊ ትግርኛ', 'ኩሉዶ-ድርቅና-ይመስለክን.html'),
            sbLesson('g3-sb-t17', 'ዘምዘም ኣብ ሕክምና',                 'Zemzem at the clinic',               '🏥', 'ሳልሳይ ክፍሊ ትግርኛ', 'ዘምዘም-ኣብ-ሕክምና.html'),
            sbLesson('g3-sb-t18', 'ዝሰርሐ ይኸብር',                    'He who works is respected',          '🏆', 'ሳልሳይ ክፍሊ ትግርኛ', 'ዝሰርሐ-ይኸብር.html'),
            sbLesson('g3-sb-t19', 'ገለበዳ',                          'Gelebeda',                           '🌿', 'ሳልሳይ ክፍሊ ትግርኛ', 'ገለበዳ.html'),
            sbLesson('g3-sb-t20', 'ጉርብትና ኣንጭዋን ዒፍን',              'Neighbour of frog and bird',         '🐸', 'ሳልሳይ ክፍሊ ትግርኛ', 'ጉርብትና-ኣንጭዋን-ዒፍን.html'),
            sbLesson('g3-sb-t21', 'ጉዕዞ ናብ ከተማ',                   'Journey to the city',                '🚌', 'ሳልሳይ ክፍሊ ትግርኛ', 'ጉዕዞ-ናብ-ከተማ.html'),
            sbLesson('g3-sb-t22', 'ጎንፂ ክልተ ኣሕዋት',                 'Siblings\' argument',                '👧', 'ሳልሳይ ክፍሊ ትግርኛ', 'ጎንፂ-ክልተ-ኣሕዋት.html'),
            sbLesson('g3-sb-t23', 'ፃዕዳ ኣንጭዋ',                      'The white frog',                     '🐸', 'ሳልሳይ ክፍሊ ትግርኛ', 'ፃዕዳ-ኣንጭዋ.html'),
          ],
        },
      ],
    },
  ],
};

// ─── GRADE 4 ──────────────────────────────────────────────────────────────────
const grade4 = {
  gradeNumber: 4,
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      description: 'Up to 1 million, decimals, fractions, and geometry!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Large Numbers',
          lessons: [
            mLesson('g4-m-1', 'Numbers up to 10,000',   'Read and write large numbers',    '🔢', 'Maths Grade 4', 'chapter1revision10000'),
            mLesson('g4-m-2', 'Up to 1 Million',         'Numbers up to 1,000,000',         '💯', 'Maths Grade 4', 'chapter1uptomillion'),
            mLesson('g4-m-3', '6-Digit Place Value',     'Understand place value',          '📊', 'Maths Grade 4', 'chapter1placevalue6digit'),
            mLesson('g4-m-4', 'Multiples of 1000',       'Count by thousands',              '🔢', 'Maths Grade 4', 'chapter1multiples1000'),
            mLesson('g4-m-5', 'Rounding',                'Round to nearest 10/100',         '🎯', 'Maths Grade 4', 'chapter1rounding'),
            mLesson('g4-m-6', 'Compare & Order to 1M',  'Order large numbers',             '⚖️', 'Maths Grade 4', 'chapter1compareandorderupto1m'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Operations',
          lessons: [
            mLesson('g4-m-7',  'Addition (no carry)',     'Add without carrying',            '➕', 'Maths Grade 4', 'chapter2additionnocarry'),
            mLesson('g4-m-8',  'Addition (with carry)',   'Add with carrying',               '➕', 'Maths Grade 4', 'chapter2additionwithcarry'),
            mLesson('g4-m-9',  'Subtraction (no borrow)', 'Subtract without borrowing',     '➖', 'Maths Grade 4', 'chapter2subtractionwithoutborrow'),
            mLesson('g4-m-10', 'Subtraction (with borrow)','Subtract with borrowing',       '➖', 'Maths Grade 4', 'chapter2subtractionwithborrow'),
            mLesson('g4-m-11', 'Multiplication (no carry)','Multiply without carrying',     '✖️', 'Maths Grade 4', 'chapter2multiplicationwithoutcarry'),
            mLesson('g4-m-12', 'Multiplication (carry)',  'Multiply with carrying',          '✖️', 'Maths Grade 4', 'chapter2multiplicationwithcarry'),
            mLesson('g4-m-13', '2-Digit Multiplication', 'Multiply 2-digit numbers',        '🔣', 'Maths Grade 4', 'chapter2multiplication2digitwithcarry'),
            mLesson('g4-m-14', 'Multiplication Properties','Commutative & associative',     '📐', 'Maths Grade 4', 'chapter2multiplicationproperties'),
            mLesson('g4-m-15', 'Division',                'Divide large numbers',           '➗', 'Maths Grade 4', 'chapter2division'),
            mLesson('g4-m-16', 'Long Division',           'Step-by-step division',          '📋', 'Maths Grade 4', 'chapter2longdivision'),
          ],
        },
        {
          id: 'ch3',
          title: 'Chapter 3 – Fractions & Decimals',
          lessons: [
            mLesson('g4-m-17', 'Fractions',               'Numerator and denominator',       '½',  'Maths Grade 4', 'chapter3fractions'),
            mLesson('g4-m-18', 'Equivalent Fractions',    'Same value, different form',      '🔁', 'Maths Grade 4', 'chapter3equivalentfractions'),
            mLesson('g4-m-19', 'Compare Fractions',       'Which is bigger?',                '⚖️', 'Maths Grade 4', 'chapter3comparefractions'),
            mLesson('g4-m-20', 'Decimal Fractions',       'Tenths and hundredths',           '🔢', 'Maths Grade 4', 'chapter3decimalfractions'),
            mLesson('g4-m-21', 'Compare Decimals',        'Order decimal numbers',           '⚖️', 'Maths Grade 4', 'chapter3compareorderdecimals'),
            mLesson('g4-m-22', 'Add/Sub Decimals',        'Add and subtract decimals',       '➕', 'Maths Grade 4', 'chapter3addsubdecimals'),
            mLesson('g4-m-23', 'Add/Sub Fractions',       'Add and subtract fractions',      '➕', 'Maths Grade 4', 'chapter3addsuboffractions'),
          ],
        },
        {
          id: 'ch4',
          title: 'Chapter 4 – Measurement',
          lessons: [
            mLesson('g4-m-24', 'Units of Length',         'km, m, cm, mm',                   '📏', 'Maths Grade 4', 'chapter4unitsoflength'),
            mLesson('g4-m-25', 'Unit Conversion',         'Convert between units',            '🔄', 'Maths Grade 4', 'chapter4unitconversion'),
            mLesson('g4-m-26', 'Units of Capacity',       'Litres and millilitres',           '💧', 'Maths Grade 4', 'chapter4unitsofcapacity'),
            mLesson('g4-m-27', 'Capacity Comparison',     'Compare volumes',                  '⚖️', 'Maths Grade 4', 'chapter4capacitycompare'),
            mLesson('g4-m-28', 'Add/Sub Capacity',        'Operate on volumes',               '💧', 'Maths Grade 4', 'chapter4addsubcapacity'),
            mLesson('g4-m-29', 'Units of Weight',         'kg and g',                         '⚖️', 'Maths Grade 4', 'chapter4unitsweight'),
            mLesson('g4-m-30', 'Weight Comparison',       'Compare weights',                  '⚖️', 'Maths Grade 4', 'chapter4unitsweightcompare'),
            mLesson('g4-m-31', 'Weight Conversion',       'Convert weight units',             '🔄', 'Maths Grade 4', 'chapter4weightconversion'),
          ],
        },
        {
          id: 'ch5',
          title: 'Chapter 5 – Geometry',
          lessons: [
            mLesson('g4-m-32', 'Points and Lines',        'Basic geometry concepts',         '📐', 'Maths Grade 4', 'chapter5pointsandlines'),
            mLesson('g4-m-33', 'Right Angles',            'Identify right angles',           '📐', 'Maths Grade 4', 'chapter5rightangles'),
            mLesson('g4-m-34', 'Area',                    'Calculate area of shapes',        '🔷', 'Maths Grade 4', 'chapter5area'),
            mLesson('g4-m-35', 'Solid Figures',           '3D shapes',                       '🧊', 'Maths Grade 4', 'chapter5solidfigures'),
          ],
        },
        {
          id: 'ch6',
          title: 'Chapter 6 – Time',
          lessons: [
            mLesson('g4-m-36', 'Compare Time',            'Which is longer?',                '🕐', 'Maths Grade 4', 'chapter6timecompare'),
            mLesson('g4-m-37', 'Time Conversion',         'Hours, minutes, seconds',         '⏱️', 'Maths Grade 4', 'chapter6timeconversion'),
            mLesson('g4-m-38', 'Time Operations',         'Add and subtract time',           '⏱️', 'Maths Grade 4', 'chapter6timeops'),
          ],
        },
        {
          id: 'ch7',
          title: 'Chapter 7 – Data',
          lessons: [
            mLesson('g4-m-39', 'Bar Graph',               'Read bar graphs',                  '📊', 'Maths Grade 4', 'chapter7bargraph'),
            mLesson('g4-m-40', 'Bar Graph Questions',     'Answer questions from graphs',     '❓', 'Maths Grade 4', 'chapter7bargraphquestions'),
            mLesson('g4-m-41', 'Mean',                    'Find the average',                 '📈', 'Maths Grade 4', 'chapter7mean'),
            mLesson('g4-m-42', 'Mean Word Problems',      'Average in context',               '📚', 'Maths Grade 4', 'chapter7meanstories'),
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      description: 'Advanced reading and vocabulary!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Vocabulary & More',
          lessons: [
            eLesson('g4-e-1', 'Basketball Shot',      'Answer questions to shoot!',       '🏀', 'basketBallShot',          'basketBallShot'),
            eLesson('g4-e-2', 'Match Letter to Letter','Connect letter pairs',            '🔗', 'matchingLetterToLetter',  'matchingLetterToLetter'),
            eLesson('g4-e-3', 'Sound-Text Match',     'Match sounds to text',             '🔊', 'balloonSoundTextMatch',   'balloonSoundTextMatch'),
            eLesson('g4-e-4', 'Text-Picture Match',   'Match text to image',              '🖼️', 'balloonTextPictureMatch', 'balloonTextPictureMatch'),
          ],
        },
      ],
    },
  ],
};

// ─── GRADE 5 ──────────────────────────────────────────────────────────────────
const grade5 = {
  gradeNumber: 5,
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      description: 'Algebra, advanced fractions, geometry, and data!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Numbers & Operations',
          lessons: [
            mLesson('g5-m-1',  'Place Value',            'Understand large place values',    '📊', 'Maths Grade 5', 'chapter1placevalue'),
            mLesson('g5-m-2',  'Number Line',            'Locate numbers on a line',         '📏', 'Maths Grade 5', 'chapter1numberline'),
            mLesson('g5-m-3',  'Rounding',               'Round to nearest place',           '🎯', 'Maths Grade 5', 'chapter1rounding'),
            mLesson('g5-m-4',  'Even & Odd',             'Classify numbers',                 '🔢', 'Maths Grade 5', 'chapter1evenodd'),
            mLesson('g5-m-5',  'Predecessor & Successor','Before and after',                '◀️▶️','Maths Grade 5', 'chapter1predecessorsuccessor'),
            mLesson('g5-m-6',  'Exponents',              'Powers and bases',                 '🔣', 'Maths Grade 5', 'chapter1exponents'),
            mLesson('g5-m-7',  'Exponent Rules',         'Rules of indices',                 '📐', 'Maths Grade 5', 'chapter1exponentrules'),
            mLesson('g5-m-8',  'BODMAS',                 'Order of operations',              '🔣', 'Maths Grade 5', 'chapter1bodmas'),
            mLesson('g5-m-9',  'BODMAS Quiz',            'Test your order of operations',    '❓', 'Maths Grade 5', 'chapter1bodmasquize'),
          ],
        },
        {
          id: 'ch2',
          title: 'Chapter 2 – Algebra',
          lessons: [
            mLesson('g5-m-10', 'Algebra Introduction',   'Variables and expressions',        '🔤', 'Maths Grade 5', 'chapter2algebraintro'),
            mLesson('g5-m-11', 'Solving Equations',      'Find the value of x',              '🔍', 'Maths Grade 5', 'chapter2solvingequations'),
            mLesson('g5-m-12', 'Substitution',           'Substitute values',                '🔁', 'Maths Grade 5', 'chapter2substitution'),
          ],
        },
        {
          id: 'ch3',
          title: 'Chapter 3 – Fractions, Decimals & Percentages',
          lessons: [
            mLesson('g5-m-13', 'Fractions Intro',        'Types of fractions',               '½',  'Maths Grade 5', 'chapter3fractionsintro'),
            mLesson('g5-m-14', 'Equivalent Fractions',   'Equal fractions',                  '🔁', 'Maths Grade 5', 'chapter3equivalentfractions'),
            mLesson('g5-m-15', 'Compare Fractions',      'Order fractions',                  '⚖️', 'Maths Grade 5', 'chapter3comparingfractions'),
            mLesson('g5-m-16', 'Adding Fractions',       'Add fractions',                    '➕', 'Maths Grade 5', 'chapter3addingfractions'),
            mLesson('g5-m-17', 'Subtracting Fractions',  'Subtract fractions',               '➖', 'Maths Grade 5', 'chapter3subtractingfractions'),
            mLesson('g5-m-18', 'Multiplying Fractions',  'Multiply fractions',               '✖️', 'Maths Grade 5', 'chapter3multiplyingfractions'),
            mLesson('g5-m-19', 'Mixed Numbers',          'Multiply mixed numbers',           '🔣', 'Maths Grade 5', 'chapter3multiplyingmixednumbers'),
            mLesson('g5-m-20', 'Adding Decimals',        'Add decimal numbers',              '➕', 'Maths Grade 5', 'chapter3addingdecimals'),
            mLesson('g5-m-21', 'Subtracting Decimals',   'Subtract decimal numbers',         '➖', 'Maths Grade 5', 'chapter3subtractingdecimals'),
            mLesson('g5-m-22', 'Multiplying Decimals',   'Multiply decimal numbers',         '✖️', 'Maths Grade 5', 'chapter3multiplyingdecimals'),
            mLesson('g5-m-23', 'Fractions, %, Decimals', 'Convert between all three',        '🔄', 'Maths Grade 5', 'chapter3fractionpercentdecimal'),
            mLesson('g5-m-24', 'Conversions Quiz',       'Test your conversions',            '❓', 'Maths Grade 5', 'chapter3conversionquiz'),
            mLesson('g5-m-25', 'Unit Conversions',       'Convert measurement units',        '🔄', 'Maths Grade 5', 'chapter3conversions'),
          ],
        },
        {
          id: 'ch4',
          title: 'Chapter 4 – Data & Statistics',
          lessons: [
            mLesson('g5-m-26', 'Mean',                   'Calculate the average',            '📈', 'Maths Grade 5', 'chapter4mean'),
            mLesson('g5-m-27', 'Mean & Graph',           'Average from a graph',             '📊', 'Maths Grade 5', 'chapter4meangraph'),
            mLesson('g5-m-28', 'Bar Graphs',             'Read and draw bar graphs',         '📊', 'Maths Grade 5', 'chapter4bargraphs'),
          ],
        },
        {
          id: 'ch5',
          title: 'Chapter 5 – Geometry',
          lessons: [
            mLesson('g5-m-29', 'Geometry',               'Points, lines, planes',            '📐', 'Maths Grade 5', 'chapter5geometry'),
            mLesson('g5-m-30', 'Lines',                  'Parallel and perpendicular',       '📏', 'Maths Grade 5', 'chapter5lines'),
            mLesson('g5-m-31', 'Angle Types',            'Acute, obtuse, right',             '📐', 'Maths Grade 5', 'chapter5angletypes'),
            mLesson('g5-m-32', 'Angle Measurement',      'Use a protractor',                 '📐', 'Maths Grade 5', 'chapter5anglesmeasurement'),
            mLesson('g5-m-33', 'Missing Angles',         'Find the unknown angle',           '❓', 'Maths Grade 5', 'chapter5missingangles'),
            mLesson('g5-m-34', 'Triangles',              'Types of triangles',               '🔺', 'Maths Grade 5', 'chapter5triangles'),
            mLesson('g5-m-35', 'Symmetry',               'Lines of symmetry',                '🪞', 'Maths Grade 5', 'chapter5symmetry'),
            mLesson('g5-m-36', 'Perimeter & Area',       'Calculate perimeter and area',     '🔷', 'Maths Grade 5', 'chapter5perimeterarea'),
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      description: 'Advanced English skills!',
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1 – Vocabulary & Sentences',
          lessons: [
            eFlatLesson('g5-e-1', 'Construct Sentence',    'Build correct sentences',         '✍️', 'constructsentence'),
            // ballonNextLetter: first subfolder is "ballonNextLetter (ሀ-ሆ)"
            eLesson('g5-e-2', 'Balloon Next Letter',   'Identify next letters',            '🎈', 'ballonNextLetter',     'ballonNextLetter (ሀ-ሆ)'),
            eLesson('g5-e-3', 'Balloon Prev Letter',   'Identify previous letters',        '🎈', 'ballonPrevLetter',     'ballonPrevLetter(ሀ-ሆ)'),
            eLesson('g5-e-4', 'Balloon Between Letter','Find the letter in between',       '🎈', 'ballonBetweenLetter',  'ballonBetweenLetter'),
          ],
        },
      ],
    },
  ],
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export const primaryContentMap = {
  1: grade1,
  2: grade2,
  3: grade3,
  4: grade4,
  5: grade5,
};

/**
 * Get subjects + their chapters for a specific grade number.
 * Returns [] if no content is found for that grade.
 */
export function getSubjectsForGrade(gradeNumber) {
  return primaryContentMap[gradeNumber]?.subjects ?? [];
}
