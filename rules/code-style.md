# code style

- typescript strict mode
- no any unless justified with TODO
- functional helpers > duplicated logic
- errors are typed (AppError)
- logs: structured, no pii
- every endpoint: validate input + auth + privacy + return typed response
- few short phrase comments