/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, getDocs, getDoc, doc, writeBatch } from './firebase';
import { db } from './firebase';
import { Community, Opportunity, Post } from '../types';

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

    if (oppsSnap.empty) {
      console.log('Seeding initial agricultural opportunities...');
      const batch = writeBatch(db);

      const initialOpps: Opportunity[] = [
        {
          id: 'pm-kusum',
          title: 'पीएम-कुसुम योजना (PM-KUSUM Scheme)',
          organization: 'नवीन और नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार',
          type: 'Scheme',
          description: 'खेतों में सौर जल पंप स्थापित करने के लिए किसानों को 60% तक की भारी सब्सिडी। बंजर भूमि पर सौर संयंत्र लगाने के अवसर।',
          eligibility: 'सभी किसान, सहकारी समितियां, और एफपीओ जिनके पास कृषि योग्य या बंजर भूमि हो।',
          benefits: 'सिंचाई लागत 90% तक कम होगी। अतिरिक्त सौर बिजली को ग्रिड में बेचकर सालाना आय बढ़ाने का मौका।',
          link: 'https://pmkusum.mnre.gov.in',
          createdAt: new Date().toISOString(),
          highlightColor: 'bg-krishx-earth-50 text-krishx-dark-700 border-krishx-earth-300'
        },
        {
          id: 'drone-training',
          title: 'कृषि ड्रोन संचालन प्रशिक्षण (Agricultural Drone Training)',
          organization: 'राष्ट्रीय कृषि विस्तार एवं प्रबंधन संस्थान (MANAGE)',
          type: 'Training',
          description: 'खेतों में उर्वरक और कीटनाशकों के स्मार्ट छिड़काव के लिए 10 दिवसीय प्रमाणित ड्रोन उड़ाने का प्रशिक्षण कार्यक्रम।',
          eligibility: 'कृषि छात्र, स्नातक या 10वीं पास प्रगतिशील युवा किसान (आयु 18-35 वर्ष)।',
          benefits: 'प्रशिक्षण के बाद सरकारी मान्यता प्राप्त पायलट लाइसेंस। ड्रोन स्टार्टअप शुरू करने के लिए कम ब्याज दर पर ऋण सुविधा।',
          link: 'https://www.manage.gov.in',
          createdAt: new Date().toISOString(),
          highlightColor: 'bg-teal-50 text-teal-800 border-teal-200'
        },
        {
          id: 'organic-grant',
          title: 'परंपरागत कृषि विकास योजना ग्रांट (PKVY Grant)',
          organization: 'कृषि एवं किसान कल्याण मंत्रालय',
          type: 'Grant',
          description: 'जैविक खेती को बढ़ावा देने के लिए क्लस्टर निर्माण हेतु वित्तीय सहायता। 3 वर्षों के लिए प्रति हेक्टेयर ₹50,000 की राशि।',
          eligibility: 'न्यूनतम 20 एकड़ क्षेत्र के साथ कम से कम 50 किसानों का सक्रिय क्लस्टर या FPO।',
          benefits: 'जैविक खाद, बीज उत्पादन, मूल्य संवर्धन, ब्रांडिंग और पैकिंग के लिए सीधे बैंक खाते में सहायता राशि।',
          link: 'https://dshd.dac.gov.in',
          createdAt: new Date().toISOString(),
          highlightColor: 'bg-amber-50 text-amber-800 border-amber-200'
        },
        {
          id: 'agri-startup-fellowship',
          title: 'कृषि-उद्यमिता फेलोशिप प्रोग्राम (Agri-Startup Fellowship)',
          organization: 'कृषि अनुसंधान परिषद (ICAR) - पूसा कृषि',
          type: 'Startup',
          description: 'कृषि क्षेत्र में नए तकनीकी नवाचारों, स्मार्ट सेंसर, आईओटी या एआई आधारित समाधानों को स्टार्टअप में बदलने के लिए मेंटरशिप और सीड फंडिंग।',
          eligibility: 'कृषि स्नातक छात्र, रिसर्चर्स, और इनोवेटर्स जिनके पास व्यावहारिक वर्किंग प्रोटोटाइप हो।',
          benefits: '₹5 लाख से ₹25 लाख तक की वित्तीय सहायता (सीड ग्रांट)। आईसीआर के वैज्ञानिकों से डायरेक्ट लैब सपोर्ट।',
          link: 'https://pusakrishi.icar.gov.in',
          createdAt: new Date().toISOString(),
          highlightColor: 'bg-blue-50 text-blue-800 border-blue-200'
        },
        {
          id: 'msc-scholarship',
          title: 'राष्ट्रीय कृषि छात्रवृत्ति (National Agri Scholarship)',
          organization: 'भारतीय कृषि अनुसंधान परिषद (ICAR)',
          type: 'Scholarship',
          description: 'कृषि विश्वविद्यालयों में उच्च शिक्षा (M.Sc / Ph.D Agriculture) के लिए मेधावी छात्रों को मासिक वित्तीय छात्रवृत्ति सहायता।',
          eligibility: 'मान्यता प्राप्त कृषि विश्वविद्यालय से उत्कृष्ट अंकों के साथ स्नातक छात्र।',
          benefits: '₹12,000 प्रति माह फेलोशिप के साथ शैक्षणिक व्यय के लिए आकस्मिक निधि सहायता।',
          link: 'https://icar.org.in',
          createdAt: new Date().toISOString(),
          highlightColor: 'bg-violet-50 text-violet-800 border-violet-200'
        }
      ];

      initialOpps.forEach((opp) => {
        const docRef = doc(db, 'opportunities', opp.id);
        batch.set(docRef, opp);
      });

      await batch.commit();
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
