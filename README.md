# code-snippets
Code Snippets I'm Proud to Have Written

### useSessionStorage.ts
- Like useLocalStorage but can be used for session storage -- useful for form state when navigating in wizard and can be used to notify user when navigating away from the page if they're data will persist or not

### get_columns.py
- fetches data from an endpoint (in this case it was a massive dataset)
- The data could only be of a certain type -- this uses a python generator function, based on the returned date and types, to conserve memory (since we don't know the size of the dataset) and casts the final result to a list to be consumed by the client

### Process.tsx
- a lot of code redacted here
- The odd structure is to avoid needing to use a third party package with a lot of overhead like React Hook Forms
- The Process generates a certain set of input fields that can be added and removed
- those fields remain in sync with one another -- esp tricky when dealing with MUI autocomplete
