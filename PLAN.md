# Plan for the App

## Get Data
DB-App exports Journey-Information like this:
'''
Deggendorf Hbf -> Regensburg-Prüfening
15.10.2023

WBA RB35
To ...
From ...
To ...

ag RB17
To Neustadt(Donau)
From 22:08 Plattling, platform 6
To 22:57 Regensburg-Prüfening, platform 3
'''
This can be used to get the Target-Station, Train and Changes using the DB Timetables API.

## Find Target-Station (EVA-Number)
- Extract 'Regensburg-Prüfening' using RegEx (Target-Station) => 8004983
- Get eva-number of the Target-Station
    - Using GET /station/{target-staion}

## Find Arriving Train (ID)
- Extract '231015' using RegEx (Day of Arrival)
- Extract '22' using RegEx (Hour-Slice of Arrival)
- Fetch regular Timetable for the Hour-Slice of Arrival
    - Using GET /plan/{evaNo}/{date}/{hour}
- Find Arriving Trains from Starting-Station 'Plattling'
    - Use Arriving Time '22:57' as refrence
    - Give Option of earlier and later Trains
- Let the User Choose the Train

## Display shareable Page
This Page takes the EVA-ID and Train-ID as in URL-Parameter. It shows the Arriving-Time of the Train, recent Changes and Delays.

## Get all Changes
- Fetch Full-Changes for EVA-Number
    - Using GET /fchg/{evaNo}
- Look for Changes for the Train-ID

## Get recent Changes
- Refresh by fetching Recent-Changes for EVA-Numbert
    - Using GET /rchg/{evaNo}
- Look for Changes for the Train-ID
