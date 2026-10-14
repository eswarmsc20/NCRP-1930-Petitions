import csv
import json
import io
import os
import re

raw_input = """S No,Circle,POLICE STATION,FIR NO,Year,Sub-Category,Lost,Lien,Memo Filed Yes or No?,Memo Filed Amount,Memo Filed date / If Not Filed Reason for not filiing,Court order Recieved Yes or No?,Amount Refunded Yes or No or Partial ?,Amount for Which Court Order Was Issued,Refund From bank,Funds not availble in banks,To be refunded from Bank,COURT ORDER RECEIVED DATE,Reasons for not Receving Court orders,Technical asst,Court name,Judge Name,Stage of the case
1,Tekkali Rural Circle,Naupada,54/2021,2021,Fake Customer Care,485833,24000,Yes,24000,2026-02-27,No,No,,,,0,,Pending at court,Sudheer,"JMFC, Kotabommali",S.Vani,
2,J.R.Puram Circle,Etcherla,238/2021,2021,Job,173000,173000,Yes,173000,,Yes,Yes,173000,173000,,0,31.10.2025,,Sarat,"JMFC, Srikakulam",KM Jamruth Begum,
3,J.R.Puram Circle,Etcherla,242/2021,2021,Job,92000,61582,Yes,61582,2025-05-16,No,No,,,,0,,Pending at court,Sarat,"JMFC, Srikakulam",KM Jamruth Begum,
4,J.R.Puram Circle,Etcherla,257/2021,2021,Job,25600,25000,No,,Complainant Unwilling,No,No,,,,0,,,Sarat,,,
5,Srikakulam II Town,Srikakulam II Town,15/2022,2022,Job,467302,450000,Yes,450000,2024-12-07,No,No,,,,0,,"Returned with certain remarks, To be submitted again",,AJMFC Srikakulam,KM Jamruth Begum,PT
6,Tekkali Rural Circle,Kotabommali,21/2022,2022,Loan,25868,21600,No,,,No,No,,,,0,,,Sudheer,,,
7,J.R.Puram Circle,Etcherla,178/2022,2022,Fake Website,142000,107000,Yes,107000,2025-05-16,No,No,,,,0,,Pending at court,Sarat,"JMFC, Srikakulam",KM Jamruth Begum,
8,Kasibugga Rural Circle,Mandasa,130/2022,2022,Fake customer care/Fake website,105531,34132,Yes,34132,,Yes,Yes,34132,34132,,0,29.11.2024,,,"JMFC, Sompeta",Sri.K.Srinivasarao,UI
9,Srikakulam II Town,Srikakulam II Town,135/2022,2022,Fake Customer Care,119800,32286,Yes,32286,2026-02-19,Yes,No,32286,,,32286,,,Sudheer,AJMFC Srikakulam,KM Jamruth Begum,
10,Amadalavalasa Circle,Sarubujjili,160/2022,2022,Job,82000,82000,No,,Memo prepared but Complainant is not available,No,No,,,,0,,,,,,
11,Itchapuram Circle,Itchapuram Town,120/2022,2022,Job,96500,24028,Yes,24028,,Yes,No,24028,,24028,0,16.12.2024,,Aravind,"JMFC, Itchapuram",Sri.T.Paresh Kumar,PT
12,J.R.Puram Circle,Laveru,160/2022,2022,Job,455689,123170,No,,Complainant Unwilling,No,No,,,,0,,,Sarat,,,
13,Itchapuram Circle,Itchapuram Town,102/2022,2022,Matrimonial,2283800,461854,Yes,461854,,Yes,Yes,461854,461854,,0,29.10.2024,,,"JMFC, Itchapuram",Sri.T.Paresh Kumar,PT
14,Amadalavalasa Circle,Amadalavalasa,2/2023,2023,Job,1330500,143615,No,,Complainant is out of state,No,No,,,,0,,,,,,
15,Narasannapeta Circle,Polaki,10/2023,2023,Fake Website,24995,24995,Yes,24995,,Yes,Yes,24995,24995,,0,25-03-2025,,Sudheer,"JMFC, Narasannapeta",S.Vani,
16,Amadalavalasa Circle,Burja,16/2023,2023,Job,225000,105000,yes,"2,25,000",2026-02-16,No,No,,,,0,,,,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,Charge Sheet field
17,Amadalavalasa Circle,Amadalavalasa,136/2023,2023,Job,731154,79972,Yes,79972,2025-01-05,Yes,Yes,79972,79972,,0,04.04.2025,,,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,Suspect verification pending
18,Narasannapeta Circle,Narasannapeta,130/2023,2023,Fake Website,212400,146300,Yes,146300,,Yes,Partial,146300,59100,66732,20468,17.03.2025,,,"JMFC, Narasannapeta",S.Vani,
19,Kasibugga Rural Circle,Mandasa,141/2023,2023,Fake Website,426889,11236,Yes,11236,,Yes,Yes,11236,11236,,0,04.12.2025,,,"JMFC, Sompeta",Sri.K.Srinivasarao,UI
20,Amadalavalasa Circle,Amadalavalasa,217/2023,2023,Job,163313,50000,Yes,50000,2025-01-24,Yes,No,50000,,50000,0,04.04.2025,,Sudheer,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,Suspect verification pending
21,Narasannapeta Circle,Polaki,116/2023,2023,Job,274500,91362,Yes,91362,,Yes,Partial,91362,11362,80000,0,21-04-2025,,,"JMFC, Narasannapeta",S.Vani,
22,Amadalavalasa Circle,Amadalavalasa,328/2023,2023,Job,2359584,500000,Yes,500000,2025-01-20,Yes,Partial,500000,200000,300000,0,04.04.2025,,Sudheer,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
23,Amadalavalasa Circle,Amadalavalasa,338/2023,2023,Job,887000,50000,Yes,50000,2025-01-20,Yes,No,50000,,50000,0,11.04.2025,,Sarat,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
24,Kasibugga,Kasibugga,467/2023,2023,Job,474960,155726,Yes,155726,,Yes,Yes,155726,155726,,0,11.03.2025,,,"Junior first class majestrate court, Palasa",Smt. U.Madhudri,
25,J.R.Puram Circle,J.R.Puram,308/2023,2023,Job,1649100,20000,No,,Complainant Unwilling,No,No,,,,0,,,Sudheer,,,
26,Tekkali PS,Tekkali PS,426/2023,2023,Job,403467,95258,Yes,95258,2026-01-02,Yes,Partial,95258,36128,,59130,2026-02-06,Improper Court Order Received,Sudheer,"JMFC, Tekkali",Smt. U.Madhudri,Suspect verification pending
27,Amadalavalasa Circle,Ponduru,356/2023,2023,Job,602973,72280,Yes,72280,2026-01-05,No,No,,,,0,,Pending at court,Sudheer,"Judicial first class majestrate court, Ponduru",Smt.D.Jyotshna,
28,Srikakulam II Town,Srikakulam II Town,467/2023,2023,Job,406050,50000,Yes,406050,2026-02-19,Yes,No,406050,,,406050,02.05.2026,,Sarat,AJMFC Srikakulam,KM Jamruth Begum,
29,Amadalavalasa Circle,Amadalavalasa,442/2023,2023,Job,2572512,74870,Yes,279790,2024-12-10,No,No,,,,0,,"Returned with certain remarks, To be submitted again",Sudheer,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
30,Amadalavalasa Circle,Amadalavalasa,8/2024,2024,Job,1616106,223460,Yes,223460,2025-12-26,No,No,,,,0,,Pending at court,,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
31,Itchapuram Circle,Itchapuram Rural,13/2024,2024,Screen Sharing,1405280,78145,Yes,78145,,Yes,Yes,78145,78145,,0,26.11.2024,,Sudheer,"JMFC, Itchapuram",Sri.T.Paresh Kumar,
32,Tekkali Rural Circle,Kotabommali,22/2024,2024,Job,145770,59505,Yes,54505,2024-12-02,No,No,,,,0,,Pending at court,Sudheer,"JMFC, Kotabommali",S.Vani,
33,Srikakulam II Town,Srikakulam II Town,45/2024,2024,Job,1750000,481260,Yes,481260,18/02/2026,No,No,,,,0,,Pending at court,,AJMFC Srikakulam,KM Jamruth Begum,
34,Narasannapeta Circle,Jalumuru,27/2024,2024,Job,221900,221900,Yes,221900,2026-02-04,No,No,,,,0,,Returned with certain remarks on 10-04-2026,,"JMFC, Narasannapeta",S.Vani,
35,Amadalavalasa Circle,Sarubujjili,65/2024,2024,Job,665150,103000,Yes,103000,2025-01-28,Yes,Partial,103000,43000,60000,0,11.04.2025,,,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
36,Srikakulam Rural Circle,Srikakulam Rural,84/2024,2024,Job,3483424,1243063,Yes,97500,2026-03-16,Yes,Partial,97500,47500,,50000,16-06-2026,,,AJMFC Srikakulam,KM Jamruth Begum,UI
37,Sompeta Circle,Kanchili,75/2024,2024,Fake Website,486276,100000,Yes,100000,,Yes,Yes,100000,100000,,0,2024-01-11,,Sudheer,"JMFC, Sompeta",Sri.K.Srinivasarao,
38,Sompeta Circle,Sompeta,61/2024,2024,Job,1707530,324516,Yes,324516,,Yes,Yes,324516,324516,,0,2024-01-11,,,"JMFC, Sompeta",Sri.K.Srinivasarao,
39,Tekkali Rural Circle,Kotabommali,110/2024,2024,Job,4165000,634943,Yes,544943,2026-02-27,No,No,,,,0,,Pending at court,Sudheer,"JMFC, Kotabommali",S.Vani,
40,J.R.Puram Circle,Laveru,191/2024,2024,Job,450000,100000,No,,Complainant Unwilling,No,No,,,,0,,,Sarat,,,
41,Srikakulam Rural Circle,Srikakulam Rural,210/2024,2024,Digital Arrest,820671,196812,Yes,196812,2025-06-18,Yes,Partial,196812,99000,,97812,18.08.2025,,,AJMFC Srikakulam,KM Jamruth Begum,UI
42,Srikakulam II Town,Srikakulam II Town,134/2024,2024,Job,2529371,77722,Yes,77722,2025-10-20,No,No,,,,0,,Pending at court,Sudheer,AJMFC Srikakulam,KM Jamruth Begum,
43,Tekkali Rural Circle,Kotabommali,155/2024,2024,Job,1355744,302261,Yes,302261,2026-02-27,No,No,,,,0,,Pending at court,Sudheer,"JMFC, Kotabommali",S.Vani,
44,Tekkali Rural Circle,Santhabommali,145/2024,2024,Job,250000,53731,Yes,44000,2026-06-17,No,No,,,,0,,,Sudheer,"JMFC, Kotabommali",S.Vani,
45,Sompeta Circle,kanchili,177/2024,2024,UPI fraud,2103450,204944,Yes,194944,2025-12-22,Yes,Partial,194944,10850,6000,178094,2026-05-22,,Sudheer,"JMFC, Sompeta",Sri.K.Srinivasarao,
46,Amadalavalasa Circle,Ponduru,173/2024,2024,Job,303800,150000,Yes,150000,2025-02-25,Yes,Partial,150000,100000,50000,0,01.11.2025,,,"Judicial first class majestrate court, Ponduru",Smt.D.Jyotshna,
47,Tekkali Rural Circle,Kotabommali,175/2022,2022,fake website,154520,43410,No,,,No,No,,,,0,,,Sudheer,,,
48,Srikakulam II Town,Srikakulam II Town,20/2025,2025,Job,102000,20000,Yes,20000,2026-02-18,No,No,,,,0,,Pending at court,,AJMFC Srikakulam,KM Jamruth Begum,
49,J.R.Puram Circle,Laveru,35/2025,2025,Job,900000,193790,Yes,193790,2026-02-12,No,No,,,,0,,Pending at court,Sudheer,"JMFC, Srikakulam",KM Jamruth Begum,
50,Srikakulam Rural Circle,Srikakulam I Town,53/2025,2025,Screen Sharing,80000,80000,Yes,80000,2025-09-01,No,No,,,80000,0,,,Sudheer,"JMFC, Srikakulam",Sri. Anurag,UI
51,Kothuru Circle,Hiramandalam,43/2025,2025,Screen Sharing,72900,72900,Yes,72900,2025-11-22,Yes,Yes,72900,72900,,0,18.05.2026,,,"JMFC, Kothuru",Smt.K.Rani,
52,Srikakulam II Town,Srikakulam II Town,157/2025,2025,Investment,3436000,540623,Yes,540623,2026-09-03,Yes,Partial,540623,290000,,250623,2026-07-05,,,AJMFC Srikakulam,KM Jamruth Begum,
53,Srikakulam Rural Circle,Srikakulam I Town,52/2025,2025,Digital Arrest,1350000,1000000,Yes,1000000,,Yes,Yes,1000000,1000000,,0,-,,Sudheer,"JMFC, Srikakulam",Sri. Anurag,PT
54,Narasannapeta Circle,Jalumuru,166/2025,2025,Screen Sharing,1560000,351390,Yes,351390,,Yes,Yes,351390,351390,,0,11.03.2026,,own,"JMFC, Narasannapeta",S.Vani,
55,Srikakulam Rural Circle,Srikakulam Rural,272/2025,2025,Job,2191860,205000,Yes,89254,2025-12-15,YES,Partial,89254,35000(50000MRM),9254,#VALUE!,16-06-2026,,own,AJMFC Srikakulam,KM Jamruth Begum,UI
56,J.R.Puram Circle,Etcherla,275/2025,2025,Investment,3176580,58000,No,,complainant out of state,NO,NO,,,,0,,,Own,,,
57,Srikakulam Rural Circle,Gara,170/2025,2025,Investment,2500000,196000,Yes,196000,2026-03-16,No,No,,50000(MRM),,,,,,AJMFC Srikakulam,KM Jamruth Begum,UI
58,Pathapatnam Circle,Pathapatnam,138/2025,2025,Digital Arrest,80000,80000,Yes,80000,,Yes,Yes,80000,80000,,0,03.03.2026,,,"JMFC, Pathapatnam",S.Vani,
59,Srikakulam II Town,Srikakulam II Town,2/2026,2026,Investment,2414986,1208313,Yes,1208313,2026-01-20,Yes,Partial,1208313,138101,1070212,0,06.05.2026,,,AJMFC Srikakulam,KM Jamruth Begum,
60,Srikakulam Rural Circle,Srikakulam I Town,4/2026,2026,Investment,255500,249271,Yes,249271,2026-02-12,Yes,Yes,249271,249271,,,20-08-2026,,,"JMFC, Srikakulam",Sri. Anurag,UI
61,Srikakulam II Town,Srikakulam II Town,11/2026,2026,Investment,10305000,3500000,Yes,402827,2026-02-16,Yes,Partial,553055,182834,,370221,02.05.2026,,,AJMFC Srikakulam,KM Jamruth Begum,
62,Srikakulam II Town,Srikakulam II Town,12/2026,2026,Investment,1685110,768328,Yes,522900,2026-02-16,Yes,No,522900,,,522900,30.04.2026,,Sudheer,AJMFC Srikakulam,KM Jamruth Begum,
63,Kasibugga,Kasibugga,20/2026,2026,Investement fraud,2000000,1354000,Yes,726587,2026-02-13,Yes,Yes,726587,675000,,51587,2026-04-06,,,"Junior first class majestrate court, Palasa",Smt. U.Madhudri,
64,J.R.Puram Circle,G. Sigadam,10/2026,2026,Screen Sharing,557000,50000,Yes,119000,2026-07-05,Yes,Partial,119000,50000,,69000,2026-05-16,,eswar,"JMFC, Ponduru",,
65,Srikakulam Rural Circle,Srikakulam I Town,23/2026,2026,Fake Customer Care,249000,85004,Yes,85004,2026-04-02,Yes,Partial,85004,49307,35697,0,2026-06-03,,,"JMFC, Srikakulam",Sri. Anurag,UI
66,Srikakulam II Town,Srikakulam II Town,38/2026,2026,Investement fraud,1938125,1847672,Yes,1847672,2026-04-15,Yes,Partial,1847672,607236,595110,645326,05.05.2026,,,AJMFC Srikakulam,KM Jamruth Begum,
67,Srikakulam II Town,Srikakulam II Town,40/2026,2026,Digital Arrest,5625650,979680,Yes,795000,2026-06-10,NO,NO,,,,0,,,,,,
68,Srikakulam Rural Circle,Srikakulam I Town,27/2026,2026,Investement fraud,720000,233771,Yes,172893,10--04-2026,Yes,Yes,172893,165627 + (11000 MRM),,7266,2026-06-05,,,"JMFC, Srikakulam",Sri. Anurag,UI
69,Amadalavalasa Circle,Ponduru,38/2026,2026,OTP,125000,75000,Yes,75000,2026-03-23,No,No,,,,0,,Pending at court,,"Judicial first class majestrate court, Ponduru",Smt.D.Jyotshna,
70,Amadalavalasa Circle,Ponduru,37/2026,2026,Investement fraud,158200,105868,Yes,105868,2026-03-18,Yes,No,,,,0,,Pending at court,,"Judicial first class majestrate court, Ponduru",Smt.D.Jyotshna,
71,J.R.Puram Circle,Etcherla,55/2026,2026,Job Fraud,153000,93512,No,,Being Filed,NO,NO,,,,0,,,,,,
72,Pathapatnam Circle,Pathapatnam,40/2026,2026,Digital Arrest,200000,94000,Yes,94000,2026-04-06,yes,No,94000,,,94000,2026-06-08,,sarat,"JMFC, Pathapatnam",S.Vani,
73,Srikakulam II Town,Srikakulam II Town,41/2026,2026,Investement fraud,7068086,382591,No,,Being Filed,NO,NO,,,,0,,,,,,
74,Srikakulam Rural Circle,Srikakulam I Town,33/2026,2026,Digital Arrest,8212500,344917,No,,Being Filed,NO,NO,,"10,000+528(MRM)",,#VALUE!,,,,,,UI
75,Pathapatnam Circle,Pathapatnam,59/2026,2026,Investement fraud,1500000,70937,Yes,70206,2026-08-06,Yes,NO,70937,,,70937,16-06-2026,,satya,"JMFC, Pathapatnam",S.Vani,
76,Srikakulam Rural Circle,Srikakulam Rural,86/2026,2026,Investement fraud,477491,207000,Yes,207519,2026-06-05,Yes,No,207519,,,207519,2026-08-07,,,"JMFC, Srikakulam",Sri. Anurag,UI
77,J.R.Puram Circle,Laveru,75/2026,2026,Investement fraud,1354183,305988,No,,,No,No,,,,0,,,,,,
78,Srikakulam Rural Circle,Srikakulam I Town,61/2026,2026,Investement fraud,2564126,"4,27,126",Yes,94061,2026-02-07,No,No,,,,0,,,,,,UI
79,Tekkali PS,Tekkali PS,102/2026,2026,Digital Arrest,190000,"1,29,662",yes,129600,2026-06-19,No,No,129600,29600,,100000,2026-02-07,pending at court,chakri,"JMFC Court, Tekkali",,Suspect verification pending
80,Srikakulam II Town,Srikakulam II Town,55/2026,2026,Investement fraud,75840,69000,Yes,,2026-05-13,NO,NO,,,,,,,,,,
81,J.R.Puram Circle,Etcherla,134/2026,2026,Loan Fraud,297321,117879,NO,,,NO,NO,,,,,,,,,,
82,Amadalavalasa Circle,Burja,45/2026,2026,Investement fraud,822047,449665,Yes,447694,2026-07-23,Yes,Partial,447694,50000,,397694,14-10-2026,Pending at court,,"Junior first class majestrate court, Amadalavalasa",Smt.B.Ramya,
83,Srikakulam II Town,Srikakulam II Town,126/2026,2026,Apk Installation,"7,04,000","3,41,275",NO,,,,,,,,,,,,,,
Financial Cases Refund memo's filed in Hon'ble courts from the Year 2021 to 2026,,,,,,,,,,,,,,,,
S. No.,Name of the PS,Total Cases,Lost Amount,Hold Amount,No. of Memos  Filed in Court,Memo Filed Amount,No. of Memos Yet to be Filed in Court,Court Orders recieved,Amount for Which Court Order Was Issued,Court Orders Yet to be recieved,Refunded from bank ,,Amount Refunded from bank,,Refund pending from Bank Full/Partial,Amount Refund pending from Bank Full/Partial
,,,,,,,,,,,Full,Partial,Full,Partial,,
1,Srikakulam I Town,7,13431126,1992963,6,1681229,1,4,1507168,2,3,1,1249271,49307,1,208590
2,Srikakulam Rural,4,6973446,1851875,4,591085,0,4,591085,0,0,3,0,146500,4,444585
3,Gara,1,2500000,196000,1,196000,0,0,0,1,0,0,0,0,0,0
Srikakulam Rural Circle,,12,22904572,4040838,11,2468314,1,8,2098253,3,3,4,1249271,195807,5,653175
4,Srikakulam II Town,15,37923320,10407475,13,6784653,2,7,5110899,6,0,4,0,1218171,7,3892728
5,Amadalavalasa,7,9660169,1121917,6,1183222,1,4,679972,2,1,1,79972,200000,3,400000
6,Sarubujjili,2,747150,185000,1,103000,1,1,103000,0,0,1,0,43000,1,60000
7,Burja,2,1047047,554665,2,447694,0,1,447694,1,0,1,0,50000,1,397694
8,Ponduru,4,1189973,403148,4,403148,0,2,150000,2,0,1,0,100000,2,50000
Amadalavalasa,,15,12644339,2264730,13,2137064,2,8,1380666,5,1,4,79972,393000,7,907694
9,J.R.Puram,1,1649100,20000,0,0,1,0,0,0,0,0,0,0,0,0
10,Etcherla,7,4059501,635973,3,341582,4,1,173000,2,1,0,173000,0,0,0
11,Laveru,4,3159872,722948,1,193790,3,0,0,1,0,0,0,0,0,0
12,G. Sigadam,1,557000,119000,1,119000,0,1,119000,0,0,1,0,50000,1,69000
J.R Puram Circle,,13,9425473,1497921,5,654372,8,2,292000,3,1,1,173000,50000,1,69000
Srikakulam Sub-Division,,55,82897704,18210964,42,12044403,13,25,8881818,17,5,13,1502243,1856978,20,5522597
13,Tekkali PS,2,593467,95258,2,224858,0,1,95258,1,0,1,0,36128,1,59130
14,Santhabommali,1,250000,53731,1,44000,0,0,0,1,0,0,0,0,0,0
15,Naupada,1,485833,24000,1,24000,0,0,0,1,0,0,0,0,0,0
16,Kotabommali,5,5846902,1061719,3,901709,2,0,0,3,0,0,0,0,0,0
17,Nandigam,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Tekkali Rural Circle,,7,6582735,1139450,5,969709,2,0,0,5,0,0,0,0,0,0
18,Narasannapeta,1,212400,146300,1,146300,0,1,146300,0,0,1,0,59100,1,87200
19,Jalumuru,2,1781900,573290,2,573290,0,1,351390,1,1,0,351390,0,0,0
20,Polaki,2,299495,116357,2,116357,0,2,116357,0,1,1,24995,11362,1,80000
21,Saravakota,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Narasannapeta circle,,5,2293795,835947,5,835947,0,4,614047,1,2,2,376385,70462,2,167200
22,Pathapatnam,3,1780000,244937,3,244206,0,3,244937,0,1,0,80000,0,2,164937
23,Meliaputti,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Pathapatnam Circle,,3,1780000,244937,3,244206,0,3,244937,0,1,0,80000,0,2,164937
24,Kothuru,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
25,Hiramandalam,1,72900,72900,1,72900,0,1,72900,0,1,0,72900,0,0,0
Kothuru Circle,,1,72900,72900,1,72900,0,1,72900,0,1,0,72900,0,0,0
"Tekkali, Sub-Division",,18,11322897,2388492,16,2347620,2,9,1027142,7,4,3,529285,106590,5,391267
26,Kasibugga,2,2474960,1509726,2,882313,0,2,882313,0,2,0,830726,0,0,51587
27,Vajrapukothuru,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
28,Mandasa,2,532420,45368,2,45368,0,2,45368,0,2,0,45368,0,0,0
Kasibugga Rural circle,,2,532420,45368,2,45368,0,2,45368,0,2,0,45368,0,0,0
29,Sompeta,1,1707530,324516,1,324516,0,1,324516,0,1,0,324516,0,0,0
30,Kanchili,2,2589726,304944,2,294944,0,2,294944,0,1,1,100000,10850,1,184094
31,Baruva,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Sompeta Circle,,3,4297256,629460,3,619460,0,3,619460,0,2,1,424516,10850,1,184094
32,Itchapuram Town,2,2380300,485882,2,485882,0,2,485882,0,1,0,461854,0,1,24028
33,Itchapuram Rural,1,1405280,78145,1,78145,0,1,78145,0,1,0,78145,0,0,0
34,Kaviti,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Itchapuram Circle,,3,3785580,564027,3,564027,0,3,564027,0,2,0,539999,0,1,24028
"Kasibugga, Sub-Division",,10,11090216,2748581,10,2111168,0,10,2111168,0,8,1,1840609,10850,2,259709
Total,,83,105310817,23348037,68,16503191,15,44,12020128,24,17,17,3872137,1974418,27,6173573
,,,,,,,,,,,TOTAL REFUND,,5846555,,,
Sl. No.,PS,Circle,Sub-Division
1,Srikakulam I Town,Srikakulam Rural Circle,Srikakulam Sub-Division
2,Srikakulam Rural,Srikakulam Rural Circle,Srikakulam Sub-Division
3,Gara,Srikakulam Rural Circle,Srikakulam Sub-Division
4,Srikakulam II Town,,Srikakulam Sub-Division
5,Amadalavalasa,Amadalavalasa Circle,Srikakulam Sub-Division
6,Sarubujjili,Amadalavalasa Circle,Srikakulam Sub-Division
7,Burja,Amadalavalasa Circle,Srikakulam Sub-Division
8,Ponduru,Amadalavalasa Circle,Srikakulam Sub-Division
9,J.R.Puram,J.R.Puram Circle,Srikakulam Sub-Division
10,Etcherla,J.R.Puram Circle,Srikakulam Sub-Division
11,Laveru,J.R.Puram Circle,Srikakulam Sub-Division
12,G. Sigadam,J.R.Puram Circle,Srikakulam Sub-Division
13,Tekkali PS,,Tekkali Sub-Division
14,Kotabommali,Tekkali Rural Circle,Tekkali Sub-Division
15,Santhabommali,Tekkali Rural Circle,Tekkali Sub-Division
16,Naupada,Tekkali Rural Circle,Tekkali Sub-Division
17,Nandigam,Tekkali Rural Circle,Tekkali Sub-Division
18,Narasannapeta,Narasannapeta Circle,Tekkali Sub-Division
19,Jalumuru,Narasannapeta Circle,Tekkali Sub-Division
20,Polaki,Narasannapeta Circle,Tekkali Sub-Division
21,Saravakota,Narasannapeta Circle,Tekkali Sub-Division
22,Kothuru,Kothuru Circle,Tekkali Sub-Division
23,Hiramandalam,Kothuru Circle,Tekkali Sub-Division
24,Pathapatnam,Pathapatnam Circle,Tekkali Sub-Division
25,Meliaputti,Pathapatnam Circle,Tekkali Sub-Division
26,Kasibugga,,Kasibugga Sub-Division
27,Vajrapukothuru,Kasibugga Rural Circle,Kasibugga Sub-Division
28,Mandasa,Kasibugga Rural Circle,Kasibugga Sub-Division
29,Sompeta,Sompeta Circle,Kasibugga Sub-Division
30,Baruva,Sompeta Circle,Kasibugga Sub-Division
31,Kanchili,Sompeta Circle,Kasibugga Sub-Division
32,Itchapuram Town,Itchapuram Circle,Kasibugga Sub-Division
33,Itchapuram Rural,Itchapuram Circle,Kasibugga Sub-Division
34,Kaviti,Itchapuram Circle,Kasibugga Sub-Division
35,"Mahila PS, Srikakulam",,
36,Srikakulam Traffic,,
"""

lines = raw_input.strip().split('\n')

# Find sections
# Section 1: Cases (lines 0 to index where "Financial Cases Refund" starts)
split_idx_1 = -1
split_idx_2 = -1

for idx, line in enumerate(lines):
    if "Financial Cases Refund memo" in line:
        split_idx_1 = idx
    if "Sl. No.,PS,Circle,Sub-Division" in line:
        split_idx_2 = idx

print(f"Split 1 at {split_idx_1}, Split 2 at {split_idx_2}")

# 1. Parse Cases
cases_csv = "\n".join(lines[:split_idx_1])
reader = csv.reader(io.StringIO(cases_csv))
case_headers = next(reader)

def clean_amount(val):
    if not val:
        return 0
    # Extract only main number if expressions exist
    # e.g., "165627 + (11000 MRM)" -> 176627 or 165627?
    v = str(val).replace(',', '').strip()
    if v == '#VALUE!' or v == '-':
        return 0
    # match numbers
    nums = re.findall(r'\d+', v)
    if nums:
        # sum numbers if '+'
        if '+' in v:
            return sum(int(n) for n in nums)
        return int(nums[0])
    return 0

cases = []
for row in reader:
    if not row or not row[0].isdigit():
        continue
    item = {}
    for i, h in enumerate(case_headers):
        val = row[i].strip() if i < len(row) else ""
        item[h] = val
    
    # normalized fields
    item['s_no'] = int(item['S No'])
    item['circle'] = item['Circle']
    item['police_station'] = item['POLICE STATION']
    item['fir_no'] = item['FIR NO']
    item['year'] = int(item['Year']) if item['Year'].isdigit() else 2026
    item['sub_category'] = item['Sub-Category']
    item['lost'] = clean_amount(item['Lost'])
    item['lost_display'] = item['Lost']
    item['lien'] = clean_amount(item['Lien'])
    item['lien_display'] = item['Lien']
    item['memo_filed'] = item['Memo Filed Yes or No?'].strip()
    item['memo_filed_amount'] = clean_amount(item['Memo Filed Amount'])
    item['memo_filed_amount_display'] = item['Memo Filed Amount']
    item['memo_filed_date_or_reason'] = item['Memo Filed date / If Not Filed Reason for not filiing']
    item['court_order_received'] = item['Court order Recieved Yes or No?'].strip()
    item['amount_refunded_status'] = item['Amount Refunded Yes or No or Partial ?'].strip()
    item['court_order_amount'] = clean_amount(item['Amount for Which Court Order Was Issued'])
    item['court_order_amount_display'] = item['Amount for Which Court Order Was Issued']
    item['refund_from_bank'] = clean_amount(item['Refund From bank'])
    item['refund_from_bank_display'] = item['Refund From bank']
    item['funds_not_available'] = clean_amount(item['Funds not availble in banks'])
    item['funds_not_available_display'] = item['Funds not availble in banks']
    item['to_be_refunded_from_bank'] = clean_amount(item['To be refunded from Bank'])
    item['to_be_refunded_from_bank_display'] = item['To be refunded from Bank']
    item['court_order_date'] = item['COURT ORDER RECEIVED DATE']
    item['reasons_not_received'] = item['Reasons for not Receving Court orders']
    item['technical_asst'] = item['Technical asst']
    item['court_name'] = item['Court name']
    item['judge_name'] = item['Judge Name']
    item['stage_of_case'] = item['Stage of the case']
    cases.append(item)

print(f"Parsed {len(cases)} cases successfully.")

# 2. Parse Abstract Table
abstract_csv = "\n".join(lines[split_idx_1:split_idx_2])
abstract_reader = csv.reader(io.StringIO(abstract_csv))
# Skip title line
title_line = next(abstract_reader)
# Header line 1 and 2
h1 = next(abstract_reader)
h2 = next(abstract_reader)

abstract_rows = []
total_refund_row = None

for row in abstract_reader:
    if not row or not any(row):
        continue
    # Check if total refund label
    if 'TOTAL REFUND' in " ".join(row):
        total_refund_row = row
        continue
    
    # Identify type: Station, Circle Total, Sub-Division Total, or Grand Total
    first_col = row[0].strip()
    second_col = row[1].strip() if len(row) > 1 else ""
    
    row_type = "station"
    name = second_col
    sl_no = first_col
    
    if first_col == "Total":
        row_type = "grand_total"
        name = "Grand Total"
    elif "Sub-Division" in first_col or "Sub-Division" in second_col:
        row_type = "sub_division_total"
        name = first_col if first_col else second_col
    elif "Circle" in first_col or "Circle" in second_col or first_col == "Amadalavalasa":
        row_type = "circle_total"
        name = first_col if first_col else second_col
    
    # Parse columns safely
    # S. No., Name of the PS, Total Cases, Lost Amount, Hold Amount, No. of Memos Filed, Memo Filed Amount,
    # No. of Memos Yet to be Filed, Court Orders received, Amount for Which Court Order Issued,
    # Court Orders Yet to be received, Refunded Full, Refunded Partial, Amount Full, Amount Partial,
    # Refund pending count, Refund pending amount
    
    def get_num(idx):
        if idx < len(row) and row[idx].strip():
            v = row[idx].replace(',', '').strip()
            return int(v) if v.lstrip('-').isdigit() else 0
        return 0

    abstract_rows.append({
        'sl_no': sl_no,
        'name': name,
        'type': row_type,
        'total_cases': get_num(2),
        'lost_amount': get_num(3),
        'hold_amount': get_num(4),
        'memos_filed': get_num(5),
        'memo_filed_amount': get_num(6),
        'memos_yet_to_file': get_num(7),
        'court_orders_received': get_num(8),
        'court_orders_amount': get_num(9),
        'court_orders_yet_to_receive': get_num(10),
        'refunded_full_count': get_num(11),
        'refunded_partial_count': get_num(12),
        'amount_refunded_full': get_num(13),
        'amount_refunded_partial': get_num(14),
        'total_amount_refunded': get_num(13) + get_num(14),
        'refund_pending_count': get_num(15),
        'refund_pending_amount': get_num(16)
    })

print(f"Parsed {len(abstract_rows)} abstract rows.")

# 3. Parse PS Mapping
ps_map_csv = "\n".join(lines[split_idx_2:])
ps_reader = csv.reader(io.StringIO(ps_map_csv))
ps_h = next(ps_reader)
ps_mapping = []
for r in ps_reader:
    if not r or not r[0].strip().isdigit():
        continue
    ps_mapping.append({
        'sl_no': int(r[0]),
        'ps': r[1].strip(),
        'circle': r[2].strip() if len(r) > 2 else '',
        'sub_division': r[3].strip() if len(r) > 3 else ''
    })

print(f"Parsed {len(ps_mapping)} PS mappings.")

# Summary statistics
summary = {
    'total_cases': 83,
    'total_lost': 105310817,
    'total_hold': 23348037,
    'memos_filed_count': 68,
    'memos_filed_amount': 16503191,
    'memos_yet_to_file_count': 15,
    'court_orders_received_count': 44,
    'court_orders_amount': 12020128,
    'court_orders_pending_count': 24,
    'refunded_full_cases': 17,
    'refunded_partial_cases': 17,
    'refunded_total_cases': 34,
    'amount_refunded_full': 3872137,
    'amount_refunded_partial': 1974418,
    'total_refunded_amount': 5846555,
    'refund_pending_cases': 27,
    'refund_pending_amount': 6173573
}

full_data = {
    'summary': summary,
    'abstract': abstract_rows,
    'cases': cases,
    'ps_mapping': ps_mapping
}

# Write to data/court_refunds.json and public/data/court_refunds.json
os.makedirs('data', exist_ok=True)
os.makedirs('public/data', exist_ok=True)

with open('data/court_refunds.json', 'w', encoding='utf-8') as f:
    json.dump(full_data, f, indent=2, ensure_ascii=False)

with open('public/data/court_refunds.json', 'w', encoding='utf-8') as f:
    json.dump(full_data, f, indent=2, ensure_ascii=False)

print("Saved successfully to data/court_refunds.json and public/data/court_refunds.json!")
