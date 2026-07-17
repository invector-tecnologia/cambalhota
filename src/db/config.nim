type
  PgConfig* = object
    host*: string
    port*: int
    user*: string
    password*: string
    database*: string
    schema*: string
    sslMode*: string

func initPgConfig*(host, user, password, database: string, port: int = 5432, schema: string = "Cambalhota", sslMode: string = "require"): PgConfig =
  ## Initializes a new PgConfig with the correct defaults.
  ## Note: Schema must be 'Cambalhota' and NEVER 'public' by rule.
  result = PgConfig(
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    schema: schema,
    sslMode: sslMode
  )
