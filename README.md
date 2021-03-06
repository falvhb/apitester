# Sleek API testing for GET endpoints

Fetch some endpoints, compare results to baseline. Success.

    npm i @falvhb/apitester

Add to package.json

    "scripts": {
      "test": "BASE_URL=\"http://localhost:8080\" apitester"
    },

Run tests with

    npm test

## Guide

Put files in `baseline` folder similar to the API paths you want to test:

A file in

    baseline/test/info.json


will result in a GET request to

    http://localhost:8080/test/info

and compare the results to the local file.  


### Different baseline folder

Set the BASE_FOLDER env variable, e.g.

    "scripts": {
      "test": "BASE_FOLDER=tests BASE_URL=\"http://localhost:8080\" apitester"
    },

### Slash handling
You can replace a slash `/` in the path with `*slash*`:

    baseline/test*slash*info.json

will also fetch

    http://localhost:8080/test/info


## Adding tests shorthand method

Add to package.json

    "scripts": {
      "add": "REMOVE_PATH=\"/api/content\" apitester add"
    },

and run it with

    npm run add -- http://localhost:4200/api/content/test/content/

The `REMOVE_PATH` variable is totally optional.