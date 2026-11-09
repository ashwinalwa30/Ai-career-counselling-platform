/*
  translations.js — all UI strings in English (en) and Hindi (hi).
  Used by LanguageContext's t() helper. Add new keys to BOTH locales.
  Dynamic values use {placeholder} syntax, resolved by t() at call time.
*/

const translations = {

  // ── English ───────────────────────────────────────────────────────────────
  en: {

    // Landing navbar
    nav_home:        'Home',
    nav_how:         'How it works',
    nav_careers:     'Careers',
    nav_faq:         'FAQ',
    nav_login:       'Login',
    nav_get_started: 'Get Started',

    // Dashboard sidebar / nav
    side_dashboard:   'Dashboard',
    side_test:        'Aptitude Test',
    side_results:     'Results',
    side_careers:     'Career Explorer',
    side_counsellor:  'AI Counsellor',
    side_profile:     'Profile',
    side_logout:      'Logout',
    side_collapse:    'Collapse',

    // Hero section
    hero_label:       'AI-powered career counselling',
    hero_headline:    'Discover the career',
    hero_highlight:   'you were made for',
    hero_subtext:     'Take a free 15-minute AI aptitude test and get personalised career roadmaps, skill plans, and step-by-step guidance — in Hindi and English for every Class 8–12 student.',
    hero_cta_primary: 'Take the free test',
    hero_cta_outline: 'Explore careers',
    hero_chip_free:   'Free',
    hero_chip_time:   '15 min test',
    hero_chip_careers:'100+ careers',
    hero_chip_lang:   'Hindi & English',

    // Dashboard page
    dash_morning:   'Good morning',
    dash_afternoon: 'Good afternoon',
    dash_evening:   'Good evening',
    dash_sub_done:  'Your career matches are ready — explore them below.',
    dash_sub_todo:  'Take the aptitude test to unlock your personalised career matches.',
    dash_profile:   'Profile completion',
    dash_top_careers:'Top career matches',
    dash_next_steps: 'Your next steps',
    dash_done_count: '{done}/{total} done',
    dash_did_you_know:'Did you know?',
    dash_source:     'Source',

    // Test status card
    ts_not_started:  'Not started',
    ts_in_progress:  'In progress',
    ts_completed:    'Completed',
    ts_ns_heading:   'Ready to discover your strengths?',
    ts_ns_body:      '40 questions · approx. 20 minutes · instant results',
    ts_ns_btn:       'Start the aptitude test',
    ts_ip_heading:   'You are part way through',
    ts_ip_body:      '{answered} of {total} questions answered',
    ts_ip_btn:       'Resume test',
    ts_done_heading: 'Your results are ready',
    ts_done_body:    'You scored {score}% overall · See your matched careers',
    ts_done_body_ns: 'See your aptitude scores and matched career paths.',
    ts_done_btn:     'View results',

    // Career match card lock
    locked:          'Locked',
    locked_sub:      'Take the test to unlock',

    // Test instructions page
    ti_heading:      'Aptitude Test',
    ti_subheading:   'Read the instructions carefully before you begin.',
    ti_total_q:      'Total questions',
    ti_sections:     'Sections',
    ti_time_limit:   'Time limit',
    ti_results:      'Results',
    ti_instant:      'Instant',
    ti_30min:        '30 min',
    ti_section_hdr:  'Sections',
    ti_rules_hdr:    'Rules and guidelines',
    ti_questions:    'questions',
    ti_statements:   'statements',

    ti_rule_1: 'The timer counts down from 30 minutes. The test submits automatically when it reaches zero.',
    ti_rule_2: 'You can mark any question for review and return to it at any time before submitting.',
    ti_rule_3: 'Your answers save automatically — a page refresh will not lose your progress.',
    ti_rule_4: 'Once you click "Submit test", your answers cannot be changed.',
    ti_rule_5: 'Use the Previous / Next buttons or the question palette to move between questions.',
    ti_rule_6: 'The Interest Profile section has no right or wrong answers — just be honest for the most accurate career match.',

    ti_checkbox:     'I have read and understood all the instructions above.',
    ti_start_btn:    'Start test',
    ti_checkbox_hint:'Tick the checkbox above to enable the Start button.',
    ti_ip_title:     'Test in progress',
    ti_ip_desc:      'You answered {answered} of {total} questions. Pick up where you left off.',
    ti_resume_btn:   'Resume test',
    ti_done_title:   'Test completed',
    ti_done_desc:    'You have already taken this test. View your results and career matches.',
    ti_view_btn:     'View results',
  },

  // ── Hindi ─────────────────────────────────────────────────────────────────
  hi: {

    // Landing navbar
    nav_home:        'होम',
    nav_how:         'यह कैसे काम करता है',
    nav_careers:     'करियर',
    nav_faq:         'सामान्य प्रश्न',
    nav_login:       'लॉग इन',
    nav_get_started: 'शुरू करें',

    // Dashboard sidebar / nav
    side_dashboard:   'डैशबोर्ड',
    side_test:        'योग्यता परीक्षा',
    side_results:     'परिणाम',
    side_careers:     'करियर एक्सप्लोरर',
    side_counsellor:  'AI काउंसलर',
    side_profile:     'प्रोफ़ाइल',
    side_logout:      'लॉग आउट',
    side_collapse:    'छोटा करें',

    // Hero section
    hero_label:       'AI-आधारित करियर परामर्श',
    hero_headline:    'वह करियर खोजें',
    hero_highlight:   'जो आपके लिए बना है',
    hero_subtext:     '15 मिनट की मुफ़्त AI योग्यता परीक्षा दें और पाएं व्यक्तिगत करियर रोडमैप, स्किल प्लान और चरण-दर-चरण मार्गदर्शन — कक्षा 8–12 के हर छात्र के लिए हिन्दी और अंग्रेज़ी में।',
    hero_cta_primary: 'मुफ़्त परीक्षा दें',
    hero_cta_outline: 'करियर देखें',
    hero_chip_free:   'मुफ़्त',
    hero_chip_time:   '15 मिनट की परीक्षा',
    hero_chip_careers:'100+ करियर',
    hero_chip_lang:   'हिन्दी और अंग्रेज़ी',

    // Dashboard page
    dash_morning:    'शुभ प्रभात',
    dash_afternoon:  'नमस्ते',
    dash_evening:    'शुभ संध्या',
    dash_sub_done:   'आपके करियर मैच तैयार हैं — नीचे देखें।',
    dash_sub_todo:   'अपने व्यक्तिगत करियर मैच देखने के लिए योग्यता परीक्षा दें।',
    dash_profile:    'प्रोफ़ाइल पूर्णता',
    dash_top_careers:'शीर्ष करियर मैच',
    dash_next_steps: 'अगले कदम',
    dash_done_count: '{done}/{total} पूर्ण',
    dash_did_you_know:'क्या आप जानते हैं?',
    dash_source:     'स्रोत',

    // Test status card
    ts_not_started:  'शुरू नहीं',
    ts_in_progress:  'जारी है',
    ts_completed:    'पूर्ण',
    ts_ns_heading:   'अपनी ताकत जानने के लिए तैयार?',
    ts_ns_body:      '40 प्रश्न · लगभग 20 मिनट · तुरंत परिणाम',
    ts_ns_btn:       'परीक्षा शुरू करें',
    ts_ip_heading:   'आपकी परीक्षा आधी हुई है',
    ts_ip_body:      '{answered} में से {total} प्रश्न हुए',
    ts_ip_btn:       'परीक्षा जारी रखें',
    ts_done_heading: 'आपके परिणाम तैयार हैं',
    ts_done_body:    'आपने {score}% कुल स्कोर किया · मिलते-जुलते करियर देखें',
    ts_done_body_ns: 'अपने योग्यता स्कोर और करियर पथ देखें।',
    ts_done_btn:     'परिणाम देखें',

    // Career match card lock
    locked:         'लॉक है',
    locked_sub:     'अनलॉक करने के लिए परीक्षा दें',

    // Test instructions page
    ti_heading:     'योग्यता परीक्षा',
    ti_subheading:  'शुरू करने से पहले निर्देश ध्यान से पढ़ें।',
    ti_total_q:     'कुल प्रश्न',
    ti_sections:    'खंड',
    ti_time_limit:  'समय सीमा',
    ti_results:     'परिणाम',
    ti_instant:     'तुरंत',
    ti_30min:       '30 मिनट',
    ti_section_hdr: 'खंड',
    ti_rules_hdr:   'नियम और दिशानिर्देश',
    ti_questions:   'प्रश्न',
    ti_statements:  'कथन',

    ti_rule_1: 'टाइमर 30 मिनट से उल्टी गिनती करता है। समय समाप्त होने पर परीक्षा स्वतः जमा हो जाती है।',
    ti_rule_2: 'आप किसी भी प्रश्न को समीक्षा के लिए चिह्नित कर सकते हैं और जमा करने से पहले वापस जा सकते हैं।',
    ti_rule_3: 'आपके उत्तर स्वतः सहेजे जाते हैं — पृष्ठ रीफ्रेश करने पर भी प्रगति नहीं जाएगी।',
    ti_rule_4: '"परीक्षा जमा करें" पर क्लिक करने के बाद उत्तर नहीं बदले जा सकते।',
    ti_rule_5: 'प्रश्नों के बीच जाने के लिए पिछला/अगला बटन या प्रश्न पैलेट का उपयोग करें।',
    ti_rule_6: 'रुचि प्रोफ़ाइल खंड में कोई सही या गलत उत्तर नहीं है — सटीक करियर मैच के लिए ईमानदार रहें।',

    ti_checkbox:      'मैंने ऊपर दिए सभी निर्देश पढ़ और समझ लिए हैं।',
    ti_start_btn:     'परीक्षा शुरू करें',
    ti_checkbox_hint: 'प्रारंभ बटन सक्रिय करने के लिए ऊपर चेकबॉक्स पर टिक करें।',
    ti_ip_title:      'परीक्षा जारी है',
    ti_ip_desc:       'आपने {answered} में से {total} प्रश्नों के उत्तर दिए हैं। जहाँ छोड़ा था, वहाँ से जारी रखें।',
    ti_resume_btn:    'परीक्षा जारी रखें',
    ti_done_title:    'परीक्षा पूर्ण',
    ti_done_desc:     'आपने यह परीक्षा पहले ही दी है। परिणाम और करियर मैच देखें।',
    ti_view_btn:      'परिणाम देखें',
  },
}

export default translations
