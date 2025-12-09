import json
import sys

import requests
import dotenv
import os
import truststore


if __name__ == '__main__':
    dotenv.load_dotenv(".env")
    BASE_URL = os.getenv("BASE_URL")
    USER_ID = os.environ.get("USER_ID")
    HASH = os.environ.get("HASH")
    SEMINAR_GROUP = os.environ.get("SEMINAR_GROUP")

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
        "seminarGroupId": SEMINAR_GROUP
    }
    headers = {
        'Content-Type': 'application/json'
    }
    ENDPOINT = "/api/timetable"
    response = requests.post(f"{BASE_URL.rstrip('/')}/{ENDPOINT.lstrip('/')}", payload,
                             params=query_params, headers=headers, verify=True)

    if response.status_code != 201:
        sys.stderr.write("Request failed with status code: " + str(response.status_code))
    else:
        print("Successfully synced timetable!")
