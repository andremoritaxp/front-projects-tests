
Create Postgres
```shell
docker run --name myfinance-postgres -e POSTGRES_PASSWORD=myfinance-postgres -p 5432:5432 -d postgres
```

TypeORM - Migrate run
```shell
yarn typeorm migration:run
npm run typeorm migration:run
```

TypeORM - Migrate revert
```shell
yarn typeorm migration:run
npm run typeorm migration:revert
```

TypeORM - Migrate reset
```shell
yarn typeorm migration:run
npm run typeorm migration:reset
```


