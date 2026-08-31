'use strict';

// ═══════════════════════════════════════════════════════════════
    // 1. SUPABASE CONFIG — PASTE YOUR VALUES HERE
    // ═══════════════════════════════════════════════════════════════
    const SUPABASE_URL      = 'https://cqhhperiylkikocdfxnf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaGhwZXJpeWxraWtvY2RmeG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA4ODA3NSwiZXhwIjoyMDkxNjY0MDc1fQ.o8nnntorGBHzps-1yP_3rWMigPu2m2LWwsNc8PFHoOs';

    // Init Supabase client
    const { createClient } = window.supabase;
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        document.addEventListener('DOMContentLoaded', () => {
            const warn = document.createElement('div');
            warn.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;text-align:center;padding:12px 16px;z-index:9999;font-family:sans-serif;font-size:14px;font-weight:700;';
            warn.innerHTML = '⚠ SUPABASE NOT CONFIGURED — Open this file and replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual values.';
            document.body.prepend(warn);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. GLOBAL STATE
    // ═══════════════════════════════════════════════════════════════
    let G = {
        user:   null,   
        lang:   'en',
        admin:  {},     
        wizard: { step:0, total:0, qOrder:[], oOrder:{}, ans:{}, tasks:[] }
    };

    // ═══════════════════════════════════════════════════════════════
    // 3. TRANSLATIONS
    // ═══════════════════════════════════════════════════════════════
    const T = {
        en:{
            app_title:'JORC Digital Literacy LMS', app_subtitle:'Computer Basics for Beginners',
            logout:'Logout', login_title:'Student Portal',
            login_subtitle:'Enter your Student Code to begin.',
            label_name:'Full Name', label_code:'Student ID Code', btn_start:'Start Assessment',
            course_completed:'Course Completed!',
            course_completed_msg:'You have mastered all modules. View your final report.',
            view_transcript:'View Transcript', dashboard_title:'My Learning Path',
            dashboard_subtitle:'Select a module to begin your assessment.', goal:'Goal',
            part_a_title:'Knowledge Check', part_a_instr:'Select the best answer.',
            part_b_title:'Practical Execution', part_b_instr:'Perform these on your computer. Check only when done.',
            btn_submit:'Submit Assessment', btn_next:'Next Question', btn_prev:'Previous',
            select_answer_error:'Please select an answer to continue.',
            result_title:'Module Result', download_pdf:'Save Result', close:'Continue Learning',
            transcript_title:'Official Transcript',
            week_1_title:'Computer Fundamentals & OS', week_2_title:'Digital Communication & PowerPoint',
            week_3_title:'Word Processing & Spreadsheets', week_4_title:'Introduction to Artificial Intelligence',
            week_5_title:'Final Capstone Project',
            excellent:'Outstanding! Your progress has been saved to Supabase.',
            retake:'Not quite. Please review the material and try again.',
            submit_capstone:'Week 5 is the Final Capstone (50 Marks). Only proceed if instructed by your administrator.',
            start_assessment:'Begin Module', 
            completed_action: 'Completed', passed_badge: 'PASSED', failed_badge: 'FAILED',
            locked_btn:'LOCKED'
        },
        fr:{
            app_title:'JORC LMS Alphabétisation', app_subtitle:"Bases de l'informatique",
            logout:'Se déconnecter', login_title:'Portail Étudiant',
            login_subtitle:'Entrez votre code étudiant.',
            label_name:'Nom complet', label_code:'Code Étudiant', btn_start:"Commencer l'évaluation",
            course_completed:'Parcours Terminé!', course_completed_msg:'Vous avez maîtrisé tous les modules.',
            view_transcript:'Voir le Relevé', dashboard_title:'Mon Parcours',
            dashboard_subtitle:'Sélectionnez un module.', goal:'Objectif',
            part_a_title:'Vérification', part_a_instr:'Sélectionnez la meilleure réponse.',
            part_b_title:'Exécution Pratique', part_b_instr:'Cochez uniquement si terminé.',
            btn_submit:'Soumettre', btn_next:'Suivant', btn_prev:'Précédent',
            select_answer_error:'Veuillez sélectionner une réponse.',
            result_title:'Résultat', download_pdf:'Sauvegarder', close:'Continuer',
            transcript_title:'Relevé Officiel',
            week_1_title:'Bases & OS', week_2_title:'Communication & Présentation',
            week_3_title:'Word & Excel', week_4_title:"Intro à l'IA", week_5_title:'Projet Final',
            excellent:'Exceptionnel! Progrès sauvegardés.', retake:'Veuillez réessayer.',
            submit_capstone:'Projet Final (50 pts). Ne continuez que sur instruction.',
            start_assessment:'Commencer', 
            completed_action: 'Terminé', passed_badge: 'RÉUSSI', failed_badge: 'ÉCHOUÉ',
            locked_btn:'VERROUILLÉ'
        },
        yo:{
            app_title:'JORC LMS Imọ-ẹrọ Kọmputa', app_subtitle:'Awọn ipilẹ fun Awọn olubere',
            logout:'Jade', login_title:'Ẹnu-ọna Akeko', login_subtitle:'Tẹ koodu rẹ sii lati wọle.',
            label_name:'Orukọ Kikun', label_code:'Koodu Akeko', btn_start:'Bẹrẹ Igbelewọn',
            course_completed:'Ẹkọ ti pari!', course_completed_msg:'O ti ṣaṣeyọri ninu gbogbo idanwo.',
            view_transcript:'Wo Iwe Ẹri', dashboard_title:'Oju-iwe Ẹkọ',
            dashboard_subtitle:'Yan idanwo kan lati bẹrẹ.', goal:'Ero',
            part_a_title:'Idanwo', part_a_instr:'Yan idahun to tọ.',
            part_b_title:'Iṣẹ Ṣiṣe', part_b_instr:'Ṣe lori kọmputa rẹ. Fa ami ti o ba pari.',
            btn_submit:'Firanṣẹ', btn_next:'Itele', btn_prev:'Ti tẹlẹ',
            select_answer_error:'Jọwọ yan idahun kan.',
            result_title:'Abajade', download_pdf:'Gbaa PDF', close:'Tesiwaju',
            transcript_title:'Iwe-ẹri Iṣẹ',
            week_1_title:'Awọn ipilẹ Kọmputa', week_2_title:'Ayelujara & Ifihan',
            week_3_title:'Titẹ Iwe & Iṣiro', week_4_title:'Ifihan si AI', week_5_title:'Iṣẹ Aṣekan',
            excellent:'O ṣe daadaa! A ti fipamọ.', retake:'Jọwọ tun ṣe.',
            submit_capstone:'Iṣẹ Aṣekan (Ami 50). Tẹsiwaju ti olukọ ba paṣẹ.',
            start_assessment:'Bẹrẹ', 
            completed_action: 'Ti Pari', passed_badge: 'O YEGE', failed_badge: 'O KUNA',
            locked_btn:'TITI PA'
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. COURSE DATA - FULLY LOCALIZED
    // ═══════════════════════════════════════════════════════════════
    const WEEKS_DATA = {
        en: [
            { id:1, titleKey:'week_1_title',
              goal:'Understand basic hardware and mouse control.',
              scenario:'Imagine you are a shop owner. You need to prepare your digital table for work.',
              questions:[
                {q:'Which part allows you to send information INTO the computer?', opts:['Monitor','Keyboard','Speaker','Printer'], ans:1},
                {q:'Which of these is considered HARDWARE?', opts:['Microsoft Word','A Computer Mouse','A MP3 Song','A PDF Document'], ans:1},
                {q:'Which storage size holds the MOST files?', opts:['1 KB (Kilobyte)','1 GB (Gigabyte)','1 MB (Megabyte)','1 Byte'], ans:1},
                {q:'Why is it important to create Folders on the Desktop?', opts:['To calculate money','To keep files organized','To stop the computer from getting hot','To connect to the internet'], ans:1}
              ],
              tasks:['Turn on the computer monitor.','Right-Click and Refresh the Desktop.','Create a New Folder on the Desktop.',"Rename the folder to 'My Shop'.","Open the folder.",'Close the folder using the Red X.']
            },
            { id:2, titleKey:'week_2_title',
              goal:'Internet safety and basic slide presentation.',
              scenario:'You are the Youth Leader. Create a Welcome Screen for the village meeting.',
              questions:[
                {q:'Where do you type your question to find a price on the internet?', opts:['Microsoft Word','Google Search Bar','Calculator','Microsoft Excel'], ans:1},
                {q:"You receive an email: 'YOU WON ₦500,000, send PIN'. What do you do?", opts:['Send your pin','Delete it immediately','Reply to ask for more info','Forward it to a friend'], ans:1},
                {q:'If you lose your phone, what happens to photos saved on Google Drive?', opts:['They are lost forever','They are safe in the Cloud','They get deleted automatically','They move to your email'], ans:1},
                {q:'When is the best time to use PowerPoint?', opts:['To write a formal letter','To calculate a budget','To show pictures to an audience','To browse the internet'], ans:2}
              ],
              tasks:["Open Google Chrome and search for 'Nigerian Flag'.","Open PowerPoint and choose Blank Presentation.","Type Title 'Village Meeting' on the first slide.",'Add a New Slide.','Change Design/Theme to a color of your choice.','Start the Slideshow on full screen.']
            },
            { id:3, titleKey:'week_3_title',
              goal:'Typing letters and calculating numbers automatically.',
              scenario:"You are a trader. Write a price list and calculate total cost.",
              questions:[
                {q:'Which software is best for typing long letters or reports?', opts:['Microsoft Excel','Microsoft Word','PowerPoint','Google Drive'], ans:1},
                {q:'Which button makes text appear Thicker and Darker?', opts:['Bold (B)','Italic (I)','Underline (U)','Strikethrough (S)'], ans:0},
                {q:'In Excel, what is the name of the box located in Column B, Row 5?', opts:['5B','B5','Cell 2','Row B5'], ans:1},
                {q:'What is the FIRST symbol you must type for an Excel formula?', opts:['+ (Plus)','= (Equals)','? (Question Mark)','# (Hash)'], ans:1}
              ],
              tasks:["Open Word and type the Title: 'My Market List'.",'Highlight the Title, make it Bold, and Center it.','Open Microsoft Excel.',"In Cell A1 type 'Rice', and in B1 type '1000'.","In Cell A2 type 'Beans', and in B2 type '500'.",'Use a Formula or AutoSum to calculate the Total.']
            },
            { id:4, titleKey:'week_4_title',
              goal:'Understand basic Artificial Intelligence concepts.',
              scenario:'You are a Secretary. Use AI to draft a text message inviting farmers.',
              questions:[
                {q:'Does an AI like ChatGPT have a human soul or feelings?', opts:['Yes, it has a spirit','No, it is just a computer program','Yes, it is a living being','Only when connected to the internet'], ans:1},
                {q:'Which of these tasks can an AI software NOT do?', opts:['Write a professional email','Sweep the physical floor','Generate a picture from text','Translate a document'], ans:1},
                {q:'What do we call the instruction sentence you type into an AI?', opts:['A Command','A Prompt','A Secret Code','A Query Tag'], ans:1},
                {q:'If an AI writes a speech for you, what MUST you always do?', opts:['Read it and check the facts yourself','Read it blindly to the audience','Submit it without looking','Delete it after use'], ans:0}
              ],
              tasks:['Open an AI tool (ChatGPT, Gemini, or Copilot).',"Type Prompt: 'Write a 2-line text inviting farmers to a meeting on Saturday'.",'Ask the AI to make it shorter.','Highlight and Copy the text.','Paste the text into Microsoft Word.','Save the document.']
            },
            { id:5, titleKey:'week_5_title',
              goal:'Final Course Evaluation (50 Marks).',
              scenario:'Final Project Submission to Instructor.',
              questions:[],
              tasks:['Compile all saved documents.','Submit Final Project Folder to Instructor.','Present Project to Instructor for grading.']
            }
        ],
        fr: [
            { id:1, titleKey:'week_1_title',
              goal:'Comprendre le matériel de base et le contrôle de la souris.',
              scenario:'Imaginez que vous êtes un commerçant. Vous devez préparer votre table numérique pour le travail.',
              questions:[
                {q:'Quelle partie vous permet d\'envoyer des informations DANS l\'ordinateur ?', opts:['Écran','Clavier','Haut-parleur','Imprimante'], ans:1},
                {q:'Lequel de ces éléments est considéré comme du MATÉRIEL (Hardware) ?', opts:['Microsoft Word','Une souris d\'ordinateur','Une chanson MP3','Un document PDF'], ans:1},
                {q:'Quelle taille de stockage contient le PLUS de fichiers ?', opts:['1 Ko (Kilooctet)','1 Go (Gigaoctet)','1 Mo (Mégaoctet)','1 Octet'], ans:1},
                {q:'Pourquoi est-il important de créer des dossiers sur le bureau ?', opts:['Pour calculer de l\'argent','Pour garder les fichiers organisés','Pour empêcher l\'ordinateur de chauffer','Pour se connecter à Internet'], ans:1}
              ],
              tasks:['Allumez l\'écran de l\'ordinateur.','Faites un clic droit et actualisez le bureau.','Créez un nouveau dossier sur le bureau.',"Renommez le dossier en 'Ma Boutique'.","Ouvrez le dossier.",'Fermez le dossier à l\'aide de la croix rouge.']
            },
            { id:2, titleKey:'week_2_title',
              goal:'Sécurité sur Internet et présentation de base sur diapositives.',
              scenario:'Vous êtes le responsable des jeunes. Créez un écran de bienvenue pour la réunion du village.',
              questions:[
                {q:'Où tapez-vous votre question pour trouver un prix sur Internet ?', opts:['Microsoft Word','Barre de recherche Google','Calculatrice','Microsoft Excel'], ans:1},
                {q:"Vous recevez un e-mail : 'VOUS AVEZ GAGNÉ 500 000 ₦, envoyez votre code PIN'. Que faites-vous ?", opts:['Envoyer votre code PIN','Le supprimer immédiatement','Répondre pour demander plus d\'infos','Le transférer à un ami'], ans:1},
                {q:'Si vous perdez votre téléphone, qu\'advient-il des photos enregistrées sur Google Drive ?', opts:['Elles sont perdues à jamais','Elles sont en sécurité dans le Cloud','Elles sont supprimées automatiquement','Elles sont déplacées vers vos e-mails'], ans:1},
                {q:'Quel est le meilleur moment pour utiliser PowerPoint ?', opts:['Pour écrire une lettre formelle','Pour calculer un budget','Pour montrer des images à un public','Pour naviguer sur Internet'], ans:2}
              ],
              tasks:["Ouvrez Google Chrome et recherchez 'Drapeau du Nigeria'.","Ouvrez PowerPoint et choisissez Présentation vide.","Tapez le titre 'Réunion du village' sur la première diapositive.",'Ajoutez une nouvelle diapositive.','Modifiez la conception/le thème avec une couleur de votre choix.','Démarrez le diaporama en plein écran.']
            },
            { id:3, titleKey:'week_3_title',
              goal:'Taper des lettres et calculer des nombres automatiquement.',
              scenario:"Vous êtes un commerçant. Rédigez une liste de prix et calculez le coût total.",
              questions:[
                {q:'Quel logiciel est le meilleur pour taper de longues lettres ou des rapports ?', opts:['Microsoft Excel','Microsoft Word','PowerPoint','Google Drive'], ans:1},
                {q:'Quel bouton rend le texte plus épais et plus sombre ?', opts:['Gras (B)','Italique (I)','Souligné (U)','Barré (S)'], ans:0},
                {q:'Dans Excel, quel est le nom de la case située dans la colonne B, ligne 5 ?', opts:['5B','B5','Cellule 2','Ligne B5'], ans:1},
                {q:'Quel est le PREMIER symbole que vous devez taper pour une formule Excel ?', opts:['+ (Plus)','= (Égal)','? (Point d\'interrogation)','# (Dièse)'], ans:1}
              ],
              tasks:["Ouvrez Word et tapez le titre : 'Ma liste de marché'.",'Mettez le titre en surbrillance, en gras et centrez-le.','Ouvrez Microsoft Excel.',"Dans la cellule A1 tapez 'Riz', et dans B1 tapez '1000'.","Dans la cellule A2 tapez 'Haricots', et dans B2 tapez '500'.",'Utilisez une formule ou la somme automatique pour calculer le total.']
            },
            { id:4, titleKey:'week_4_title',
              goal:'Comprendre les concepts de base de l\'intelligence artificielle.',
              scenario:'Vous êtes secrétaire. Utilisez l\'IA pour rédiger un SMS invitant les agriculteurs.',
              questions:[
                {q:'Une IA comme ChatGPT a-t-elle une âme ou des sentiments humains ?', opts:['Oui, elle a un esprit','Non, ce n\'est qu\'un programme informatique','Oui, c\'est un être vivant','Uniquement lorsqu\'elle est connectée à Internet'], ans:1},
                {q:'Laquelle de ces tâches un logiciel d\'IA NE PEUT-IL PAS faire ?', opts:['Rédiger un e-mail professionnel','Balayer le sol physique','Générer une image à partir d\'un texte','Traduire un document'], ans:1},
                {q:'Comment appelle-t-on la phrase d\'instruction que vous tapez dans une IA ?', opts:['Une commande','Un Prompt','Un code secret','Une balise de requête'], ans:1},
                {q:'Si une IA écrit un discours pour vous, que DEVEZ-vous toujours faire ?', opts:['Le lire et vérifier les faits vous-même','Le lire aveuglément au public','Le soumettre sans regarder','Le supprimer après utilisation'], ans:0}
              ],
              tasks:['Ouvrez un outil d\'IA (ChatGPT, Gemini ou Copilot).',"Tapez le Prompt : 'Rédige un SMS de 2 lignes invitant les agriculteurs à une réunion samedi'.",'Demandez à l\'IA de le raccourcir.','Mettez en surbrillance et copiez le texte.','Collez le texte dans Microsoft Word.','Enregistrez le document.']
            },
            { id:5, titleKey:'week_5_title',
              goal:'Évaluation finale du cours (50 points).',
              scenario:'Soumission du projet final au formateur.',
              questions:[],
              tasks:['Compilez tous les documents enregistrés.','Soumettez le dossier du projet final au formateur.','Présentez le projet au formateur pour notation.']
            }
        ],
        yo: [
            { id:1, titleKey:'week_1_title',
              goal:'Loye ẹrọ kọmputa ipilẹ ati bi a ṣe n lo asin (mouse).',
              scenario:'Foju inu wo pe o jẹ onitaja. O nilo lati ṣeto tabili oni-nọmba rẹ fun iṣẹ.',
              questions:[
                {q:'Ewo ninu awọn wọnyi lo n jẹ ki o fi iwifun sinu kọmputa?', opts:['Atẹle (Monitor)','Bọtini-itẹwe (Keyboard)','Gbohungbohun (Speaker)','Ẹrọ-itẹwe (Printer)'], ans:1},
                {q:'Ewo ninu awọn wọnyi ni a pe ni OHUN ELO (Hardware)?', opts:['Microsoft Word','Asin Kọmputa (Mouse)','Orin MP3','Iwe PDF'], ans:1},
                {q:'Iwọn ibi ipamọ wo ni o gba awọn faili PUPỌ julọ?', opts:['1 KB (Kilobyte)','1 GB (Gigabyte)','1 MB (Megabyte)','1 Byte'], ans:1},
                {q:'Kini idi ti o fi ṣe pataki lati ṣẹda Awọn folda lori Ojú-iṣẹ (Desktop)?', opts:['Lati ṣe iṣiro owo','Lati jẹ ki awọn faili wa ni eto','Lati da kọmputa duro lati gbigbona','Lati sopọ mọ intanẹẹti'], ans:1}
              ],
              tasks:['Tan atẹle kọmputa.','Tẹ-ọtun (Right-Click) ki o si sọ Ojú-iṣẹ di tuntun.','Ṣẹda Folda Tuntun lori Ojú-iṣẹ.',"Yi orukọ folda pada si 'Ṣọọbu Mi'.","Ṣii folda naa.",'Pa folda naa nipa lilo ami X pupa.']
            },
            { id:2, titleKey:'week_2_title',
              goal:'Aabo lori intanẹẹti ati igbejade ifaworanhan ipilẹ.',
              scenario:'Iwọ ni Olori Awọn Ọdọ. Ṣẹda Iboju Kaabo fun ipade abule.',
              questions:[
                {q:'Nibo ni o ti tẹ ibeere rẹ lati wa iye owo lori intanẹẹti?', opts:['Microsoft Word','Aaye Iwadi Google','Ẹrọ iṣiro (Calculator)','Microsoft Excel'], ans:1},
                {q:"O gba imeeli kan: 'O TI JAWE OLUBORI ₦500,000, fi PIN rẹ ranṣẹ'. Kini o ṣe?", opts:['Fi pin rẹ ranṣẹ','Pa a rẹ lẹsẹkẹsẹ','Fesi lati beere fun alaye diẹ sii','Fi ranṣẹ si ọrẹ kan'], ans:1},
                {q:'Ti foonu rẹ ba sọnu, kini o ṣẹlẹ si awọn fọto ti a fipamọ sori Google Drive?', opts:['Wọn ti sọnu titi lae','Wọn wa lailewu ninu awọsanma (Cloud)','Wọn parẹ laifọwọyi','Wọn gbe lọ si imeeli rẹ'], ans:1},
                {q:'Igba wo ni o dara julọ lati lo PowerPoint?', opts:['Lati kọ lẹta iṣẹ','Lati ṣe iṣiro isuna owo','Lati ṣafihan awọn aworan si awọn eniyan','Lati lọ kiri lori intanẹẹti'], ans:2}
              ],
              tasks:["Ṣii Google Chrome ki o si wa 'Asia Naijiria (Nigerian Flag)'.","Ṣii PowerPoint ki o yan Ifihan Ofo (Blank Presentation).","Tẹ Akọle 'Ipade Abule' sori ifaworanhan akọkọ.",'Ṣafikun Ifaworanhan Tuntun (New Slide).','Yi Apẹrẹ/Akori pada si awọ ti o fẹ.','Bẹrẹ iṣafihan ifaworanhan lori iboju kikun.']
            },
            { id:3, titleKey:'week_3_title',
              goal:'Titẹ awọn lẹta ati ṣiṣiro awọn nọmba laifọwọyi.',
              scenario:"O jẹ onitaja. Kọ atokọ idiyele kan ki o si ṣe iṣiro iye owo lapapọ.",
              questions:[
                {q:'Sọfitiwia wo ni o dara julọ fun titẹ awọn lẹta gigun tabi awọn ijabọ?', opts:['Microsoft Excel','Microsoft Word','PowerPoint','Google Drive'], ans:1},
                {q:'Bọtini wo lo n sọ ki ọrọ han ni Dudu ati Nipọn?', opts:['Gras/Bold (B)','Italic (I)','Underline (U)','Strikethrough (S)'], ans:0},
                {q:'Ninu Excel, kini orukọ apoti ti o wa ni Ọwọn (Column) B, Ila (Row) 5?', opts:['5B','B5','Cell 2','Row B5'], ans:1},
                {q:'Kini aami AKỌKỌ ti o gbọdọ tẹ fun agbekalẹ Excel kan (formula)?', opts:['+ (Aropo)','= (Dọgba)','? (Ibeere)','# (Haṣi)'], ans:1}
              ],
              tasks:["Ṣii Word ki o si tẹ Akọle naa: 'Atokọ Ọja Mi'.",'Ṣe afihan Akọle naa, jẹ ki o Nipọn (Bold), ki o si gbe e si Aarin.','Ṣii Microsoft Excel.',"Ninu Cell A1 tẹ 'Iresi', ati ninu B1 tẹ '1000'.","Ninu Cell A2 tẹ 'Ẹwa', ati ninu B2 tẹ '500'.",'Lo Agbekalẹ (Formula) tabi AutoSum lati ṣe iṣiro Apapọ.']
            },
            { id:4, titleKey:'week_4_title',
              goal:'Loye awọn imọran ipilẹ ti Imọ-ẹrọ Ọgbọn atọwọda (AI).',
              scenario:'O jẹ Akọwe. Lo AI lati kọ ifiranṣẹ ranṣẹ lati pe awọn agbe.',
              questions:[
                {q:'Ṣe AI bii ChatGPT ni ẹmi tabi rilara eniyan?', opts:['Bẹẹni, o ni ẹmi','Rara, eto kọmputa lasan ni','Bẹẹni, o jẹ ẹda alãye','Nikan nigbati o ba sopọ mọ intanẹẹti'], ans:1},
                {q:'Ewo ninu awọn iṣẹ wọnyi ni sọfitiwia AI KO LE ṣe?', opts:['Kọ imeeli iṣẹ','Gba ilẹ ti ara (sweep the floor)','Ṣẹda aworan lati inu ọrọ','Tumọ iwe aṣẹ'], ans:1},
                {q:'Kini a n pe ni gbolohun itọnisọna ti o tẹ sinu AI?', opts:['Aṣẹ kan (Command)','Aṣẹ Itọnisọna (Prompt)','Koodu Aṣiri','Aami Ibeere'], ans:1},
                {q:'Ti AI ba kọ ọrọ iyanju (speech) fun ọ, kini o GBỌDỌ ṣe nigbagbogbo?', opts:['Ka a ki o si ṣayẹwo awọn otitọ funrararẹ','Ka a ni afọju fun awọn eniyan','Fi silẹ laisi wiwo rẹ','Pa a rẹ lẹhin lilo'], ans:0}
              ],
              tasks:['Ṣii ohun elo AI kan (ChatGPT, Gemini, tabi Copilot).',"Tẹ Itọnisọna (Prompt): 'Kọ ifiranṣẹ ẹlẹsẹ meji lati pe awọn agbe si ipade ni Ọjọ Abamẹta'.",'Beere lọwọ AI lati jẹ ki o kuru.','Ṣe afihan (Highlight) ki o si Daakọ (Copy) ọrọ naa.','Lẹ (Paste) ọrọ naa sinu Microsoft Word.','Fipamọ iwe aṣẹ naa.']
            },
            { id:5, titleKey:'week_5_title',
              goal:'Igbelewọn Ipari Ẹkọ (Ami 50).',
              scenario:'Ifisilẹ Iṣẹ Akanṣe Ipari si Olukọni.',
              questions:[],
              tasks:['Ṣajọ gbogbo awọn iwe aṣẹ ti a fipamọ.','Fi Folda Iṣẹ Akanṣe Ipari silẹ fun Olukọni.','Ṣe afihan Iṣẹ Akanṣe si Olukọni fun igbelewọn.']
            }
        ]
    };

    function getWeeks() {
        return WEEKS_DATA[G.lang] || WEEKS_DATA.en;
    }
