def get_columns(asset, user, request_data, team=None, timeout=10):
    """
    This function retrieves data from a blind sample, and then returns the names of fields
    which are either 'int64' or 'float64'.
    """
    INT_FLOAT_TYPES = ("int64", "float64")
    owner_team = REDACTED
    url = REDACTED
    url = REDACTED
    headers = {
        "Authorization": f"Bearer REDACTED",
        "Accept": "text/csv",
        "Requester": REDACTED,
    }
    try:
        response = requests.get(
            url, headers=headers, data=request_data, timeout=timeout
        )
        response.raise_for_status()  # will raise an HTTPError if the response was unsuccessful
    except requests.exceptions.RequestException as e:
        return {}, "", f"An error occurred: {str(e)}", response.status_code

    try:
        data = response.json()
    except ValueError:
        return {}, "", "Unable to parse response data.", 200

    names_of_int_or_float_fields = (
        field["name"] for field in data["fields"] if field["type"] in INT_FLOAT_TYPES
    )
    return list(names_of_int_or_float_fields), "", "", 200
