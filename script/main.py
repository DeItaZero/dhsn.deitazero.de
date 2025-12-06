import json
import requests
import dotenv
import os
import truststore


if __name__ == '__main__':
    dotenv.load_dotenv(".env")
    USER_ID, HASH = os.environ.get("USER_ID"), os.environ.get("HASH")

    truststore.inject_into_ssl()
    query_params = {
        "userid": USER_ID,
        "hash": HASH
    }
    response = requests.get(f"https://selfservice.campus-dual.de/room/json", params=query_params, verify=True)
    payload = response.json()
    payload = json.dumps(payload, ensure_ascii=False, indent=2)

    query_params = {
        "studentId": f"s{USER_ID}",
        "seminarGroupId": "CS23-2"
    }
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.post("http://localhost:3000/api/timetable", payload,
                             params=query_params, headers=headers, verify=True)
