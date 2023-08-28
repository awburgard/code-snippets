def get_columns_for_blind_stats(asset, user, request_data, team=None, timeout=10):
    """
    This function retrieves data from a blind sample, and then returns the names of fields
    which are either 'int64' or 'float64'.
    """
    INT_FLOAT_TYPES = ("int64", "float64")
    owner_team = asset.owner_team
    url = owner_team.organization.access_point.uri.replace("//", "")
    url = f"https://{url}/blind_sample/{asset.filename}/spec"
    headers = {
        "Authorization": f"Bearer {Generator().issue_provider_marketplace(owner_team.organization.id)}",
        "Accept": "text/csv",
        "Requester": str(user.get_users_team(team).id),
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
