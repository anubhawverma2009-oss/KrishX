/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, getDocs, getDoc, doc, writeBatch } from './firebase';
import { db } from './firebase';
import { Community, Opportunity, Post } from '../types';
import { VERIFIED_INITIAL_OPPORTUNITIES } from './opportunitiesData';

export async function seedInitialData() {
  console.log('KrishX Seeder: Checking for initial data...');
  try {
    const communitiesCol = collection(db, 'communities');
    const commSnap = await getDocs(communitiesCol);

    if (commSnap.empty) {
      console.log('Seeding initial agricultural communities...');
      const batch = writeBatch(db);

      const initialCommunities: Community[] = [
        {
          id: 'organic',
          name: 'जैविक खेती (Organic Farming)',
          description: 'प्राकृतिक खाद, गोमूत्र, और जीवामृत से टिकाऊ कृषि की विधियों और अनुभवों का आदान-प्रदान।',
          category: 'Sustainable',
          memberCount: 1420,
          coverImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
          icon: '🌱'
        },
        {
          id: 'wheat',
          name: 'गेहूं उत्पादक संघ (Wheat Farmers)',
          description: 'गेहूं की नई किस्मों, बुवाई तकनीकों, खरपतवार नियंत्रण और अधिकतम उपज पर वैज्ञानिक चर्चा।',
          category: 'Crops',
          memberCount: 2310,
          coverImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
          icon: '🌾'
        },
        {
          id: 'sugarcane',
          name: 'गन्ना क्रांति (Sugarcane Growers)',
          description: 'गन्ने की बुवाई, रोग निवारण, ड्रिप सिंचाई और चीनी मिल भुगतान प्रक्रियाओं पर केंद्रित समूह।',
          category: 'Crops',
          memberCount: 980,
          coverImage: 'https://images.unsplash.com/photo-1593113644099-5f41e12d962e?auto=format&fit=crop&q=80&w=600',
          icon: '🪵'
        },
        {
          id: 'dairy',
          name: 'श्वेत क्रांति (Dairy Farming)',
          description: 'उन्नत नस्ल के पशुपालन, दूध उत्पादन बढ़ाने, संतुलित पशु आहार और पशु स्वास्थ्य प्रबंधन गाइड।',
          category: 'Dairy',
          memberCount: 1840,
          coverImage: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600',
          icon: '🥛'
        },
        {
          id: 'vegetables',
          name: 'सब्जी उत्पादन (Vegetable Farming)',
          description: 'पॉलीहाउस खेती, संरक्षित बागवानी और टमाटर, मिर्च, आलू जैसी सब्जियों के लिए उन्नत तकनीकें।',
          category: 'Horticulture',
          memberCount: 1150,
          coverImage: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600',
          icon: '🥦'
        }
      ];

      initialCommunities.forEach((comm) => {
        const docRef = doc(db, 'communities', comm.id);
        batch.set(docRef, comm);
      });

      await batch.commit();
    }

    const oppsCol = collection(db, 'opportunities');
    const oppsSnap = await getDocs(oppsCol);

    if (oppsSnap.empty || oppsSnap.size < VERIFIED_INITIAL_OPPORTUNITIES.length) {
      console.log('Seeding and syncing verified agricultural opportunities...');
      const batch = writeBatch(db);

      VERIFIED_INITIAL_OPPORTUNITIES.forEach((opp) => {
        const docRef = doc(db, 'opportunities', opp.id);
        batch.set(docRef, opp, { merge: true });
      });

      await batch.commit();
      console.log(`Synced ${VERIFIED_INITIAL_OPPORTUNITIES.length} verified opportunities to Firestore.`);
    }

    const postsCol = collection(db, 'posts');
    const postsSnap = await getDocs(postsCol);

    if (postsSnap.empty) {
      console.log('Seeding initial agricultural knowledge posts...');
      const batch = writeBatch(db);

      const initialPosts: Post[] = [
        {
          id: 'post-1',
          authorId: 'demo-expert-1',
          authorName: 'डॉ. आरती सिंह',
          authorPhotoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
          authorKrishXId: 'KX-DL-492104',
          authorBadges: ['expert', 'helper'],
          content: 'किसान भाइयों, वर्तमान मौसम में गन्ने की फसल में "ब्लैक बग" (काले कीड़े) का प्रकोप देखा जा रहा है। इसके नियंत्रण के लिए कृपया रासायनिक कीटनाशकों के अत्यधिक छिड़काव से बचें। \n\nप्राकृतिक उपचार: प्रति एकड़ 5 लीटर मट्ठे (छाछ) में 1 किलो नीम की पत्ती और 250 ग्राम लहसुन पीसकर उबालें। छानकर 150 लीटर पानी में मिलाकर सुबह के समय छिड़काव करें। यह कीटों को भगाता है और पत्तों को मजबूती प्रदान करता है। किसी भी संदेह की स्थिति में तुरंत कमेंट करें!',
          category: 'Knowledge',
          topic: 'गन्ना क्रांति (Sugarcane Growers)',
          likes: ['demo-farmer-1', 'demo-student-1'],
          comments: [
            {
              id: 'c-1',
              authorId: 'demo-farmer-1',
              authorName: 'रमेश कुमार',
              authorPhotoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
              content: 'बहुत उपयोगी सलाह डॉक्टर साहिबा! क्या इस घोल का प्रयोग हम टमाटर की फसल पर भी कर सकते हैं?',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'post-2',
          authorId: 'demo-farmer-1',
          authorName: 'रमेश कुमार',
          authorPhotoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
          authorKrishXId: 'KX-PB-774012',
          authorBadges: ['pioneer', 'expert'],
          content: 'आज मेरे खेत में जैविक विधि से तैयार "जीवामृत" का छिड़काव किया गया। 200 लीटर पानी में 10 किलो देसी गाय का गोबर, 8 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन और 1 किलो पीपल के पेड़ के नीचे की सजीव मिट्टी को मिलाकर 4 दिन फर्मेंट किया था। \n\nफायदे: फसल का रंग गहरा हरा हो गया है और केंचुए फिर से भूमि में सक्रिय हो रहे हैं। जैविक खेती अपनाएं, भूमि का स्वास्थ्य बचाएं!',
          imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
          category: 'Experience',
          topic: 'जैविक खेती (Organic Farming)',
          likes: ['demo-expert-1'],
          comments: [],
          createdAt: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: 'post-3',
          authorId: 'demo-student-1',
          authorName: 'शुभम चौधरी',
          authorPhotoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          authorKrishXId: 'KX-MH-102938',
          authorBadges: ['pioneer', 'helper'],
          content: '🌾 सफलता की कहानी (Success Story): नासिक के प्रगतिशील युवा कृषक अमित पाटिल ने इस साल ड्रिप सिंचाई और मल्चिंग पेपर तकनीक का प्रयोग कर टमाटर की रिकार्ड पैदावार हासिल की है। \n\nपारंपरिक खेती की तुलना में पानी की खपत 40% कम हुई और टमाटरों का आकार व गुणवत्ता बाजार में नंबर-1 रही, जिससे उन्हें मंडी में ₹45 प्रति किलो का भाव मिला। तकनीक का सही प्रयोग ही कृषि को लाभ का व्यवसाय बना सकता है। युवा किसानों के लिए यह एक उत्तम मिसाल है!',
          imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600',
          category: 'Success Story',
          topic: 'सब्जी उत्पादन (Vegetable Farming)',
          likes: ['demo-farmer-1', 'demo-expert-1'],
          comments: [],
          createdAt: new Date(Date.now() - 28800000).toISOString()
        },
        {
          id: 'post-4',
          authorId: 'demo-expert-1',
          authorName: 'डॉ. आरती सिंह',
          authorPhotoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
          authorKrishXId: 'KX-DL-492104',
          authorBadges: ['expert', 'helper'],
          content: '📢 महत्वपूर्ण सरकारी योजना (Government Schemes): भारत सरकार की "पीएम-कुसुम योजना (PM-KUSUM)" के तहत सोलर वाटर पंप लगवाने के लिए ऑनलाइन आवेदन पुनः प्रारंभ हो चुके हैं। \n\nइस योजना के तहत किसानों को खेतों में सोलर पंप लगाने के लिए केंद्र व राज्य सरकार द्वारा 60% तक की सब्सिडी प्रदान की जा रही है। इससे बिजली की निर्भरता खत्म होगी और सिंचाई का खर्च शून्य हो जाएगा। आवेदन के लिए आधिकारिक वेबसाइट pmkusum.mnre.gov.in पर विजिट करें या अपने नजदीकी कृषि विभाग से संपर्क करें।',
          category: 'Knowledge',
          topic: 'जैविक खेती (Organic Farming)',
          likes: ['demo-farmer-1', 'demo-student-1'],
          comments: [],
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'post-5',
          authorId: 'demo-farmer-1',
          authorName: 'रमेश कुमार',
          authorPhotoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
          authorKrishXId: 'KX-PB-774012',
          authorBadges: ['pioneer', 'expert'],
          content: '📊 आज का मंडी भाव (Market Prices):\n\nकिसान भाइयों, आज पंजाब और हरियाणा की विभिन्न अनाज मंडियों में नई फसल के भाव इस प्रकार रहे:\n- गेहूं (उन्नत किस्म): ₹2,275 - ₹2,450 प्रति क्विंटल (मजबूत मांग)\n- सरसों (न्यूनतम 42% तेल): ₹5,400 - ₹5,850 प्रति क्विंटल\n- देसी चना: ₹6,100 - ₹6,450 प्रति क्विंटल\n\nमौसम साफ होने के कारण आवक में तेजी देखी जा रही है। मंडियों में अपनी उपज सुखाकर ही लाएं ताकि सही दाम मिल सके। आपके क्षेत्र की मंडी में आज क्या भाव रहा? नीचे कमेंट में साझा करें!',
          category: 'Experience',
          topic: 'गेहूं उत्पादक संघ (Wheat Farmers)',
          likes: ['demo-student-1', 'demo-expert-1'],
          comments: [],
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      initialPosts.forEach((post) => {
        const docRef = doc(db, 'posts', post.id);
        batch.set(docRef, post);
      });

      await batch.commit();
    }

    // Seed initial users for profile visiting
    const userDocRef_expert = doc(db, 'users', 'demo-expert-1');
    const userSnap_expert = await getDoc(userDocRef_expert);
    if (!userSnap_expert.exists()) {
      console.log('Seeding demo-expert-1 and other demo user profiles...');
      const batch = writeBatch(db);
      
      const demoUsers = [
        {
          uid: 'demo-farmer-1',
          krishXId: 'KX-PB-774012',
          name: 'रमेश कुमार',
          email: 'ramesh.farmer@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
          crops: ["गेहूं (Wheat)", "सरसों (Mustard)", "गन्ना (Sugarcane)"],
          location: "बठिंडा, पंजाब",
          experienceYears: 12,
          education: "कृषि विज्ञान केंद्र प्रशिक्षण",
          skills: ["जैविक खाद उत्पादन", "ड्रिप सिंचाई तकनीक", "फसल रोटेशन"],
          achievements: ["जिला सर्वोत्तम किसान पुरस्कार 2024", "उन्नत कृषक सम्मान"],
          summary: "मैं पिछले 12 वर्षों से पर्यावरण हितैषी प्राकृतिक खाद और आधुनिक जल-बचत तकनीकों से जैविक खेती कर रहा हूँ।",
          krishScore: 850,
          badges: ["pioneer", "expert"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'demo-expert-1',
          krishXId: 'KX-DL-492104',
          name: 'डॉ. आरती सिंह',
          email: 'dr.singh.expert@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
          crops: ["मृदा स्वास्थ्य (Soil)", "कीट नियंत्रण (Pest Control)"],
          location: "नई दिल्ली",
          experienceYears: 15,
          education: "Ph.D. कृषि विज्ञान (IARI)",
          skills: ["कीट विज्ञान विशेषज्ञता", "मृदा परीक्षण", "पौध संरक्षण तकनीक"],
          achievements: ["राष्ट्रीय कृषि वैज्ञानिक सम्मान", "15+ शोध पत्र प्रकाशित"],
          summary: "वरिष्ठ कृषि वैज्ञानिक और मृदा स्वास्थ्य विशेषज्ञ। भारतीय किसानों के आर्थिक उत्थान और फसल सुधार के लिए निरंतर समर्पित।",
          krishScore: 920,
          badges: ["expert", "helper"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'demo-student-1',
          krishXId: 'KX-MH-102938',
          name: 'शुभम चौधरी',
          email: 'shubham.student@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          crops: ["उद्यानिकी (Horticulture)", "फलों की खेती"],
          location: "नासिक, महाराष्ट्र",
          experienceYears: 2,
          education: "B.Sc. Agriculture (अंतिम वर्ष)",
          skills: ["कृषि ड्रोन तकनीक", "हाइड्रोपोनिक्स सिस्टम", "डिजिटल कृषि मार्केटिंग"],
          achievements: ["स्मार्ट इंडिया हैकाथॉन कृषि विजेता"],
          summary: "उत्साही कृषि छात्र। नए वैज्ञानिक अनुसंधान को जमीनी स्तर पर लागू करने और डिजिटल टूल्स के माध्यम से किसानों की सहायता करने में रुचि।",
          krishScore: 680,
          badges: ["pioneer", "helper"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'demo-farmer',
          krishXId: 'KX-PB-774012',
          name: 'रमेश कुमार',
          email: 'ramesh.farmer@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
          crops: ["गेहूं (Wheat)", "सरसों (Mustard)", "गन्ना (Sugarcane)"],
          location: "बठिंडा, पंजाब",
          experienceYears: 12,
          education: "कृषि विज्ञान केंद्र प्रशिक्षण",
          skills: ["जैविक खाद उत्पादन", "ड्रिप सिंचाई तकनीक", "फसल रोटेशन"],
          achievements: ["जिला सर्वोत्तम किसान पुरस्कार 2024", "उन्नत कृषक सम्मान"],
          summary: "मैं पिछले 12 वर्षों से पर्यावरण हितैषी प्राकृतिक खाद और आधुनिक जल-बचत तकनीकों से जैविक खेती कर रहा हूँ।",
          krishScore: 850,
          badges: ["pioneer", "expert"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'demo-expert',
          krishXId: 'KX-DL-492104',
          name: 'डॉ. आरती सिंह',
          email: 'dr.singh.expert@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
          crops: ["मृदा स्वास्थ्य (Soil)", "कीट नियंत्रण (Pest Control)"],
          location: "नई दिल्ली",
          experienceYears: 15,
          education: "Ph.D. कृषि विज्ञान (IARI)",
          skills: ["कीट विज्ञान विशेषज्ञता", "मृदा परीक्षण", "पौध संरक्षण तकनीक"],
          achievements: ["राष्ट्रीय कृषि वैज्ञानिक सम्मान", "15+ शोध पत्र प्रकाशित"],
          summary: "वरिष्ठ कृषि वैज्ञानिक और मृदा स्वास्थ्य विशेषज्ञ। भारतीय किसानों के आर्थिक उत्थान और फसल सुधार के लिए निरंतर समर्पित।",
          krishScore: 920,
          badges: ["expert", "helper"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'demo-student',
          krishXId: 'KX-MH-102938',
          name: 'शुभम चौधरी',
          email: 'shubham.student@krishx.org',
          photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          crops: ["उद्यानिकी (Horticulture)", "फलों की खेती"],
          location: "नासिक, महाराष्ट्र",
          experienceYears: 2,
          education: "B.Sc. Agriculture (अंतिम वर्ष)",
          skills: ["कृषि ड्रोन तकनीक", "हाइड्रोपोनिक्स सिस्टम", "डिजिटल कृषि मार्केटिंग"],
          achievements: ["स्मार्ट इंडिया हैकाथॉन कृषि विजेता"],
          summary: "उत्साही कृषि छात्र। नए वैज्ञानिक अनुसंधान को जमीनी स्तर पर लागू करने और डिजिटल टूल्स के माध्यम से किसानों की सहायता करने में रुचि।",
          krishScore: 680,
          badges: ["pioneer", "helper"],
          language: 'hi',
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        }
      ];

      demoUsers.forEach((u) => {
        const docRef = doc(db, 'users', u.uid);
        batch.set(docRef, u);
      });

      await batch.commit();
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
