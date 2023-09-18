# Code Snippets
Code Snippets I'm Proud to Have Written

### [useSessionStorage.ts](https://github.com/awburgard/code-snippets/blob/master/useSessionStorage.ts)
- Like useLocalStorage but can be used for session storage -- useful for form state when navigating in wizard and can be used to notify user when navigating away from the page if they're data will persist or not

### [get_columns.py](https://github.com/awburgard/code-snippets/blob/master/get_columns.py)
- fetches data from an endpoint (in this case it was a massive dataset)
- The data could only be of a certain type -- this uses a python generator function, based on the returned date and types, to conserve memory (since we don't know the size of the dataset) and casts the final result to a list to be consumed by the client

### [validator.ts](https://github.com/awburgard/code-snippets/blob/master/validator.ts)
- relies on a call to a json schema I set up at a previous company to accomplish type validation across services
- creates the necessary data and in the neccesary shape to post to one of our services
- particularly proud of the types (I cannot share those) but the class, when invoked, will infer the meta template, an incredibly neccesary process when uploading datasets in our use case

### [date_time_generator.py](https://github.com/awburgard/code-snippets/blob/master/date_time_generator.py)
- a custom date_time mock data generator based on faker.py
- users can select this type of generator from the client
- it would then talk to our many different services and eventually land here
- it would take in the column data and rewrite it to be whatever type the user had specified, and overwrite the csv file (not shown)

### [useCommits.ts](https://github.com/awburgard/code-snippets/blob/master/useCommits.ts)
- a custom hook to fetch github commits from different services
- does a diff check to see if all services are on the same commit, if they are return the main services commit sha
- otherwise return the services and their respective shas
