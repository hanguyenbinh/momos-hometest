
# Hometest backend


## Authors

- [@binhvtl](https://www.github.com/octokatherine)


## Documentation

this project using restful for APIs  & its naming convention for naming the APIs.
please take a look at ERD.png and System.png for more information


### API documnent:
To access api document, please start the project first, then access this link
http://host:port/swagger

### API response:
```bash
all api response are formatted using this structure:
status: true/false: true success, false error or not found
message: string, in Key form, for mutiligual frontend
data: contain data of the api, data is array if call get multiple objects, or is object if get one
ex: {
    food: { ...foodProperties}
}
```

### Error handling
```bash
All errors will be catched by the AllExceptionsFilter
please take a look at /project_dir/src/common/exception-filters
```

### Logic
- all user can view all food, ration, register new user, and login
- user have to login to access these api:
```bash
    modify food
    modify ration
    access body record
    access diary
    access exercise log
```
## Deployment

### Deploy at local

```bash
  docker-compose up hometest_db => start database using docker
  npm i
  npm run start:dev
```

### Deploy at local using docker

```bash
  docker-compose up --build  
```

### Migration:
this project uses code-first method to deal with database table. All database changes must be in code first, do not modify directly anything from database
Step to update/add database table:
- create or modify the entities
- run migration command:
```bash
   npm run migration:generate --name=<migration name>
```
Note: if you want to change the type of column, you have to add some code to convert all data to new data. If not, data may be lost.

- apply migration:
```bash
   npm run migration:run
```

- revert last migration:
```bash
   npm run migration:revert
```

- manual create new migration:
```bash
   npm run migration:create --name=<migration name>
```

- view migration:
```bash
   npm run migration:show
```

### Project configuration:

```bash
Based on NODE_ENV value, there are some associated config file, their format is like the following:
config.<env name>.yaml
ex: if you want to create the testing env, do these steps:
- create the config file: config.testing.yaml
- define the NODE_ENV: NODE_ENV=testing && npm run start:dev
```




## Acknowledgements

 - [NestJS framework](https://docs.nestjs.com/)
 - [TypeORM](https://typeorm.io/)

