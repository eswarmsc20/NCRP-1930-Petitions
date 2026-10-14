import csv
import json
import io
import re

raw_data = """S No,Circle,POLICE STATION,FIR NO,Year,Sub-Category,Lost,Lien,Memo Filed Yes or No?,Memo Filed Amount,Memo Filed date / If Not Filed Reason for not filiing,Court order Recieved Yes or No?,Amount Refunded Yes or No or Partial ?,Amount for Which Court Order Was Issued,Refund From bank,Funds not availble in banks,To be refunded from Bank,COURT ORDER RECEIVED DATE,Reasons for not Receving Court orders,Technical asst,Court name,Judge Name,Stage of the case
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
"""

# Let's parse the 83 cases
reader = csv.reader(io.StringIO(raw_data.strip()))
headers = next(reader)
print("Headers:", headers)
cases = []
for row in reader:
    if not row or not row[0].isdigit():
        break
    case = {}
    for i, h in enumerate(headers):
        val = row[i].strip() if i < len(row) else ""
        case[h] = val
    cases.append(case)

print(f"Total parsed cases: {len(cases)}")
print("Sample case 1:", cases[0])
print("Sample case 83:", cases[-1])
